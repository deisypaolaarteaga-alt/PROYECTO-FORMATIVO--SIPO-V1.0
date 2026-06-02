'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { isSuperAdmin } from '@/lib/auth/roles';
import {
  crearCapituloSchema,
  actualizarCapituloSchema,
  crearActividadCatalogoSchema,
  actualizarActividadCatalogoSchema,
  crearCatalogoAPUItemSchema,
  actualizarCatalogoAPUItemSchema,
} from '@/lib/validations/schemas';
import type { ActionResult, CatalogoCapitulo, CatalogoActividad, CatalogoApuItem, ResultadoBusquedaInsumo, ResultadoBusquedaCuadrilla } from '@/types';

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
      catalogoActividadId: string;
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
          catalogoActividadId: act.id,
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

    // ── BATCH 3 + 4: APUs y apu_items (solo actividades con items de catálogo) ─
    // Excluimos actividades sin items para no disparar el trigger de precio
    // con costo_total = 0, que sobrescribiría el precio_referencia_nacional.
    const metasConAPU = activityMetas
      .map((meta, actIdx) => ({ meta, actIdx }))
      .filter(({ meta }) => meta.tieneAPU);

    let apusCreados = 0;
    let itemsCreados = 0;

    if (metasConAPU.length > 0) {
      const apuPayloads = metasConAPU.map(({ meta, actIdx }) => ({
        activity_id: activities[actIdx].id,
        budget_id: budgetId,
        user_id: user.id,
        rendimiento: 1,
        costo_material: meta.costoMaterial,
        costo_mano_obra: meta.costoMO,
        costo_equipo: meta.costoEquipo,
        costo_herramienta_menor: meta.costoHM,
        costo_epp: meta.costoEPP,
        pct_herramienta_menor: 3,
        pct_epp: 1,
      }));

      const { data: apus, error: apuErr } = await admin
        .from('apus')
        .insert(apuPayloads)
        .select('id');

      if (apuErr || !apus) {
        console.error('Batch APU insert failed:', apuErr);
      } else {
        apusCreados = apus.length;

        // ── BATCH 4: apu_items ──────────────────────────────────────────────
        const allApuItems: Record<string, unknown>[] = [];
        metasConAPU.forEach(({ meta }, apuIdx) => {
          meta.catalogoApuItems
            .sort((a: any, b: any) => a.orden - b.orden)
            .forEach((item: any) => {
              allApuItems.push({
                apu_id: apus[apuIdx].id,
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
          if (itemsErr) {
            console.error('Batch apu_items insert failed:', itemsErr);
          } else {
            itemsCreados = allApuItems.length;
          }
        }
      }
    }

    console.log(
      `importarDesdeCatalogo batch: ${Date.now() - t0}ms | ` +
      `${chapters.length} caps | ${activities.length} acts | ` +
      `${apusCreados} APUs | ${itemsCreados} items`
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

    const [{ data: profile }, { data: proyectoData }] = await Promise.all([
      supabase.from('profiles').select('municipio, ciudad').eq('id', user.id).single(),
      supabase.from('projects').select('ubicacion').eq('id', projectId).single(),
    ]);

    const ciudadFinal = proyectoData?.ubicacion || ciudadObra || profile?.municipio || profile?.ciudad || 'Bogotá D.C.';
    const { data: munData } = await supabase
      .from('municipios')
      .select('reteica_pct')
      .eq('nombre', ciudadFinal)
      .maybeSingle();
    const icaPct = munData?.reteica_pct != null ? Number(munData.reteica_pct) : 0;

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
      catalogoActividadId: string;
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
          catalogoActividadId: act.id,
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

    // ── BATCH 3 + 4: APUs y apu_items (solo actividades con items de catálogo) ─
    // Excluimos actividades sin items para no disparar el trigger de precio
    // con costo_total = 0, que sobrescribiría el precio_referencia_nacional.
    const metasConAPU = activityMetas
      .map((meta, actIdx) => ({ meta, actIdx }))
      .filter(({ meta }) => meta.tieneAPU);

    let apusCreados = 0;
    let itemsCreados = 0;

    if (metasConAPU.length > 0) {
      const apuPayloads = metasConAPU.map(({ meta, actIdx }) => ({
        activity_id: activities[actIdx].id,
        budget_id: budget.id,
        user_id: user.id,
        rendimiento: 1,
        costo_material: meta.costoMaterial,
        costo_mano_obra: meta.costoMO,
        costo_equipo: meta.costoEquipo,
        costo_herramienta_menor: meta.costoHM,
        costo_epp: meta.costoEPP,
        pct_herramienta_menor: 3,
        pct_epp: 1,
      }));

      const { data: apus, error: apuErr } = await admin
        .from('apus')
        .insert(apuPayloads)
        .select('id');

      if (apuErr || !apus) {
        console.error('Batch APU insert failed:', apuErr);
      } else {
        apusCreados = apus.length;

        // ── BATCH 4: apu_items ──────────────────────────────────────────────
        const allApuItems: Record<string, unknown>[] = [];
        metasConAPU.forEach(({ meta }, apuIdx) => {
          meta.catalogoApuItems
            .sort((a: any, b: any) => a.orden - b.orden)
            .forEach((item: any) => {
              allApuItems.push({
                apu_id: apus[apuIdx].id,
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
          if (itemsErr) {
            console.error('Batch apu_items insert failed:', itemsErr);
          } else {
            itemsCreados = allApuItems.length;
          }
        }
      }
    }

    console.log(
      `crearPresupuestoConPlantilla batch: ${Date.now() - t0}ms | ` +
      `${chapters.length} caps | ${activities.length} acts | ` +
      `${apusCreados} APUs | ${itemsCreados} items`
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

// ─────────────────────────────────────────────────────────────────────────────
// Edición de catálogo — solo super_admin
// ─────────────────────────────────────────────────────────────────────────────

async function verificarAdmin(): Promise<{ userId: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado.' };
  const esAdmin = await isSuperAdmin(user.id);
  if (!esAdmin) return { error: 'No tienes permisos para realizar esta acción.' };
  return { userId: user.id };
}

// ── Capítulos ────────────────────────────────────────────────────────────────

const PREFIJO_TIPO_OBRA: Record<string, string> = {
  residencial:     'RES',
  comercial:       'COM',
  industrial:      'IND',
  infraestructura: 'INF',
  institucional:   'INS',
  hotelero:        'HOT',
};

export async function crearCapitulo(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const auth = await verificarAdmin();
    if ('error' in auth) return { success: false, error: auth.error };

    const parsed = crearCapituloSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
    }
    const { nombre, tipo_obra, codigo } = parsed.data;

    const admin = createAdminClient();
    const { data: ultimo } = await admin
      .from('catalogo_capitulos')
      .select('numero')
      .eq('tipo_obra', tipo_obra)
      .order('numero', { ascending: false })
      .limit(1)
      .maybeSingle();

    const siguienteNumero = (ultimo?.numero ?? 0) + 1;

    const prefijo = PREFIJO_TIPO_OBRA[tipo_obra] ?? tipo_obra.toUpperCase().slice(0, 3);
    const codigoFinal = codigo?.trim() || `${prefijo}-${siguienteNumero.toString().padStart(2, '0')}`;

    const { data, error } = await admin
      .from('catalogo_capitulos')
      .insert({ nombre: nombre.trim(), tipo_obra, codigo: codigoFinal, numero: siguienteNumero })
      .select('id')
      .single();

    if (error) throw error;
    revalidatePath('/catalogo');
    return { success: true, data: { id: data.id } };
  } catch (error: any) {
    console.error('crearCapitulo:', error);
    return { success: false, error: 'No se pudo crear el capítulo.' };
  }
}

export async function actualizarCapitulo(
  id: string,
  input: unknown
): Promise<ActionResult> {
  try {
    const auth = await verificarAdmin();
    if ('error' in auth) return { success: false, error: auth.error };

    const parsed = actualizarCapituloSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from('catalogo_capitulos')
      .update(parsed.data)
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/catalogo');
    return { success: true };
  } catch (error: any) {
    console.error('actualizarCapitulo:', error);
    return { success: false, error: 'No se pudo actualizar el capítulo.' };
  }
}

export async function eliminarCapitulo(id: string): Promise<ActionResult> {
  try {
    const auth = await verificarAdmin();
    if ('error' in auth) return { success: false, error: auth.error };

    const admin = createAdminClient();

    const { count, error: cntErr } = await admin
      .from('catalogo_actividades')
      .select('id', { count: 'exact', head: true })
      .eq('catalogo_capitulo_id', id);

    if (cntErr) throw cntErr;

    if ((count ?? 0) > 0) {
      return {
        success: false,
        error: `Este capítulo tiene ${count} actividad${count === 1 ? '' : 'es'}. Elimínalas primero.`,
      };
    }

    const { error } = await admin.from('catalogo_capitulos').delete().eq('id', id);
    if (error) throw error;
    revalidatePath('/catalogo');
    return { success: true };
  } catch (error: any) {
    console.error('eliminarCapitulo:', error);
    return { success: false, error: 'No se pudo eliminar el capítulo.' };
  }
}

// ── Actividades ───────────────────────────────────────────────────────────────

export async function crearActividad(
  input: unknown
): Promise<ActionResult<CatalogoActividad>> {
  try {
    const auth = await verificarAdmin();
    if ('error' in auth) return { success: false, error: auth.error };

    const parsed = crearActividadCatalogoSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
    }

    const { capitulo_id, nombre, unidad, precio_referencia_nacional, rango_min, rango_max } = parsed.data;

    const admin = createAdminClient();

    const { data: cap, error: capErr } = await admin
      .from('catalogo_capitulos')
      .select('tipo_obra, codigo')
      .eq('id', capitulo_id)
      .single();

    if (capErr || !cap) return { success: false, error: 'Capítulo no encontrado.' };

    const { count: actCount } = await admin
      .from('catalogo_actividades')
      .select('id', { count: 'exact', head: true })
      .eq('catalogo_capitulo_id', capitulo_id);

    const siguienteNumero = (actCount ?? 0) + 1;
    const codigoActividad = `${cap.codigo}-${siguienteNumero.toString().padStart(3, '0')}`;

    const { data, error } = await admin
      .from('catalogo_actividades')
      .insert({
        catalogo_capitulo_id: capitulo_id,
        tipo_obra: cap.tipo_obra,
        codigo: codigoActividad,
        nombre: nombre.trim(),
        unidad: unidad.trim().toLowerCase(),
        precio_referencia_nacional,
        rango_min,
        rango_max,
      })
      .select('id, catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max, descripcion')
      .single();

    if (error) throw error;
    revalidatePath('/catalogo');
    return { success: true, data: data as CatalogoActividad };
  } catch (error: any) {
    console.error('crearActividad:', error);
    return { success: false, error: 'No se pudo crear la actividad.' };
  }
}

export async function actualizarActividad(
  id: string,
  input: unknown
): Promise<ActionResult> {
  try {
    const auth = await verificarAdmin();
    if ('error' in auth) return { success: false, error: auth.error };

    const parsed = actualizarActividadCatalogoSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
    }

    const campos: Record<string, unknown> = { ...parsed.data };
    if (campos.nombre) campos.nombre = (campos.nombre as string).trim();
    if (campos.unidad) campos.unidad = (campos.unidad as string).trim().toLowerCase();

    const admin = createAdminClient();
    const { error } = await admin
      .from('catalogo_actividades')
      .update(campos)
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/catalogo');
    return { success: true };
  } catch (error: any) {
    console.error('actualizarActividad:', error);
    return { success: false, error: 'No se pudo actualizar la actividad.' };
  }
}

export async function eliminarActividad(id: string): Promise<ActionResult> {
  try {
    const auth = await verificarAdmin();
    if ('error' in auth) return { success: false, error: auth.error };

    const admin = createAdminClient();

    // Verificar si alguna activity en presupuestos hace referencia a esta actividad
    // La actividad del catálogo no tiene FK directa a activities, pero sí se podría
    // verificar que no haya catalogo_apu_items — en ese caso los advertimos también.
    // La restricción principal es eliminar apu_items primero si existen.
    const { count: itemCount, error: itemErr } = await admin
      .from('catalogo_apu_items')
      .select('id', { count: 'exact', head: true })
      .eq('catalogo_actividad_id', id);

    if (itemErr) throw itemErr;

    // Eliminar en cascada los apu_items primero
    if ((itemCount ?? 0) > 0) {
      const { error: delItemsErr } = await admin
        .from('catalogo_apu_items')
        .delete()
        .eq('catalogo_actividad_id', id);
      if (delItemsErr) throw delItemsErr;
    }

    const { error } = await admin.from('catalogo_actividades').delete().eq('id', id);
    if (error) throw error;
    revalidatePath('/catalogo');
    return { success: true };
  } catch (error: any) {
    console.error('eliminarActividad:', error);
    return { success: false, error: 'No se pudo eliminar la actividad.' };
  }
}

// ── Ítems APU del catálogo ────────────────────────────────────────────────────

export async function crearCatalogoAPUItem(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const auth = await verificarAdmin();
    if ('error' in auth) return { success: false, error: auth.error };

    const parsed = crearCatalogoAPUItemSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
    }
    const { actividad_id, nombre, unidad, cantidad, precio_unitario, tipo, orden } = parsed.data;

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('catalogo_apu_items')
      .insert({
        catalogo_actividad_id: actividad_id,
        nombre: nombre.trim(),
        unidad: unidad.trim().toLowerCase(),
        cantidad,
        precio_unitario,
        tipo,
        orden,
      })
      .select('id')
      .single();

    if (error) throw error;
    revalidatePath('/catalogo');
    return { success: true, data: { id: data.id } };
  } catch (error: any) {
    console.error('crearCatalogoAPUItem:', error);
    return { success: false, error: 'No se pudo crear el ítem APU.' };
  }
}

export async function actualizarCatalogoAPUItem(
  id: string,
  input: unknown
): Promise<ActionResult> {
  try {
    const auth = await verificarAdmin();
    if ('error' in auth) return { success: false, error: auth.error };

    const parsed = actualizarCatalogoAPUItemSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
    }

    const campos: Record<string, unknown> = { ...parsed.data };
    if (campos.nombre) campos.nombre = (campos.nombre as string).trim();
    if (campos.unidad) campos.unidad = (campos.unidad as string).trim().toLowerCase();

    const admin = createAdminClient();
    const { error } = await admin
      .from('catalogo_apu_items')
      .update(campos)
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/catalogo');
    return { success: true };
  } catch (error: any) {
    console.error('actualizarCatalogoAPUItem:', error);
    return { success: false, error: 'No se pudo actualizar el ítem APU.' };
  }
}

export async function eliminarCatalogoAPUItem(id: string): Promise<ActionResult> {
  try {
    const auth = await verificarAdmin();
    if ('error' in auth) return { success: false, error: auth.error };

    const admin = createAdminClient();
    const { error } = await admin.from('catalogo_apu_items').delete().eq('id', id);
    if (error) throw error;
    revalidatePath('/catalogo');
    return { success: true };
  } catch (error: any) {
    console.error('eliminarCatalogoAPUItem:', error);
    return { success: false, error: 'No se pudo eliminar el ítem APU.' };
  }
}

export async function obtenerAPUItemsActividad(
  actividadId: string
): Promise<ActionResult<CatalogoApuItem[]>> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('catalogo_apu_items')
      .select('id, catalogo_actividad_id, tipo, nombre, descripcion, unidad, cantidad, precio_unitario, orden')
      .eq('catalogo_actividad_id', actividadId)
      .order('orden', { ascending: true });

    if (error) throw error;
    return { success: true, data: (data ?? []) as CatalogoApuItem[] };
  } catch (error: any) {
    console.error('obtenerAPUItemsActividad:', error);
    return { success: false, error: 'No se pudieron cargar los ítems APU.' };
  }
}

// ── Búsqueda de insumos del catálogo (materials / trabajadores / equipment) ──

export async function buscarInsumosCatalogo(
  query: string,
  tipo: string
): Promise<ActionResult<ResultadoBusquedaInsumo[]>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado.' };

    const q = query.trim();
    const LIMIT = 10;

    if (tipo === 'material') {
      const { data, error } = await supabase
        .from('materials')
        .select('id, nombre, unidad, precio_referencia')
        .ilike('nombre', `%${q}%`)
        .limit(LIMIT);
      if (error) throw error;
      return {
        success: true,
        data: (data ?? []).map(m => ({
          id: m.id,
          nombre: m.nombre ?? '',
          unidad: m.unidad ?? 'und',
          precio_unitario: Number(m.precio_referencia ?? 0),
          origen: 'material' as const,
        })),
      };
    }

    if (tipo === 'mano_obra') {
      const { data, error } = await supabase
        .from('trabajadores')
        .select('id, especialidad, jornal_con_prestaciones')
        .ilike('especialidad', `%${q}%`)
        .eq('activo', true)
        .limit(LIMIT);
      if (error) throw error;
      return {
        success: true,
        data: (data ?? []).map(t => ({
          id: t.id,
          nombre: t.especialidad ?? '',
          unidad: 'jor',
          precio_unitario: Number(t.jornal_con_prestaciones ?? 0),
          origen: 'trabajador' as const,
        })),
      };
    }

    if (tipo === 'equipo') {
      const { data, error } = await supabase
        .from('equipment')
        .select('id, nombre, unidad, precio_diario')
        .ilike('nombre', `%${q}%`)
        .limit(LIMIT);
      if (error) throw error;
      return {
        success: true,
        data: (data ?? []).map(e => ({
          id: e.id,
          nombre: e.nombre ?? '',
          unidad: e.unidad ?? 'día',
          precio_unitario: Number(e.precio_diario ?? 0),
          origen: 'equipo' as const,
        })),
      };
    }

    // herramienta_menor y epp — busca en materials filtrando por categoria
    const categoriaFiltro = tipo === 'epp' ? '%epp%' : '%herramienta%';
    const { data, error } = await supabase
      .from('materials')
      .select('id, nombre, unidad, precio_referencia')
      .ilike('nombre', `%${q}%`)
      .ilike('categoria', categoriaFiltro)
      .limit(LIMIT);
    if (error) throw error;
    return {
      success: true,
      data: (data ?? []).map(m => ({
        id: m.id,
        nombre: m.nombre ?? '',
        unidad: m.unidad ?? 'und',
        precio_unitario: Number(m.precio_referencia ?? 0),
        origen: 'material' as const,
      })),
    };
  } catch (error: any) {
    console.error('buscarInsumosCatalogo:', error);
    return { success: false, error: 'Error al buscar insumos.' };
  }
}

export async function buscarCuadrillas(
  query: string
): Promise<ActionResult<ResultadoBusquedaCuadrilla[]>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado.' };

    const { data, error } = await supabase
      .from('cuadrillas')
      .select(`
        id,
        nombre,
        es_sistema,
        cuadrilla_trabajadores (
          cantidad,
          trabajadores (
            especialidad,
            jornal_con_prestaciones
          )
        )
      `)
      .ilike('nombre', `%${query.trim()}%`)
      .eq('activa', true)
      .limit(5);

    if (error) throw error;

    return {
      success: true,
      data: (data ?? []).map((c: any) => {
        const trabajadores = (c.cuadrilla_trabajadores ?? [])
          .map((ct: any) => ({
            nombre: ct.trabajadores?.especialidad ?? '',
            cantidad: Number(ct.cantidad ?? 1),
            jornal: Number(ct.trabajadores?.jornal_con_prestaciones ?? 0),
            unidad: 'jor',
          }))
          .filter((t: any) => t.nombre);

        const costo_total_dia = trabajadores.reduce(
          (sum: number, t: any) => sum + t.jornal * t.cantidad,
          0
        );

        return {
          id: c.id,
          nombre: c.nombre ?? '',
          costo_total_dia,
          es_sistema: c.es_sistema ?? false,
          trabajadores,
        };
      }),
    };
  } catch (error: any) {
    console.error('buscarCuadrillas:', error);
    return { success: false, error: 'Error al buscar cuadrillas.' };
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
