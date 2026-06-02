'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import {
  guardarPlantillaSchema,
  aplicarPlantillaSchema,
  renombrarPlantillaSchema,
  actualizarEstructuraPlantillaSchema,
} from '@/lib/validaciones/schemas';
import type {
  UserPlantilla,
  ModoAplicarPlantilla,
  PlantillaDetalle,
  CapituloPlantillaInput,
} from '@/types';

/**
 * Guarda el presupuesto actual como plantilla personal del usuario.
 * Lee capítulos → actividades → APUs → apu_items y los copia a user_plantillas_*.
 */
export async function guardarComoPlantilla(
  budgetId: string,
  nombre: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autenticado' };

    const parsed = guardarPlantillaSchema.safeParse({ nombre });
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

    // Verificar ownership del budget y leer tipo_obra del proyecto origen
    const { data: budget, error: budgetErr } = await supabase
      .from('budgets')
      .select('id, user_id, projects(tipo_obra)')
      .eq('id', budgetId)
      .eq('user_id', user.id)
      .single();
    if (budgetErr || !budget) return { success: false, error: 'Presupuesto no encontrado' };

    const tipoObra: string | null = (budget as any).projects?.tipo_obra ?? null;

    // Leer estructura completa del presupuesto — apus en query separada porque
    // tiene dos FK (activity_id + budget_id) y PostgREST entraría en ambigüedad
    // al resolverlas en un join anidado, devolviendo arrays vacíos.
    const { data: chapters, error: chaptersErr } = await supabase
      .from('chapters')
      .select(`
        id, nombre, numero,
        activities (
          id, nombre, unidad, cantidad, precio_unitario, deleted_at
        )
      `)
      .eq('budget_id', budgetId)
      .is('deleted_at', null)
      .order('numero', { ascending: true });

    if (chaptersErr) throw chaptersErr;

    // Query separada para APUs con sus ítems (evita ambigüedad de FK en PostgREST)
    const { data: apusData, error: apusErr } = await supabase
      .from('apus')
      .select('activity_id, apu_items ( id, tipo, nombre, unidad, cantidad, precio_unitario )')
      .eq('budget_id', budgetId)
      .eq('user_id', user.id)
      .is('deleted_at', null);

    if (apusErr) throw apusErr;

    // Indexar por activity_id para merge O(1)
    const apuByActivity: Record<string, { apu_items: any[] }> = {};
    for (const apu of apusData ?? []) {
      apuByActivity[apu.activity_id] = apu;
    }

    const admin = createAdminClient();

    // Insertar plantilla raíz
    const { data: plantilla, error: pErr } = await admin
      .from('user_plantillas')
      .insert({ user_id: user.id, nombre: parsed.data.nombre, tipo_obra: tipoObra })
      .select('id')
      .single();
    if (pErr) throw pErr;

    const plantillaId = plantilla.id;

    // ── Batch 1: todos los capítulos en un solo INSERT ──────────────────────
    const chapterList = (chapters as any[]) ?? [];
    const capsPayload = chapterList.map((ch: any, i: number) => ({
      plantilla_id: plantillaId,
      nombre:       ch.nombre,
      orden:        i,
    }));

    const capIdByOrden = new Map<number, string>();
    if (capsPayload.length > 0) {
      const { data: capsIns, error: capsErr } = await admin
        .from('user_plantillas_capitulos')
        .insert(capsPayload)
        .select('id, orden');
      if (capsErr || !capsIns) { console.error('[guardarComoPlantilla] capsErr', capsErr); throw capsErr ?? new Error('caps insert failed'); }
      for (const c of capsIns) capIdByOrden.set(c.orden, c.id);
    }

    // ── Batch 2: todas las actividades en un solo INSERT ─────────────────────
    const actsPayload: any[] = [];
    // Guardamos (capOrden, actOrden) para reconstruir el mapping tras el INSERT
    const actKeys: Array<{ capId: string; actOrden: number; srcActivityId: string }> = [];

    for (let capIdx = 0; capIdx < chapterList.length; capIdx++) {
      const ch = chapterList[capIdx];
      const capId = capIdByOrden.get(capIdx)!;
      const actividades = (ch.activities ?? []).filter((a: any) => !a.deleted_at);

      for (let actIdx = 0; actIdx < actividades.length; actIdx++) {
        const act = actividades[actIdx];
        actsPayload.push({
          capitulo_id:     capId,
          nombre:          act.nombre ?? 'Actividad',
          unidad:          act.unidad ?? 'gl',
          cantidad:        act.cantidad ?? 0,
          precio_unitario: act.precio_unitario ?? 0,
          orden:           actIdx,
        });
        actKeys.push({ capId, actOrden: actIdx, srcActivityId: act.id });
      }
    }

    // Map "capituloId_orden" → actividad_id insertada
    const actIdByKey = new Map<string, string>();
    if (actsPayload.length > 0) {
      const { data: actsIns, error: actsErr } = await admin
        .from('user_plantillas_actividades')
        .insert(actsPayload)
        .select('id, capitulo_id, orden');
      if (actsErr || !actsIns) { console.error('[guardarComoPlantilla] actsErr', actsErr); throw actsErr ?? new Error('acts insert failed'); }
      for (const a of actsIns) actIdByKey.set(`${a.capitulo_id}_${a.orden}`, a.id);
    }

    // ── Batch 3: todos los apu_items en un solo INSERT ────────────────────────
    const itemsPayload: any[] = [];
    for (const { capId, actOrden, srcActivityId } of actKeys) {
      const actId = actIdByKey.get(`${capId}_${actOrden}`);
      if (!actId) continue;
      const apuItems: any[] = apuByActivity[srcActivityId]?.apu_items ?? [];
      for (let iIdx = 0; iIdx < apuItems.length; iIdx++) {
        const item = apuItems[iIdx];
        itemsPayload.push({
          actividad_id:    actId,
          tipo:            item.tipo,
          nombre:          item.nombre,
          unidad:          item.unidad ?? 'gl',
          cantidad:        item.cantidad ?? 0,
          precio_unitario: item.precio_unitario ?? 0,
          orden:           item.orden ?? iIdx,
        });
      }
    }

    if (itemsPayload.length > 0) {
      const { error: itemsErr } = await admin
        .from('user_plantillas_apu_items')
        .insert(itemsPayload);
      if (itemsErr) { console.error('[guardarComoPlantilla] itemsErr', itemsErr); throw itemsErr; }
    }

    return { success: true };
  } catch (err: any) {
    console.error('[guardarComoPlantilla]', err);
    return { success: false, error: 'No se pudo guardar la plantilla' };
  }
}

