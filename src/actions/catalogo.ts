'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { checkRateLimit } from '@/lib/security/rate-limit';
import type { ActionResult, CatalogoCapitulo, CatalogoActividad } from '@/types';

type TipoCatalogo = 'residencial' | 'comercial' | 'industrial' | 'infraestructura' | 'institucional' | 'hotelero';

function normalizarTipoObraCatalogo(tipoObra?: string | null): TipoCatalogo {
  if (!tipoObra) return 'residencial';
  const t = tipoObra.toLowerCase().trim();
  const conocidos: TipoCatalogo[] = ['residencial', 'comercial', 'industrial', 'infraestructura', 'institucional', 'hotelero'];
  if (conocidos.includes(t as TipoCatalogo)) return t as TipoCatalogo;
  if (t.includes('hotel')) return 'hotelero';
  if (t.includes('institucional')) return 'institucional';
  if (t.includes('industrial')) return 'industrial';
  if (t.includes('comercial')) return 'comercial';
  if (t.includes('infraestructura') || t.includes('vial')) return 'infraestructura';
  return 'residencial';
}

export async function obtenerCapitulosCatalogo(
  tipo_obra?: string
): Promise<ActionResult<CatalogoCapitulo[]>> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('catalogo_capitulos')
      .select('*, catalogo_actividades(*, catalogo_apu_items(id, tipo, nombre, unidad, cantidad, precio_unitario, orden))')
      .order('numero', { ascending: true });

    if (tipo_obra) {
      query = query.eq('tipo_obra', normalizarTipoObraCatalogo(tipo_obra));
    }

    const { data, error } = await query;
    if (error) throw error;

    return { success: true, data: data as CatalogoCapitulo[] };
  } catch (error: any) {
    return { success: false, error: 'No se pudo cargar el catálogo.' };
  }
}

