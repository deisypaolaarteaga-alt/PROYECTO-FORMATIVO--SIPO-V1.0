'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { guardarSnapshot } from '@/actions/versiones';
import type { ActionResult } from '@/types';

type EstadoPresupuesto =
  | 'borrador' | 'en_revision' | 'aprobado' | 'rechazado' | 'archivado'
  | 'enviado_a_cliente' | 'visto_por_cliente' | 'aprobado_por_cliente'
  | 'rechazado_por_cliente' | 'con_observaciones';

// Flujo canónico definitivo
const TRANSICIONES_PERMITIDAS: Record<EstadoPresupuesto, EstadoPresupuesto[]> = {
  borrador:               ['enviado_a_cliente', 'aprobado'],
  enviado_a_cliente:      ['visto_por_cliente'],
  visto_por_cliente:      ['aprobado_por_cliente', 'rechazado_por_cliente', 'con_observaciones'],
  aprobado_por_cliente:   ['aprobado'],
  rechazado_por_cliente:  ['borrador'],
  con_observaciones:      ['borrador'],
  aprobado:               ['borrador'],
  // Compatibilidad — presupuestos legacy en en_revision pueden aprobarse o reabrirse
  en_revision:            ['aprobado', 'borrador'],
  rechazado:              ['borrador'],
  archivado:              [],
};

async function avanzarProyectoSiCorresponde(projectId: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: proyecto } = await admin
      .from('projects')
      .select('estado')
      .eq('id', projectId)
      .single();
    if (proyecto?.estado === 'borrador') {
      await admin
        .from('projects')
        .update({ estado: 'en_progreso', updated_at: new Date().toISOString() })
        .eq('id', projectId);
    }
  } catch { /* silencioso */ }
}

export async function cambiarEstadoPresupuesto(
  budgetId: string,
  nuevoEstado: EstadoPresupuesto,
  notas?: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const { data: budget, error: fetchErr } = await supabase
      .from('budgets')
      .select('estado, version, user_id, project_id')
      .eq('id', budgetId)
      .single();

    if (fetchErr || !budget) return { success: false, error: 'Presupuesto no encontrado' };
    if (budget.user_id !== user.id) return { success: false, error: 'No tienes permiso' };

    const estadoActual = budget.estado as EstadoPresupuesto;
    const permitidos = TRANSICIONES_PERMITIDAS[estadoActual] ?? [];
    if (!permitidos.includes(nuevoEstado)) {
      return {
        success: false,
        error: `Transición no permitida: de ${estadoActual} a ${nuevoEstado}`,
      };
    }

    // Guardar snapshot ANTES de transiciones críticas
    if (nuevoEstado === 'aprobado') {
      await guardarSnapshot(budgetId, 'aprobacion');
    } else if (estadoActual === 'rechazado_por_cliente' && nuevoEstado === 'borrador') {
      await guardarSnapshot(budgetId, 'rechazo_cliente');
    } else if (
      (estadoActual === 'con_observaciones' || estadoActual === 'aprobado') &&
      nuevoEstado === 'borrador'
    ) {
      await guardarSnapshot(budgetId, 'reapertura_manual');
    }

    // Admin client: necesario para actualizar presupuestos en estado aprobado (RLS budgets_update_lock)
    const admin = createAdminClient();
    const { error: updateErr } = await admin
      .from('budgets')
      .update({
        estado: nuevoEstado,
        notas_revision: notas || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', budgetId);

    if (updateErr) throw updateErr;

    // Registrar en audit_log (fire-and-forget)
    void (async () => {
      try {
        await supabase.from('audit_log').insert({
          tabla: 'budgets',
          operacion: 'CAMBIO_ESTADO',
          registro_id: budgetId,
          user_id: user.id,
          datos_anteriores: { estado: estadoActual },
          datos_nuevos: { estado: nuevoEstado, notas: notas || null },
        });
      } catch { /* silencioso */ }
    })();

    // Auto-avanzar proyecto cuando se aprueba el presupuesto
    if (nuevoEstado === 'aprobado' && budget.project_id) {
      await avanzarProyectoSiCorresponde(budget.project_id);
    }

    revalidatePath(`/presupuestos/${budgetId}`);
    if (budget.project_id) {
      revalidatePath(`/proyectos/${budget.project_id}`);
      revalidatePath('/proyectos');
    }
    return { success: true };
  } catch {
    return { success: false, error: 'Error al cambiar el estado del presupuesto.' };
  }
}

/**
 * Duplica un presupuesto existente usando una función PostgreSQL atómica.
 * La función fn_duplicar_presupuesto maneja toda la copia en una sola transacción
 * (capítulos → actividades → APUs → apu_items), eliminando el riesgo de
 * estados parciales y los timeouts por N round-trips individuales.
 */
export async function duplicarPresupuesto(budgetId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const { data: budget } = await supabase
      .from('budgets')
      .select('project_id')
      .eq('id', budgetId)
      .eq('user_id', user.id)
      .single();

    if (!budget) return { success: false, error: 'Presupuesto no encontrado.' };

    const { data: newBudgetId, error } = await supabase.rpc('fn_duplicar_presupuesto', {
      p_budget_id: budgetId,
      p_user_id:   user.id,
    });

    if (error) throw error;

    revalidatePath(`/proyectos/${budget.project_id}`);
    revalidatePath('/proyectos');
    return { success: true, data: { id: newBudgetId } };
  } catch (error) {
    console.error('[duplicarPresupuesto]', error);
    return { success: false, error: 'Error al duplicar el presupuesto.' };
  }
}
