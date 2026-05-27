'use server';

import { createClient } from '@/lib/supabase/server';
import { createUserMaterialSchema } from '@/lib/validations/schemas';
import type { ActionResult, ExplosionInsumos, TipoAPUItem, MaterialConPrecio, EquipoConPrecio } from '@/types';
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

export async function getMaterialesConPrecio(): Promise<MaterialConPrecio[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: materiales } = await supabase
    .from('materials')
    .select('id, nombre, descripcion, unidad, precio_referencia, departamento, categoria')
    .order('categoria')
    .order('nombre');

  if (!materiales) return [];

  const { data: overrides } = await supabase
    .from('user_material_precios')
    .select('material_id, precio_unitario, activo')
    .eq('user_id', user.id);

  type OvEntry = { precio: number | null; activo: boolean };
  const overrideMap = new Map<string, OvEntry>(
    (overrides || []).map((o) => [
      o.material_id,
      { precio: o.precio_unitario != null ? Number(o.precio_unitario) : null, activo: o.activo ?? true },
    ])
  );

  return materiales.map((m) => {
    const ov = overrideMap.get(m.id);
    return {
      id:                m.id,
      nombre:            m.nombre ?? '',
      descripcion:       m.descripcion ?? '',
      unidad:            m.unidad ?? '',
      precio_referencia: Number(m.precio_referencia ?? 0),
      departamento:      m.departamento ?? '',
      categoria:         m.categoria ?? '',
      precio_usuario:    ov?.precio ?? null,
      activo:            ov ? (ov.activo ?? true) : true,
    };
  });
}

export async function upsertMaterialPrecio(materialId: string, precioUnitario: number): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('user_material_precios').upsert(
    {
      user_id: user.id,
      material_id: materialId,
      precio_unitario: new Decimal(precioUnitario).toDecimalPlaces(2).toNumber(),
      activo: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,material_id' }
  );
}

export async function toggleMaterialActivo(
  materialId: string
): Promise<{ success: boolean; activo: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, activo: true };

  const { data: existing } = await supabase
    .from('user_material_precios')
    .select('activo')
    .eq('user_id', user.id)
    .eq('material_id', materialId)
    .maybeSingle();

  const newActivo = existing ? !(existing.activo ?? true) : false;

  if (existing) {
    await supabase
      .from('user_material_precios')
      .update({ activo: newActivo })
      .eq('user_id', user.id)
      .eq('material_id', materialId);
  } else {
    // Sin override previo: crear registro solo con estado activo (sin precio personalizado)
    await supabase
      .from('user_material_precios')
      .insert({ user_id: user.id, material_id: materialId, precio_unitario: null, activo: false });
  }

  return { success: true, activo: newActivo };
}

export async function resetMaterialPrecio(materialId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('user_material_precios')
    .delete()
    .eq('user_id', user.id)
    .eq('material_id', materialId);
}

export async function getEquiposConPrecio(): Promise<EquipoConPrecio[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: equipos } = await supabase
    .from('equipment')
    .select('id, nombre, descripcion, tipo, precio_diario, precio_semanal, precio_mensual, departamento')
    .order('nombre');

  if (!equipos) return [];

  const { data: overrides } = await supabase
    .from('user_equipment_precios')
    .select('equipment_id, precio_diario, activo')
    .eq('user_id', user.id);

  type EqOv = { precio: number | null; activo: boolean };
  const overrideMap = new Map<string, EqOv>(
    (overrides || []).map((o) => [
      o.equipment_id,
      { precio: o.precio_diario != null ? Number(o.precio_diario) : null, activo: o.activo ?? true },
    ])
  );

  return equipos.map((e) => {
    const ov = overrideMap.get(e.id);
    return {
      id:             e.id,
      nombre:         e.nombre ?? '',
      descripcion:    e.descripcion ?? '',
      tipo:           e.tipo ?? '',
      precio_diario:  Number(e.precio_diario ?? 0),
      precio_semanal: Number(e.precio_semanal ?? 0),
      precio_mensual: Number(e.precio_mensual ?? 0),
      departamento:   e.departamento ?? '',
      precio_usuario: ov?.precio ?? null,
      activo:         ov ? (ov.activo ?? true) : true,
    };
  });
}