/**
 * Lista las plantillas del usuario autenticado con conteo de capítulos.
 */
export async function getMisPlantillas(): Promise<UserPlantilla[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('user_plantillas')
      .select('id, nombre, tipo_obra, descripcion, created_at, user_plantillas_capitulos(id)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return [];

    return (data ?? []).map((p: any) => ({
      id:          p.id,
      nombre:      p.nombre,
      tipo_obra:   p.tipo_obra,
      descripcion: p.descripcion,
      created_at:  p.created_at,
      _count: { capitulos: (p.user_plantillas_capitulos ?? []).length },
    }));
  } catch {
    return [];
  }
}

/**
 * Elimina una plantilla y en cascada todos sus capítulos, actividades e ítems.
 */
export async function eliminarPlantilla(
  plantillaId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autenticado' };

    const { error } = await supabase
      .from('user_plantillas')
      .delete()
      .eq('id', plantillaId)
      .eq('user_id', user.id);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: 'No se pudo eliminar la plantilla' };
  }
}

/**
 * Aplica una plantilla a un presupuesto existente.
 * modo:
 *   'estructura'        → copia capítulos + actividades, todo en 0
 *   'estructura_precios' → precio_unitario real, cantidad = 0
 *   'todo'              → copia exacta (precio y cantidad)
 */