export async function importarDesdeCatalogo(
  budgetId: string,
  capituloIds: string[]
): Promise<ActionResult<{ insertados: number }>> {
  try {
    if (capituloIds.length === 0) {
      return { success: false, error: 'Selecciona al menos un capítulo.' };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado.' };

    const admin = createAdminClient();

    const { data: catalogoCapitulos, error: catErr } = await admin
      .from('catalogo_capitulos')
      .select('*, catalogo_actividades(*, catalogo_apu_items(*))')
      .in('id', capituloIds)
      .order('numero', { ascending: true });

    if (catErr || !catalogoCapitulos) throw catErr;

    const { data: existentes } = await admin
      .from('chapters')
      .select('numero')
      .eq('budget_id', budgetId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('numero', { ascending: false })
      .limit(1);

    const nextChapterNumero = (existentes?.[0]?.numero ?? 0) + 1;
    const t0 = Date.now();

    // ── BATCH 1: capítulos ────────────────────────────────────────────────────
    const chapterPayloads = catalogoCapitulos.map((catCap, i) => ({
      budget_id: budgetId,
      user_id: user.id,
      nombre: catCap.nombre.replace(/^\d{2,3}\.\s*/, ''),
      numero: nextChapterNumero + i,
    }));

    const { data: chapters, error: chErr } = await admin
      .from('chapters')
      .insert(chapterPayloads)
      .select('id');

    if (chErr || !chapters) throw chErr ?? new Error('No se pudieron insertar los capítulos');

    // ── Construir metadata de actividades ────────────────────────────────────
    type ActivityMeta = {
      payload: Record<string, unknown>;
      catalogoApuItems: any[];
      costoMaterial: number;
      costoMO: number;
      costoEquipo: number;
      costoHM: number;
      costoEPP: number;
      tieneAPU: boolean;
    };

    const activityMetas: ActivityMeta[] = [];

    catalogoCapitulos.forEach((catCap, capIdx) => {
      const actividades: any[] = (catCap as any).catalogo_actividades ?? [];
      actividades.forEach((act: any, j: number) => {
        const catalogoApuItems: any[] = act.catalogo_apu_items ?? [];
        const tieneAPU = catalogoApuItems.length > 0;

        let precioUnitario = Number(act.precio_referencia_nacional);
        let costoMaterial = 0, costoMO = 0, costoEquipo = 0;

        if (tieneAPU) {
          for (const item of catalogoApuItems) {
            const sub = Number(item.cantidad) * Number(item.precio_unitario);
            if (item.tipo === 'material') costoMaterial += sub;
            else if (item.tipo === 'mano_obra') costoMO += sub;
            else if (item.tipo === 'equipo') costoEquipo += sub;
          }
          const costoHM = costoMO * 0.03;
          const costoEPP = costoMO * 0.01;
          precioUnitario = costoMaterial + costoMO + costoEquipo + costoHM + costoEPP;
        }

        const costoHM = costoMO * 0.03;
        const costoEPP = costoMO * 0.01;

        activityMetas.push({
          payload: {
            chapter_id: chapters[capIdx].id,
            budget_id: budgetId,
            user_id: user.id,
            nombre: act.nombre,
            unidad: act.unidad,
            cantidad: 1,
            precio_unitario: precioUnitario,
            numero: j + 1,
            precio_desde_apu: tieneAPU,
          },
          catalogoApuItems,
          costoMaterial,
          costoMO,
          costoEquipo,
          costoHM,
          costoEPP,
          tieneAPU,
        });
      });
    });

    if (activityMetas.length === 0) {
      revalidatePath(`/presupuestos/${budgetId}`);
      return { success: true, data: { insertados: 0 } };
    }

    // ── BATCH 2: actividades ─────────────────────────────────────────────────
    const { data: activities, error: actErr } = await admin
      .from('activities')
      .insert(activityMetas.map(m => m.payload))
      .select('id');

    if (actErr || !activities) throw actErr ?? new Error('No se pudieron insertar las actividades');

    // ── BATCH 3: APUs ─────────────────────────────────────────────────────────
    const apuPayloads = activityMetas.map((m, i) => ({
      activity_id: activities[i].id,
      budget_id: budgetId,
      user_id: user.id,
      rendimiento: 1,
      costo_material: m.costoMaterial,
      costo_mano_obra: m.costoMO,
      costo_equipo: m.costoEquipo,
      costo_herramienta_menor: m.costoHM,
      costo_epp: m.costoEPP,
      pct_herramienta_menor: 3,
      pct_epp: 1,
    }));

    const { data: apus, error: apuErr } = await admin
      .from('apus')
      .insert(apuPayloads)
      .select('id');

    if (apuErr || !apus) {
      console.error('Batch APU insert failed:', apuErr);
    }

    // ── BATCH 4: apu_items ────────────────────────────────────────────────────
    if (apus) {
      const allApuItems: any[] = [];
      activityMetas.forEach((m, i) => {
        if (!m.tieneAPU) return;
        m.catalogoApuItems
          .sort((a: any, b: any) => a.orden - b.orden)
          .forEach((item: any) => {
            allApuItems.push({
              apu_id: apus[i].id,
              user_id: user.id,
              nombre: item.nombre,
              descripcion: item.descripcion ?? null,
              tipo: item.tipo,
              unidad: item.unidad,
              cantidad: Number(item.cantidad),
              precio_unitario: Number(item.precio_unitario),
            });
          });
      });

      if (allApuItems.length > 0) {
        const { error: itemsErr } = await admin.from('apu_items').insert(allApuItems);
        if (itemsErr) console.error('Batch apu_items insert failed:', itemsErr);
      }
    }

    console.log(
      `importarDesdeCatalogo batch: ${Date.now() - t0}ms | ` +
      `${chapters.length} caps | ${activities.length} acts | ` +
      `${apus?.length ?? 0} APUs`
    );

    revalidatePath(`/presupuestos/${budgetId}`);
    return { success: true, data: { insertados: activities.length } };
  } catch (error: any) {
    console.error('importarDesdeCatalogo:', error);
    return { success: false, error: 'Error al importar desde el catálogo.' };
  }
}

/**
 * Crea un presupuesto desde plantilla sugerida.
 * Usa INSERTs en batch para capítulos, actividades, APUs y apu_items
 * en lugar de loops secuenciales — reduce ~97 round-trips a 5.
 */
export async function crearPresupuestoConPlantilla(
  projectId: string,
  titulo: string,
  capitulosPersonalizados: string[],
  tipo_obra: string,
  ciudadObra?: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado.' };

    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.success) return { success: false, error: 'Límite de solicitudes excedido.' };

    if (!titulo?.trim()) return { success: false, error: 'El nombre del presupuesto es obligatorio.' };

    const admin = createAdminClient();

    const { data: profile } = await supabase
      .from('profiles')
      .select('municipio, ciudad')
      .eq('id', user.id)
      .single();

    const ciudadFinal = ciudadObra || profile?.municipio || profile?.ciudad || 'Bogotá D.C.';
    const { data: munData } = await supabase
      .from('municipios')
      .select('reteica_pct')
      .eq('nombre', ciudadFinal)
      .maybeSingle();
    const icaPct = munData?.reteica_pct != null ? Number(munData.reteica_pct) : 0.5;

    // ── 1. Crear el presupuesto ───────────────────────────────────────────────
    const { data: budget, error: budgetErr } = await admin
      .from('budgets')
      .insert({
        project_id: projectId,
        user_id: user.id,
        titulo: titulo.trim(),
        estado: 'borrador',
        administracion_pct: 10,
        imprevistos_pct: 5,
        utilidad_pct: 10,
        iva_porcentaje: 19,
        retefuente_pct: 2,
        ica_pct: icaPct,
        ciudad_ica: ciudadFinal,
      })
      .select()
      .single();

    if (budgetErr || !budget) throw budgetErr ?? new Error('No se pudo crear el presupuesto');

    const t0 = Date.now();

    // ── 2. Cargar catálogo ───────────────────────────────────────────────────
    const tipoCatalogo = normalizarTipoObraCatalogo(tipo_obra);
    const { data: catalogoCapitulos, error: catErr } = await admin
      .from('catalogo_capitulos')
      .select('*, catalogo_actividades(*, catalogo_apu_items(*))')
      .eq('tipo_obra', tipoCatalogo)
      .order('numero', { ascending: true });

    if (catErr) throw catErr;

    const caps = catalogoCapitulos ?? [];
    const totalCaps = Math.max(capitulosPersonalizados.length, caps.length);

    // ── BATCH 1: capítulos ────────────────────────────────────────────────────
    const chapterPayloads = Array.from({ length: totalCaps }, (_, i) => ({
      budget_id: budget.id,
      user_id: user.id,
      nombre: (capitulosPersonalizados[i]?.trim() || caps[i]?.nombre || `Capítulo ${i + 1}`).replace(/^\d{2,3}\.\s*/, ''),
      numero: i + 1,
    }));

    const { data: chapters, error: chErr } = await admin
      .from('chapters')
      .insert(chapterPayloads)
      .select('id');

    if (chErr || !chapters) throw chErr ?? new Error('No se pudieron insertar los capítulos');

    // ── Construir metadata de actividades ────────────────────────────────────
    // Solo para capítulos que tienen correspondencia en el catálogo
    type ActivityMeta = {
      payload: Record<string, unknown>;
      catalogoApuItems: any[];
      costoMaterial: number;
      costoMO: number;
      costoEquipo: number;
      costoHM: number;
      costoEPP: number;
      tieneAPU: boolean;
    };

    const activityMetas: ActivityMeta[] = [];

    for (let i = 0; i < totalCaps; i++) {
      const catCap = caps[i];
      if (!catCap || !chapters[i]) continue;

      const actividades: any[] = (catCap as any).catalogo_actividades ?? [];
      actividades.forEach((act: any, j: number) => {
        const catalogoApuItems: any[] = act.catalogo_apu_items ?? [];
        const tieneAPU = catalogoApuItems.length > 0;

        let precioUnitario = Number(act.precio_referencia_nacional);
        let costoMaterial = 0, costoMO = 0, costoEquipo = 0;

        if (tieneAPU) {
          for (const item of catalogoApuItems) {
            const sub = Number(item.cantidad) * Number(item.precio_unitario);
            if (item.tipo === 'material') costoMaterial += sub;
            else if (item.tipo === 'mano_obra') costoMO += sub;
            else if (item.tipo === 'equipo') costoEquipo += sub;
          }
          const costoHM = costoMO * 0.03;
          const costoEPP = costoMO * 0.01;
          precioUnitario = costoMaterial + costoMO + costoEquipo + costoHM + costoEPP;
        }

        const costoHM = costoMO * 0.03;
        const costoEPP = costoMO * 0.01;

        activityMetas.push({
          payload: {
            chapter_id: chapters[i].id,
            budget_id: budget.id,
            user_id: user.id,
            nombre: act.nombre,
            unidad: act.unidad,
            cantidad: 1,
            precio_unitario: precioUnitario,
            numero: j + 1,
            precio_desde_apu: tieneAPU,
          },
          catalogoApuItems,
          costoMaterial,
          costoMO,
          costoEquipo,
          costoHM,
          costoEPP,
          tieneAPU,
        });
      });
    }

    if (activityMetas.length === 0) {
      revalidatePath(`/proyectos/${projectId}`);
      return { success: true, data: { id: budget.id } };
    }

    // ── BATCH 2: actividades ─────────────────────────────────────────────────
    const { data: activities, error: actErr } = await admin
      .from('activities')
      .insert(activityMetas.map(m => m.payload))
      .select('id');

    if (actErr || !activities) {
      console.error('Batch activity insert failed:', actErr);
      revalidatePath(`/proyectos/${projectId}`);
      return { success: true, data: { id: budget.id } };
    }

    // ── BATCH 3: APUs ─────────────────────────────────────────────────────────
    const apuPayloads = activityMetas.map((m, i) => ({
      activity_id: activities[i].id,
      budget_id: budget.id,
      user_id: user.id,
      rendimiento: 1,
      costo_material: m.costoMaterial,
      costo_mano_obra: m.costoMO,
      costo_equipo: m.costoEquipo,
      costo_herramienta_menor: m.costoHM,
      costo_epp: m.costoEPP,
      pct_herramienta_menor: 3,
      pct_epp: 1,
    }));

    const { data: apus, error: apuErr } = await admin
      .from('apus')
      .insert(apuPayloads)
      .select('id');

    if (apuErr || !apus) {
      console.error('Batch APU insert failed:', apuErr);
      revalidatePath(`/proyectos/${projectId}`);
      return { success: true, data: { id: budget.id } };
    }

    // ── BATCH 4: apu_items ────────────────────────────────────────────────────
    const allApuItems: any[] = [];
    activityMetas.forEach((m, i) => {
      if (!m.tieneAPU) return;
      m.catalogoApuItems
        .sort((a: any, b: any) => a.orden - b.orden)
        .forEach((item: any) => {
          allApuItems.push({
            apu_id: apus[i].id,
            user_id: user.id,
            nombre: item.nombre,
            descripcion: item.descripcion ?? null,
            tipo: item.tipo,
            unidad: item.unidad,
            cantidad: Number(item.cantidad),
            precio_unitario: Number(item.precio_unitario),
          });
        });
    });

    if (allApuItems.length > 0) {
      const { error: itemsErr } = await admin.from('apu_items').insert(allApuItems);
      if (itemsErr) console.error('Batch apu_items insert failed:', itemsErr);
    }

    console.log(
      `crearPresupuestoConPlantilla batch: ${Date.now() - t0}ms | ` +
      `${chapters.length} caps | ${activities.length} acts | ` +
      `${apus.length} APUs | ${allApuItems.length} items`
    );

    revalidatePath(`/proyectos/${projectId}`);
    return { success: true, data: { id: budget.id } };
  } catch (error: any) {
    console.error('crearPresupuestoConPlantilla error:', error);
    return { success: false, error: 'No se pudo crear el presupuesto desde la plantilla.' };
  }
}

