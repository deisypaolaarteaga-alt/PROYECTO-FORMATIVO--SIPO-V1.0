'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { guardarSnapshot } from '@/actions/versiones';
import type { ActionResult } from '@/types';

type EstadoPresupuesto =
  | 'borrador' | 'en_revision' | 'aprobado' | 'rechazado' | 'archivado'
  | 'rechazado_por_cliente' | 'con_observaciones';

const TRANSICIONES_PERMITIDAS: Record<EstadoPresupuesto, EstadoPresupuesto[]> = {
  borrador:               ['en_revision'],
  en_revision:            ['aprobado', 'rechazado'],
  aprobado:               ['archivado'],
  rechazado:              ['borrador'],
  archivado:              [],
  rechazado_por_cliente:  ['borrador'],
  con_observaciones:      ['borrador'],
};

/**
 * Cambia el estado de un presupuesto validando la máquina de estados
 */
export async function cambiarEstadoPresupuesto(
  budgetId: string,
  nuevoEstado: EstadoPresupuesto,
  notas?: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    // 1. Obtener estado actual
    const { data: budget, error: fetchErr } = await supabase
      .from('budgets')
      .select('estado, version, user_id, project_id')
      .eq('id', budgetId)
      .single();

    if (fetchErr || !budget) return { success: false, error: 'Presupuesto no encontrado' };
    if (budget.user_id !== user.id) return { success: false, error: 'No tienes permiso' };

    // 2. Validar transición
    const estadoActual = budget.estado as EstadoPresupuesto;
    if (!TRANSICIONES_PERMITIDAS[estadoActual].includes(nuevoEstado)) {
      return { 
        success: false, 
        error: `Transición no permitida: de ${estadoActual} a ${nuevoEstado}` 
      };
    }

    // 3. Guardar snapshot ANTES de transiciones críticas
    if (nuevoEstado === 'aprobado') {
      await guardarSnapshot(budgetId, 'aprobacion');
    } else if (nuevoEstado === 'rechazado') {
      await guardarSnapshot(budgetId, 'rechazo_cliente');
    } else if (
      (estadoActual === 'rechazado' || estadoActual === 'rechazado_por_cliente') &&
      nuevoEstado === 'borrador'
    ) {
      await guardarSnapshot(budgetId, 'reapertura_manual');
    }

    // 4. Actualizar estado
    const { error: updateErr } = await supabase
      .from('budgets')
      .update({ 
        estado: nuevoEstado, 
        notas_revision: notas || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', budgetId);

    if (updateErr) throw updateErr;

    // Registrar cambio en audit_log (fire-and-forget)
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

    revalidatePath(`/presupuestos/${budgetId}`);
    if (budget.project_id) {
      revalidatePath(`/proyectos/${budget.project_id}`);
      revalidatePath('/proyectos');
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Error al cambiar el estado del presupuesto.' };
  }
}

/**
 * Guarda snapshot de la versión rechazada y regresa el presupuesto a borrador.
 * Debe llamarse desde el editor cuando el constructor decide corregir el presupuesto.
 */
export async function corregirPresupuesto(budgetId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const { data: budget, error: fetchErr } = await supabase
      .from('budgets')
      .select('estado, user_id, project_id')
      .eq('id', budgetId)
      .single();

    if (fetchErr || !budget) return { success: false, error: 'Presupuesto no encontrado' };
    if (budget.user_id !== user.id) return { success: false, error: 'No tienes permiso' };
    if (budget.estado !== 'rechazado_por_cliente') {
      return { success: false, error: 'El presupuesto no está en estado rechazado por el cliente' };
    }

    // Congelar la versión rechazada antes de reabrir
    await guardarSnapshot(budgetId, 'rechazo_cliente');

    const { error: updateErr } = await supabase
      .from('budgets')
      .update({ estado: 'borrador', updated_at: new Date().toISOString() })
      .eq('id', budgetId);

    if (updateErr) throw updateErr;

    revalidatePath(`/presupuestos/${budgetId}`);
    if (budget.project_id) {
      revalidatePath(`/proyectos/${budget.project_id}`);
      revalidatePath('/proyectos');
    }
    return { success: true };
  } catch {
    return { success: false, error: 'Error al corregir el presupuesto.' };
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

    // Obtener project_id antes del RPC para poder revalidar la ruta del proyecto
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