export async function aplicarPlantilla(
  plantillaId: string,
  budgetId: string,
  modo: ModoAplicarPlantilla
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autenticado' };

    const parsed = aplicarPlantillaSchema.safeParse({ plantillaId, budgetId, modo });
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

    // Verificar ownership del budget destino
    const { data: budget, error: budgetErr } = await supabase
      .from('budgets')
      .select('id, user_id')
      .eq('id', budgetId)
      .eq('user_id', user.id)
      .single();
    if (budgetErr || !budget) return { success: false, error: 'Presupuesto no encontrado' };

    // Verificar ownership de la plantilla (con client de usuario para que RLS aplique)
    const { data: plantillaOwner, error: plantillaOwnerErr } = await supabase
      .from('user_plantillas')
      .select('id')
      .eq('id', plantillaId)
      .eq('user_id', user.id)
      .single();
    if (plantillaOwnerErr || !plantillaOwner) return { success: false, error: 'Plantilla no encontrada' };

    const admin = createAdminClient();

    // Leer plantilla completa con admin para evitar que RLS bloquee el join anidado
    // en user_plantillas_apu_items (tercer nivel). Ownership ya verificado arriba.
    const { data: capitulos, error: capErr } = await admin
      .from('user_plantillas_capitulos')
      .select(`
        id, nombre, orden,
        user_plantillas_actividades (
          id, nombre, unidad, cantidad, precio_unitario, orden,
          user_plantillas_apu_items ( id, tipo, nombre, unidad, cantidad, precio_unitario, orden )
        )
      `)
      .eq('plantilla_id', plantillaId)
      .order('orden', { ascending: true });

    if (capErr) throw capErr;

    console.log('[aplicarPlantilla] capítulos leídos:', capitulos?.length);
    console.log('[aplicarPlantilla] actividades en cap 0:', (capitulos as any[])?.[0]?.user_plantillas_actividades?.length);
    console.log('[aplicarPlantilla] apu_items en act 0 de cap 0:', (capitulos as any[])?.[0]?.user_plantillas_actividades?.[0]?.user_plantillas_apu_items?.length);

    // Obtener el número máximo de capítulo ya existente en el presupuesto destino
    const { data: existingChaps } = await supabase
      .from('chapters')
      .select('numero')
      .eq('budget_id', budgetId)
      .is('deleted_at', null)
      .order('numero', { ascending: false })
      .limit(1);
    let nextNumero = (existingChaps?.[0]?.numero ?? 0) + 1;

    for (const cap of (capitulos as any[] ?? [])) {
      console.log('[aplicarPlantilla] procesando cap:', cap.nombre, '— actividades:', cap.user_plantillas_actividades?.length);

      // Insertar capítulo en el presupuesto destino
      const { data: newCap, error: newCapErr } = await admin
        .from('chapters')
        .insert({ budget_id: budgetId, user_id: user.id, nombre: cap.nombre, numero: nextNumero++ })
        .select('id')
        .single();
      console.log('[aplicarPlantilla] capítulo insertado:', newCap?.id, '— error:', newCapErr?.message);
      if (newCapErr) throw newCapErr;

      const actividades = [...(cap.user_plantillas_actividades ?? [])].sort(
        (a: any, b: any) => a.orden - b.orden
      );

      for (const act of actividades) {
        const cantidad        = modo === 'todo' ? act.cantidad        : 0;
        const precio_unitario = modo === 'todo' ? act.precio_unitario : 0;

        const { data: newAct, error: newActErr } = await admin
          .from('activities')
          .insert({
            chapter_id:      newCap.id,
            budget_id:       budgetId,
            user_id:         user.id,
            nombre:          act.nombre,
            unidad:          act.unidad ?? 'gl',
            cantidad,
            precio_unitario,
          })
          .select('id')
          .single();
        console.log('[aplicarPlantilla] actividad insertada:', newAct?.id, '— error:', newActErr?.message);
        if (newActErr) throw newActErr;

        const items = [...(act.user_plantillas_apu_items ?? [])].sort(
          (a: any, b: any) => a.orden - b.orden
        );
        if (items.length > 0) {
          // Crear APU para la actividad
          const { data: newApu, error: newApuErr } = await admin
            .from('apus')
            .insert({ activity_id: newAct.id, budget_id: budgetId, user_id: user.id })
            .select('id')
            .single();
          if (newApuErr) throw newApuErr;

          const itemsPayload = items.map((item: any) => ({
            apu_id:          newApu.id,
            user_id:         user.id,
            tipo:            item.tipo,
            nombre:          item.nombre,
            unidad:          item.unidad ?? 'gl',
            cantidad:        modo === 'todo' ? item.cantidad : 0,
            precio_unitario: modo === 'estructura' ? 0 : item.precio_unitario,
          }));
          const { error: itemsErr } = await admin
            .from('apu_items')
            .insert(itemsPayload);
          console.log('[aplicarPlantilla] items insertados para act:', newAct?.id, '— cantidad:', itemsPayload.length, '— error:', itemsErr?.message);
          if (itemsErr) throw itemsErr;

          // Calcular costos por tipo y escribirlos en apus para disparar la cadena de triggers
          const costoMaterial    = itemsPayload.filter(i => i.tipo === 'material').reduce((s, i) => s + (i.precio_unitario * i.cantidad), 0);
          const costoManoObra    = itemsPayload.filter(i => i.tipo === 'mano_obra').reduce((s, i) => s + (i.precio_unitario * i.cantidad), 0);
          const costoEquipo      = itemsPayload.filter(i => i.tipo === 'equipo').reduce((s, i) => s + (i.precio_unitario * i.cantidad), 0);
          const costoHerramienta = itemsPayload.filter(i => i.tipo === 'herramienta_menor').reduce((s, i) => s + (i.precio_unitario * i.cantidad), 0);
          const costoEpp         = itemsPayload.filter(i => i.tipo === 'epp').reduce((s, i) => s + (i.precio_unitario * i.cantidad), 0);

          const { error: updateApuErr } = await admin
            .from('apus')
            .update({
              costo_material:          costoMaterial,
              costo_mano_obra:         costoManoObra,
              costo_equipo:            costoEquipo,
              costo_herramienta_menor: costoHerramienta,
              costo_epp:               costoEpp,
            })
            .eq('id', newApu.id);
          if (updateApuErr) console.error('[aplicarPlantilla] error update apu:', updateApuErr);
        }
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('[aplicarPlantilla]', err);
    return { success: false, error: 'No se pudo aplicar la plantilla' };
  }
}

/**
 * Renombra una plantilla del usuario autenticado.
 */
export async function renombrarPlantilla(
  plantillaId: string,
  nuevoNombre: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autenticado' };

    const parsed = renombrarPlantillaSchema.safeParse({ plantillaId, nuevoNombre });
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

    const { error } = await supabase
      .from('user_plantillas')
      .update({ nombre: parsed.data.nuevoNombre })
      .eq('id', plantillaId)
      .eq('user_id', user.id);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: 'No se pudo renombrar la plantilla' };
  }
}

