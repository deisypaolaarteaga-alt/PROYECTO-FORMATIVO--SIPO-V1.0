'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/types';

type EstadoPresupuesto = 'borrador' | 'en_revision' | 'aprobado' | 'rechazado' | 'archivado';

const TRANSICIONES_PERMITIDAS: Record<EstadoPresupuesto, EstadoPresupuesto[]> = {
  borrador: ['en_revision'],
  en_revision: ['aprobado', 'rechazado'],
  aprobado: ['archivado'],
  rechazado: ['borrador'],
  archivado: [],
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
      .select('estado, version, user_id')
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

    // 3. Si se aprueba, tomar snapshot
    if (nuevoEstado === 'aprobado') {
      const { data: fullBudget } = await supabase
        .from('budgets')
        .select(`
          *,
          chapters (
            *,
            activities (
              *,
              apus (
                *,
                apu_items (*)
              )
            )
          )
        `)
        .eq('id', budgetId)
        .single();

      if (fullBudget) {
        await supabase.from('budget_snapshots').insert({
          budget_id: budgetId,
          user_id: user.id,
          version: budget.version,
          datos_json: fullBudget
        });
      }
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

    revalidatePath(`/presupuestos/${budgetId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Error al cambiar el estado del presupuesto.' };
  }
}

/**
 * Duplica un presupuesto existente (Deep Copy)
 */
export async function duplicarPresupuesto(budgetId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    // 1. Obtener datos completos
    const { data: b, error: bErr } = await supabase
      .from('budgets')
      .select(`
        *,
        chapters (
          *,
          activities (
            *,
            apus (
              *,
              apu_items (*)
            )
          )
        )
      `)
      .eq('id', budgetId)
      .single();

    if (bErr || !b) return { success: false, error: 'Error al cargar origen' };

    // 2. Insertar nuevo presupuesto
    const { data: newBudget, error: nbErr } = await supabase
      .from('budgets')
      .insert({
        project_id: b.project_id,
        user_id: user.id,
        titulo: `${b.titulo} (copia)`,
        estado: 'borrador',
        metodo_aiu: b.metodo_aiu,
        administracion_pct: b.administracion_pct,
        imprevistos_pct: b.imprevistos_pct,
        utilidad_pct: b.utilidad_pct,
        iva_porcentaje: b.iva_porcentaje,
        metodo_iva: b.metodo_iva,
        moneda: b.moneda
      })
      .select()
      .single();

    if (nbErr) throw nbErr;

    // 3. Duplicar Capítulos -> Actividades -> APUs
    for (const cap of (b.chapters || [])) {
      const { data: newCap } = await supabase
        .from('chapters')
        .insert({
          budget_id: newBudget.id,
          user_id: user.id,
          nombre: cap.nombre,
          numero: cap.numero
        })
        .select()
        .single();

      if (!newCap) continue;

      for (const act of (cap.activities || [])) {
        const { data: newAct } = await supabase
          .from('activities')
          .insert({
            chapter_id: newCap.id,
            budget_id: newBudget.id,
            user_id: user.id,
            nombre: act.nombre,
            unidad: act.unidad,
            cantidad: act.cantidad,
            precio_unitario: act.precio_unitario
          })
          .select()
          .single();

        if (!newAct || !act.apus) continue;

        const sourceApu = act.apus?.[0];

        const { data: newApu } = await supabase
          .from('apus')
          .insert({
            activity_id: newAct.id,
            budget_id: newBudget.id,
            user_id: user.id,
            rendimiento: sourceApu?.rendimiento,
            costo_material: sourceApu?.costo_material,
            costo_mano_obra: sourceApu?.costo_mano_obra,
            costo_equipo: sourceApu?.costo_equipo
          })
          .select()
          .single();

        if (!newApu || !sourceApu?.apu_items) continue;

        const itemsToInsert = sourceApu.apu_items.map((i: any) => ({
          apu_id: newApu.id,
          user_id: user.id,
          nombre: i.nombre,
          tipo: i.tipo,
          unidad: i.unidad,
          cantidad: i.cantidad,
          precio_unitario: i.precio_unitario
        }));

        await supabase.from('apu_items').insert(itemsToInsert);
      }
    }

    revalidatePath(`/proyectos/${b.project_id}`);
    return { success: true, data: { id: newBudget.id } };
  } catch (error) {
    console.error('Error duplicar:', error);
    return { success: false, error: 'Error al duplicar el presupuesto.' };
  }
}
