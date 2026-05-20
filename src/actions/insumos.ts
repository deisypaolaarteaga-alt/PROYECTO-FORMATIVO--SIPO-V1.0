'use server';

import { createClient } from '@/lib/supabase/server';
import { createUserMaterialSchema } from '@/lib/validations/schemas';
import type { ActionResult, ExplosionInsumos, TipoAPUItem } from '@/types';
import { revalidatePath } from 'next/cache';
import Decimal from 'decimal.js';

export async function getMaterials(search?: string, categoria?: string) {
  const supabase = await createClient();
  let query = supabase.from('materials').select('*').order('nombre');
  if (search) query = query.ilike('nombre', `%${search}%`);
  if (categoria) query = query.eq('categoria', categoria);
  const { data } = await query.limit(50);
  return data || [];
}

export async function getLabor() {
  const supabase = await createClient();
  const { data } = await supabase.from('labor').select('*').order('nombre');
  return data || [];
}

export async function getEquipment() {
  const supabase = await createClient();
  const { data } = await supabase.from('equipment').select('*').order('nombre');
  return data || [];
}

export async function getUserMaterials() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from('user_materials')
    .select('*')
    .eq('user_id', user.id)
    .order('nombre');
  return data || [];
}

export async function createUserMaterial(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autorizado' };

  const raw = Object.fromEntries(formData.entries());
  const parsed = createUserMaterialSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { error } = await supabase
    .from('user_materials')
    .insert({ ...parsed.data, user_id: user.id });

  if (error) return { success: false, error: 'No se pudo guardar.' };
  revalidatePath('/insumos');
  return { success: true };
}

export async function deleteUserMaterial(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autorizado' };

  const { error } = await supabase
    .from('user_materials')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { success: false, error: 'No se pudo eliminar.' };
  revalidatePath('/insumos');
  return { success: true };
}

export async function updateUserMaterial(id: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autorizado' };

  const raw = Object.fromEntries(formData.entries());
  const parsed = createUserMaterialSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { error } = await supabase
    .from('user_materials')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { success: false, error: 'No se pudo actualizar.' };
  revalidatePath('/insumos');
  return { success: true };
}

export async function searchInsumos(query: string, type?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const results: any[] = [];

  if (!type || type === 'material') {
    const { data } = await supabase.from('materials').select('*').ilike('nombre', `%${query}%`).limit(15);
    results.push(...(data || []).map((d: any) => ({ ...d, source: 'materials' })));
  }
  if (!type || type === 'mano_obra') {
    const { data } = await supabase
      .from('trabajadores')
      .select('id, especialidad, categoria, jornal_con_prestaciones, ciudad_referencia')
      .ilike('especialidad', `%${query}%`)
      .eq('activo', true)
      .limit(10);
    results.push(...(data || []).map((d: any) => ({
      id:              d.id,
      nombre:          d.especialidad,
      precio_unitario: d.jornal_con_prestaciones,
      unidad:          'jornal',
      categoria:       d.categoria,
      source:          'labor',
    })));
  }
  if (!type || type === 'equipo') {
    const { data } = await supabase.from('equipment').select('*').ilike('nombre', `%${query}%`).limit(10);
    results.push(...(data || []).map((d: any) => ({ ...d, source: 'equipo', unidad: d.unidad || 'día' })));
  }

  if (user) {
    const { data } = await supabase.from('user_materials').select('*').eq('user_id', user.id).ilike('nombre', `%${query}%`).limit(10);
    results.unshift(...(data || []).map((d: any) => ({ ...d, source: 'user', unidad: d.unidad || 'und' })));
  }

  return results;
}

const TOTALES_VACIOS = { material: 0, mano_obra: 0, equipo: 0, herramienta_menor: 0, epp: 0, gran_total: 0 };