/**
 * Retorna el detalle completo de una plantilla: capítulos + actividades.
 */
export async function getDetallePlantilla(
  plantillaId: string
): Promise<PlantillaDetalle | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Verificar ownership con client de usuario (RLS)
    const { data: plantilla, error: pErr } = await supabase
      .from('user_plantillas')
      .select('id, nombre, created_at')
      .eq('id', plantillaId)
      .eq('user_id', user.id)
      .single();
    if (pErr || !plantilla) return null;

    // Leer capítulos y actividades con admin (join anidado de 2 niveles)
    const admin = createAdminClient();
    const { data: capitulos, error: capErr } = await admin
      .from('user_plantillas_capitulos')
      .select(`
        id, nombre, orden,
        user_plantillas_actividades (
          id, nombre, unidad, cantidad, precio_unitario, orden
        )
      `)
      .eq('plantilla_id', plantillaId)
      .order('orden', { ascending: true });

    if (capErr) return null;

    return {
      id: plantilla.id,
      nombre: plantilla.nombre,
      created_at: plantilla.created_at,
      capitulos: (capitulos ?? []).map((cap: any) => ({
        id:     cap.id,
        nombre: cap.nombre,
        orden:  cap.orden,
        actividades: [...(cap.user_plantillas_actividades ?? [])]
          .sort((a: any, b: any) => a.orden - b.orden)
          .map((act: any) => ({
            id:              act.id,
            nombre:          act.nombre,
            unidad:          act.unidad,
            cantidad:        Number(act.cantidad),
            precio_unitario: Number(act.precio_unitario),
            orden:           act.orden,
          })),
      })),
    };
  } catch {
    return null;
  }
}

/**
 * Reemplaza la estructura completa de una plantilla (capítulos + actividades).
 * Borra todos los capítulos existentes; el CASCADE elimina las actividades e ítems APU.
 */
export async function actualizarEstructuraPlantilla(
  plantillaId: string,
  capitulos: CapituloPlantillaInput[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autenticado' };

    const parsed = actualizarEstructuraPlantillaSchema.safeParse({ plantillaId, capitulos });
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

    // Verificar ownership con RLS
    const { data: plantilla, error: ownerErr } = await supabase
      .from('user_plantillas')
      .select('id')
      .eq('id', plantillaId)
      .eq('user_id', user.id)
      .single();
    if (ownerErr || !plantilla) return { success: false, error: 'Plantilla no encontrada' };

    const admin = createAdminClient();

    // Borrar todos los capítulos — CASCADE limpia actividades y apu_items
    const { error: delErr } = await admin
      .from('user_plantillas_capitulos')
      .delete()
      .eq('plantilla_id', plantillaId);
    if (delErr) throw delErr;

    // Reinsertar capítulos y actividades
    for (let capIdx = 0; capIdx < parsed.data.capitulos.length; capIdx++) {
      const cap = parsed.data.capitulos[capIdx];

      const { data: capIns, error: capErr } = await admin
        .from('user_plantillas_capitulos')
        .insert({ plantilla_id: plantillaId, nombre: cap.nombre, orden: capIdx })
        .select('id')
        .single();
      if (capErr) throw capErr;

      for (let actIdx = 0; actIdx < cap.actividades.length; actIdx++) {
        const act = cap.actividades[actIdx];
        const { error: actErr } = await admin
          .from('user_plantillas_actividades')
          .insert({
            capitulo_id:     capIns.id,
            nombre:          act.nombre,
            unidad:          act.unidad,
            cantidad:        act.cantidad,
            precio_unitario: act.precio_unitario,
            orden:           actIdx,
          });
        if (actErr) throw actErr;
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('[actualizarEstructuraPlantilla]', err);
    return { success: false, error: 'No se pudo actualizar la plantilla' };
  }
}