export async function upsertEquipoPrecio(equipmentId: string, precioDiario: number): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('user_equipment_precios').upsert(
    {
      user_id: user.id,
      equipment_id: equipmentId,
      precio_diario: new Decimal(precioDiario).toDecimalPlaces(2).toNumber(),
      activo: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,equipment_id' }
  );
}

export async function toggleEquipoActivo(
  equipmentId: string
): Promise<{ success: boolean; activo: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, activo: true };

  const { data: existing } = await supabase
    .from('user_equipment_precios')
    .select('activo')
    .eq('user_id', user.id)
    .eq('equipment_id', equipmentId)
    .maybeSingle();

  const newActivo = existing ? !(existing.activo ?? true) : false;

  if (existing) {
    await supabase
      .from('user_equipment_precios')
      .update({ activo: newActivo })
      .eq('user_id', user.id)
      .eq('equipment_id', equipmentId);
  } else {
    await supabase
      .from('user_equipment_precios')
      .insert({ user_id: user.id, equipment_id: equipmentId, precio_diario: null, activo: false });
  }

  return { success: true, activo: newActivo };
}

export async function resetEquipoPrecio(equipmentId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('user_equipment_precios')
    .delete()
    .eq('user_id', user.id)
    .eq('equipment_id', equipmentId);
}

export async function searchInsumos(query: string, type?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const results: any[] = [];

  if (!type || type === 'material') {
    const { data } = await supabase.from('materials').select('*').ilike('nombre', `%${query}%`).limit(15);
    type MatOv = { precio: number | null; activo: boolean };
    let overrideMap = new Map<string, MatOv>();
    if (user && data && data.length > 0) {
      const ids = data.map((d: any) => d.id);
      const { data: ov } = await supabase
        .from('user_material_precios')
        .select('material_id, precio_unitario, activo')
        .eq('user_id', user.id)
        .in('material_id', ids);
      overrideMap = new Map((ov || []).map((o: any) => [
        o.material_id,
        { precio: o.precio_unitario != null ? Number(o.precio_unitario) : null, activo: o.activo ?? true },
      ]));
    }
    results.push(...(data || [])
      .filter((d: any) => { const ov = overrideMap.get(d.id); return !ov || ov.activo !== false; })
      .map((d: any) => {
        const ov = overrideMap.get(d.id);
        const tienePrecioPropio = ov?.precio != null;
        return {
          id:              d.id,
          nombre:          d.nombre,
          unidad:          d.unidad,
          categoria:       d.categoria,
          source:          tienePrecioPropio ? 'propio' : 'referencia',
          precio_unitario: tienePrecioPropio ? ov!.precio! : Number(d.precio_referencia ?? 0),
        };
      }));
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
    type EqOv = { precio: number | null; activo: boolean };
    let overrideMap = new Map<string, EqOv>();
    if (user && data && data.length > 0) {
      const ids = data.map((d: any) => d.id);
      const { data: ov } = await supabase
        .from('user_equipment_precios')
        .select('equipment_id, precio_diario, activo')
        .eq('user_id', user.id)
        .in('equipment_id', ids);
      overrideMap = new Map((ov || []).map((o: any) => [
        o.equipment_id,
        { precio: o.precio_diario != null ? Number(o.precio_diario) : null, activo: o.activo ?? true },
      ]));
    }
    results.push(...(data || [])
      .filter((d: any) => { const ov = overrideMap.get(d.id); return !ov || ov.activo !== false; })
      .map((d: any) => {
        const ov = overrideMap.get(d.id);
        const tienePrecioPropio = ov?.precio != null;
        return {
          id:              d.id,
          nombre:          d.nombre,
          unidad:          d.unidad || 'día',
          tipo:            d.tipo,
          source:          tienePrecioPropio ? 'propio' : 'referencia',
          precio_unitario: tienePrecioPropio ? ov!.precio! : Number(d.precio_diario ?? 0),
        };
      }));
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