export async function getExplosionInsumos(budgetId: string): Promise<ActionResult<ExplosionInsumos>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    // Verificar que el presupuesto pertenece al usuario
    const { data: budget, error: budgetError } = await supabase
      .from('budgets')
      .select('id')
      .eq('id', budgetId)
      .eq('user_id', user.id)
      .single();

    if (budgetError || !budget) return { success: false, error: 'Presupuesto no encontrado.' };

    // Query 1: actividades activas (sin APUs anidados).
    // apus tiene FK doble (activity_id + budget_id) — PostgREST entra en ambigüedad
    // al resolver el join desde activities, igual que en obtenerPresupuesto().
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('id, cantidad')
      .eq('budget_id', budgetId)
      .eq('user_id', user.id)
      .is('deleted_at', null);

    if (activitiesError) return { success: false, error: 'Error al obtener actividades.' };

    if (!activities || activities.length === 0) {
      return { success: true, data: { budget_id: budgetId, items: [], totales: TOTALES_VACIOS } };
    }

    const activityIds = activities.map(a => a.id);

    // Query 2: APUs con sus ítems, filtrados por budget_id + activity_id.
    // Query separada para evitar ambigüedad de FK en PostgREST (ver presupuestos.ts línea 74).
    const { data: apusData, error: apusError } = await supabase
      .from('apus')
      .select('activity_id, apu_items(nombre, unidad, tipo, cantidad, precio_unitario, proveedor_id)')
      .eq('budget_id', budgetId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .in('activity_id', activityIds);

    if (apusError) return { success: false, error: 'Error al obtener APUs.' };

    // Indexar APUs por activity_id para merge O(1)
    const apusByActivityId: Record<string, any> = {};
    for (const apu of apusData ?? []) {
      apusByActivityId[apu.activity_id] = apu;
    }

    // Agrupar ítems por (nombre + unidad + tipo) sumando cantidades × metrado de actividad
    const grupos = new Map<string, {
      nombre: string;
      unidad: string;
      tipo: TipoAPUItem;
      cantidad_total: Decimal;
      precio_unitario: Decimal;
      subtotal_total: Decimal;
      proveedor_id: string | null;
    }>();

    for (const activity of activities) {
      const cantidadActividad = new Decimal(activity.cantidad ?? 0);
      const apu = apusByActivityId[activity.id];
      if (!apu) continue;

      for (const item of (apu.apu_items as any[]) ?? []) {
        const cantidadItem  = new Decimal(item.cantidad       ?? 0);
        const precioUnit    = new Decimal(item.precio_unitario ?? 0);
        const cantidadTotal = cantidadItem.mul(cantidadActividad);
        const subtotal      = cantidadTotal.mul(precioUnit);

        const clave    = `${item.nombre}|||${item.unidad}|||${item.tipo}`;
        const existente = grupos.get(clave);
        if (existente) {
          existente.cantidad_total = existente.cantidad_total.add(cantidadTotal);
          existente.subtotal_total = existente.subtotal_total.add(subtotal);
          // Si algún ítem del grupo ya tiene proveedor asignado, conservarlo
          if (!existente.proveedor_id && item.proveedor_id) {
            existente.proveedor_id = item.proveedor_id;
          }
        } else {
          grupos.set(clave, {
            nombre:          item.nombre,
            unidad:          item.unidad,
            tipo:            item.tipo as TipoAPUItem,
            cantidad_total:  cantidadTotal,
            precio_unitario: precioUnit,
            subtotal_total:  subtotal,
            proveedor_id:    item.proveedor_id ?? null,
          });
        }
      }
    }

    const ORDEN_TIPO: Record<TipoAPUItem, number> = {
      material: 0, mano_obra: 1, equipo: 2, herramienta_menor: 3, epp: 4,
    };

    const items = Array.from(grupos.values())
      .sort((a, b) => {
        const d = ORDEN_TIPO[a.tipo] - ORDEN_TIPO[b.tipo];
        return d !== 0 ? d : a.nombre.localeCompare(b.nombre, 'es-CO');
      })
      .map(g => ({
        nombre:          g.nombre,
        unidad:          g.unidad,
        tipo:            g.tipo,
        cantidad_total:  g.cantidad_total.toDecimalPlaces(4).toNumber(),
        precio_unitario: g.precio_unitario.toDecimalPlaces(2).toNumber(),
        subtotal_total:  g.subtotal_total.toDecimalPlaces(2).toNumber(),
        proveedor_id:    g.proveedor_id,
      }));

    const totales = { material: new Decimal(0), mano_obra: new Decimal(0), equipo: new Decimal(0), herramienta_menor: new Decimal(0), epp: new Decimal(0) };
    for (const item of items) {
      totales[item.tipo] = totales[item.tipo].add(new Decimal(item.subtotal_total));
    }
    const granTotal = Object.values(totales).reduce((acc, v) => acc.add(v), new Decimal(0));

    return {
      success: true,
      data: {
        budget_id: budgetId,
        items,
        totales: {
          material:          totales.material.toDecimalPlaces(2).toNumber(),
          mano_obra:         totales.mano_obra.toDecimalPlaces(2).toNumber(),
          equipo:            totales.equipo.toDecimalPlaces(2).toNumber(),
          herramienta_menor: totales.herramienta_menor.toDecimalPlaces(2).toNumber(),
          epp:               totales.epp.toDecimalPlaces(2).toNumber(),
          gran_total:        granTotal.toDecimalPlaces(2).toNumber(),
        },
      },
    };
  } catch (err) {
    console.error('[getExplosionInsumos]', err);
    return { success: false, error: 'Error interno al calcular la explosión de insumos.' };
  }
}