export async function importarActividadAInsumos(
  actividad: Pick<CatalogoActividad, 'id' | 'nombre' | 'unidad' | 'precio_referencia_nacional'>
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado.' };

    const { error } = await supabase
      .from('user_materials')
      .insert({
        user_id: user.id,
        nombre: actividad.nombre,
        tipo: 'material',
        unidad: actividad.unidad,
        precio_unitario: Number(actividad.precio_referencia_nacional) || 0,
      });

    if (error) {
      if (error.code === '23505') return { success: false, error: 'Este insumo ya está en tu catálogo personal.' };
      throw error;
    }

    revalidatePath('/insumos');
    return { success: true };
  } catch (error: any) {
    console.error('importarActividadAInsumos:', error);
    return { success: false, error: 'No se pudo importar el insumo.' };
  }
}

export async function sugerirCorreccionPrecio(
  actividadId: string,
  precioActual: number,
  precioSugerido: number,
  comentario?: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado.' };

    if (precioSugerido <= 0) return { success: false, error: 'El precio sugerido debe ser mayor a cero.' };

    const { error } = await supabase.from('audit_log').insert({
      tabla: 'catalogo_actividades',
      operacion: 'SUGERENCIA_PRECIO',
      registro_id: actividadId,
      user_id: user.id,
      datos_anteriores: { precio_actual: precioActual },
      datos_nuevos: { precio_sugerido: precioSugerido, comentario: comentario?.trim() || null },
    });

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('sugerirCorreccionPrecio:', error);
    return { success: false, error: 'No se pudo enviar la sugerencia.' };
  }
}
