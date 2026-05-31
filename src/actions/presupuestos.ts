'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { presupuestoSchema, capituloSchema, actividadSchema, apuItemSchema } from '@/lib/validations/schemas';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/types';
import Decimal from 'decimal.js';

// Busca la tasa ReteICA en la tabla municipios. Retorna null si la ciudad no está registrada.
async function lookupReteICA(supabase: Awaited<ReturnType<typeof createClient>>, ciudad: string): Promise<number | null> {
  const { data } = await supabase
    .from('municipios')
    .select('reteica_pct')
    .eq('nombre', ciudad)
    .maybeSingle();
  return data?.reteica_pct != null ? Number(data.reteica_pct) : null;
}

/**
 * Crea un nuevo presupuesto
 */
export async function crearPresupuesto(
  projectId: string,
  titulo: string,
  ciudadObra?: string,
  capitulos?: string[]
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Sesión no válida.' };

    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.success) return { success: false, error: 'Límite de solicitudes excedido.' };

    const [{ data: profile }, { data: proyectoData }] = await Promise.all([
      supabase.from('profiles').select('municipio, ciudad').eq('id', user.id).single(),
      supabase.from('projects').select('ubicacion').eq('id', projectId).single(),
    ]);

    const ciudadFinal = proyectoData?.ubicacion || ciudadObra || profile?.municipio || profile?.ciudad || 'Bogotá D.C.';
    const icaPct = (await lookupReteICA(supabase, ciudadFinal)) ?? 0;

    const validated = presupuestoSchema.parse({
      titulo,
      estado: 'borrador',
      administracion_pct: 10,
      imprevistos_pct: 5,
      utilidad_pct: 10,
      iva_porcentaje: 19,
      retefuente_pct: 2,
      ica_pct: icaPct,
    });

    const { data, error } = await supabase
      .from('budgets')
      .insert({
        ...validated,
        project_id: projectId,
        user_id: user.id,
        ciudad_ica: ciudadFinal,
      })
      .select()
      .single();

    if (error) throw error;

    // Crear capítulos de la plantilla si se proporcionaron
    if (capitulos && capitulos.length > 0) {
      const capitulosValidos = capitulos.filter(n => n.trim().length > 0);
      if (capitulosValidos.length > 0) {
        await supabase.from('chapters').insert(
          capitulosValidos.map((nombre, idx) => ({
            budget_id: data.id,
            user_id: user.id,
            nombre: nombre.trim(),
            numero: idx + 1,
          }))
        );
      }
    }

    revalidatePath(`/proyectos/${projectId}`);
    return { success: true, data };
  } catch (error: any) {
    if (error.name === 'ZodError') return { success: false, error: error.issues?.[0]?.message ?? 'Datos inválidos.' };
    return { success: false, error: 'Error al crear el presupuesto.' };
  }
}

/**
 * Obtiene un presupuesto completo con sus capítulos y actividades (solo activos).
 *
 * Los APUs se cargan en query separada porque apus tiene dos FK (activity_id y
 * budget_id) y PostgREST entra en ambigüedad al resolverlas en un join anidado
 * profundo budgets→chapters→activities→apus, devolviendo arrays vacíos.
 */
export async function obtenerPresupuesto(budgetId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Query principal: presupuesto con capítulos y actividades (sin APUs anidados)
    const { data, error } = await supabase
      .from('budgets')
      .select(`
        *,
        projects(
          nombre,
          ubicacion,
          area_m2,
          cliente_id,
          cliente_nombre,
          tipo_obra,
          clientes (*)
        ),
        chapters (
          *,
          activities (*)
        )
      `)
      .eq('id', budgetId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (error) throw error;

    // Query separada para APUs con sus ítems (evita ambigüedad de FK en PostgREST)
    const { data: apusData } = await supabase
      .from('apus')
      .select('*, apu_items(*)')
      .eq('budget_id', budgetId)
      .eq('user_id', user.id)
      .is('deleted_at', null);

    // Indexar APUs por activity_id para merge O(1)
    const apusByActivityId: Record<string, any> = {};
    for (const apu of apusData ?? []) {
      apusByActivityId[apu.activity_id] = apu;
    }

    // Filtrar capítulos/actividades soft-deleted, ordenar por numero y adjuntar APU a cada actividad
    if (data.chapters) {
      data.chapters = data.chapters
        .filter((ch: any) => !ch.deleted_at)
        .sort((a: any, b: any) => (a.numero ?? 0) - (b.numero ?? 0))
        .map((ch: any) => ({
          ...ch,
          activities: (ch.activities || [])
            .filter((act: any) => !act.deleted_at)
            .map((act: any) => ({
              ...act,
              apus: apusByActivityId[act.id] ? [apusByActivityId[act.id]] : [],
            })),
        }));
    }

    // Sincronizar ica_pct al abrir: si la ciudad está en municipios y la tasa cambió, actualizar.
    // Si la ciudad no está registrada → dejar el valor manual existente.
    if (data.ciudad_ica) {
      const icaDesde = await lookupReteICA(supabase, data.ciudad_ica);
      if (icaDesde !== null && icaDesde !== Number(data.ica_pct)) {
        await supabase
          .from('budgets')
          .update({ ica_pct: icaDesde, updated_at: new Date().toISOString() })
          .eq('id', budgetId)
          .eq('user_id', user.id)
          .is('deleted_at', null);
        data.ica_pct = icaDesde;
      }
    }

    return { data };
  } catch (error) {
    return { error: 'No se pudo cargar el presupuesto.' };
  }
}

/**
 * Actualiza los parámetros de un presupuesto
 */
export async function actualizarPresupuesto(
  budgetId: string,
  campos: any
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.success) return { success: false, error: 'Límite excedido.' };

    const validated = presupuestoSchema.partial().parse(campos);

    const { error } = await supabase
      .from('budgets')
      .update({ ...validated, updated_at: new Date().toISOString() })
      .eq('id', budgetId)
      .eq('user_id', user.id)
      .is('deleted_at', null);

    if (error) throw error;

    revalidatePath(`/presupuestos/${budgetId}`);
    return { success: true };
  } catch (error: any) {
    if (error.name === 'ZodError') return { success: false, error: error.issues?.[0]?.message ?? 'Datos inválidos.' };
    return { success: false, error: 'Error al actualizar.' };
  }
}

/**
 * Soft delete de un presupuesto.
 * Solo permite eliminar si el estado es 'borrador' o 'rechazado'.
 */
export async function eliminarPresupuesto(id: string, projectId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const { data: budget } = await supabase
      .from('budgets')
      .select('id, estado')
      .eq('id', id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (!budget) return { success: false, error: 'Presupuesto no encontrado.' };

    if (!['borrador', 'rechazado'].includes(budget.estado)) {
      return { success: false, error: 'Solo se pueden eliminar presupuestos en borrador o rechazados.' };
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from('budgets')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    revalidatePath(`/proyectos/${projectId}`);
    revalidatePath('/proyectos');
    return { success: true };
  } catch (error) {
    console.error('[eliminarPresupuesto] error:', error);
    return { success: false, error: 'No se pudo eliminar el presupuesto.' };
  }
}

// --- CAPÍTULOS Y ACTIVIDADES ---

export async function agregarCapitulo(budgetId: string, nombre: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const validated = capituloSchema.parse({ nombre, numero: 1 });

    const { data, error } = await supabase
      .from('chapters')
      .insert({
        budget_id: budgetId,
        user_id: user.id,
        nombre: validated.nombre,
        numero: 1
      })
      .select()
      .single();

    if (error) throw error;
    revalidatePath(`/presupuestos/${budgetId}`);
    return { success: true, data };
  } catch (error: any) {
    console.error('[agregarCapitulo] error:', error);
    return { success: false, error: 'No se pudo agregar el capítulo.' };
  }
}

export async function actualizarCapitulo(chapterId: string, budgetId: string, nombre: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const nombreFinal = nombre.trim() || 'Sin nombre';
    const { error } = await supabase
      .from('chapters')
      .update({ nombre: nombreFinal })
      .eq('id', chapterId)
      .eq('user_id', user.id);

    if (error) throw error;
    revalidatePath(`/presupuestos/${budgetId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Error al actualizar el capítulo.' };
  }
}

export async function eliminarCapitulo(chapterId: string, budgetId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const { error } = await supabase
      .from('chapters')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', chapterId)
      .eq('user_id', user.id);

    if (error) throw error;
    revalidatePath(`/presupuestos/${budgetId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Error al eliminar capítulo.' };
  }
}

export async function agregarActividad(chapterId: string, budgetId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const { data, error } = await supabase
      .from('activities')
      .insert({
        chapter_id: chapterId,
        budget_id: budgetId,
        user_id: user.id,
        nombre: 'Nueva actividad',
        unidad: 'un',
        cantidad: 1,
        precio_unitario: 0
      })
      .select()
      .single();

    if (error) throw error;
    revalidatePath(`/presupuestos/${budgetId}`);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Error al agregar actividad.' };
  }
}

export async function eliminarActividad(activityId: string, budgetId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const { error } = await supabase
      .from('activities')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', activityId)
      .eq('user_id', user.id);

    if (error) throw error;
    revalidatePath(`/presupuestos/${budgetId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Error al eliminar actividad.' };
  }
}

export async function obtenerAPU(activityId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const { data, error } = await supabase
      .from('apus')
      .select('*, apu_items(*)')
      .eq('activity_id', activityId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Error al obtener APU.' };
  }
}

export async function guardarAPU(
  activityId: string,
  budgetId: string,
  payload: { id?: string; rendimiento: number; items: Array<Record<string, unknown>> }
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    if (payload.rendimiento <= 0) {
      return { success: false, error: 'El rendimiento debe ser mayor a 0.' };
    }

    let apuId = payload.id;

    if (!apuId) {
      // Buscar APU existente para esta actividad antes de crear uno nuevo (evita duplicados al guardar varias veces)
      const { data: existing } = await supabase
        .from('apus')
        .select('id')
        .eq('activity_id', activityId)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .maybeSingle();

      if (existing) {
        apuId = existing.id;
      } else {
        const { data, error } = await supabase
          .from('apus')
          .insert({ activity_id: activityId, budget_id: budgetId, user_id: user.id, rendimiento: payload.rendimiento })
          .select('id')
          .single();
        if (error) throw error;
        apuId = data.id;
      }
    }

    // Reemplazar ítems del APU (hard delete válido — son detalles del APU, no entidades independientes)
    await supabase.from('apu_items').delete().eq('apu_id', apuId).eq('user_id', user.id);
    const validated = payload.items.length > 0
      ? payload.items.map(item => apuItemSchema.parse(item))
      : [];
    if (validated.length > 0) {
      const { error } = await supabase
        .from('apu_items')
        .insert(validated.map(item => ({ 
          ...item, 
          apu_id: apuId, 
          user_id: user.id 
        })));
      if (error) throw error;
    }

    // Calcular costos agregados desde los ítems usando Decimal.js
    let costoMaterial = new Decimal(0);
    let costoManoObra = new Decimal(0);
    let costoEquipo = new Decimal(0);

    for (const item of validated) {
      const subtotal = new Decimal(item.cantidad).mul(item.precio_unitario);
      if (item.tipo === 'material') costoMaterial = costoMaterial.plus(subtotal);
      else if (item.tipo === 'mano_obra') costoManoObra = costoManoObra.plus(subtotal);
      else if (item.tipo === 'equipo') costoEquipo = costoEquipo.plus(subtotal);
    }

    const pctHM  = new Decimal(3);
    const pctEPP = new Decimal(1);
    const costoHM  = costoManoObra.mul(pctHM).div(100);
    const costoEPP = costoManoObra.mul(pctEPP).div(100);

    const { error: apuUpdateErr } = await supabase
      .from('apus')
      .update({
        rendimiento: payload.rendimiento,
        costo_material:         costoMaterial.toDecimalPlaces(2).toNumber(),
        costo_mano_obra:        costoManoObra.toDecimalPlaces(2).toNumber(),
        costo_equipo:           costoEquipo.toDecimalPlaces(2).toNumber(),
        costo_herramienta_menor: costoHM.toDecimalPlaces(2).toNumber(),
        costo_epp:              costoEPP.toDecimalPlaces(2).toNumber(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', apuId)
      .eq('user_id', user.id);
    if (apuUpdateErr) throw apuUpdateErr;

    revalidatePath(`/presupuestos/${budgetId}`);
    return { success: true };
  } catch (error: any) {
    if (error.name === 'ZodError') return { success: false, error: error.issues?.[0]?.message ?? 'Datos inválidos.' };
    return { success: false, error: 'Error al guardar APU.' };
  }
}

export async function createBudgetFromAI(
  projectId: string,
  budgetData: { titulo: string; capitulos: Array<{ nombre: string; actividades: Array<{ nombre: string; unidad: string; cantidad: number; precio_unitario: number }> }> }
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('administracion_pct, imprevistos_pct, utilidad_pct')
      .eq('id', user.id)
      .single();

    const { data: budget, error: bErr } = await supabase
      .from('budgets')
      .insert({
        project_id: projectId,
        user_id: user.id,
        titulo: budgetData.titulo,
        estado: 'borrador',
        administracion_pct: (profile as any)?.administracion_pct ?? 10,
        imprevistos_pct: (profile as any)?.imprevistos_pct ?? 5,
        utilidad_pct: (profile as any)?.utilidad_pct ?? 10,
        iva_porcentaje: 19,
        metodo_iva: 'sobre_utilidad',
      })
      .select()
      .single();

    if (bErr || !budget) throw bErr;

    for (let i = 0; i < budgetData.capitulos.length; i++) {
      const cap = budgetData.capitulos[i];
      const { data: chapter } = await supabase
        .from('chapters')
        .insert({ budget_id: budget.id, user_id: user.id, nombre: cap.nombre, numero: i + 1 })
        .select()
        .single();
      if (!chapter) continue;

      for (let j = 0; j < cap.actividades.length; j++) {
        const act = cap.actividades[j];
        await supabase.from('activities').insert({
          chapter_id: chapter.id,
          budget_id: budget.id,
          user_id: user.id,
          nombre: act.nombre,
          unidad: act.unidad,
          cantidad: act.cantidad,
          precio_unitario: act.precio_unitario,
          numero: j + 1,
        });
      }
    }

    revalidatePath(`/proyectos/${projectId}`);
    return { success: true, data: { budgetId: budget.id } };
  } catch (error: any) {
    console.error('Error createBudgetFromAI:', error);
    return { success: false, error: 'No se pudo crear el presupuesto desde la IA.' };
  }
}

const TRANSICIONES_VALIDAS: Record<string, string[]> = {
  borrador:    ['en_revision'],
  en_revision: ['aprobado', 'rechazado'],
  rechazado:   ['borrador'],
  aprobado:    ['archivado'],
  archivado:   [],
};

/**
 * Cambia el estado de un presupuesto respetando la máquina de estados definida en BD.
 * Usa admin client para poder archivar presupuestos aprobados (RLS bloquea UPDATE cuando estado='aprobado').
 * Cuando el presupuesto pasa a 'aprobado' y el proyecto está en 'borrador', lo avanza a 'en_progreso'.
 */
export async function cambiarEstadoPresupuesto(
  budgetId: string,
  nuevoEstado: string,
  projectId: string
): Promise<ActionResult> {
  const estadosValidos = Object.keys(TRANSICIONES_VALIDAS);
  if (!estadosValidos.includes(nuevoEstado)) {
    return { success: false, error: 'Estado no válido.' };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const { data: budget } = await supabase
      .from('budgets')
      .select('estado, project_id')
      .eq('id', budgetId)
      .eq('user_id', user.id)
      .single();

    if (!budget) return { success: false, error: 'Presupuesto no encontrado.' };

    const permitidos = TRANSICIONES_VALIDAS[budget.estado] ?? [];
    if (!permitidos.includes(nuevoEstado)) {
      return { success: false, error: `Transición no permitida: "${budget.estado}" → "${nuevoEstado}".` };
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from('budgets')
      .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
      .eq('id', budgetId)
      .eq('user_id', user.id);
    if (error) throw error;

    // Registrar cambio en audit_log (fire-and-forget, no bloquea si falla)
    void (async () => {
      try {
        await supabase.from('audit_log').insert({
          tabla: 'budgets',
          operacion: 'CAMBIO_ESTADO',
          registro_id: budgetId,
          user_id: user.id,
          datos_anteriores: { estado: budget.estado },
          datos_nuevos: { estado: nuevoEstado },
        });
      } catch { /* silencioso */ }
    })();

    // Auto-avanzar proyecto a 'en_progreso' si acaba de aprobarse el presupuesto
    if (nuevoEstado === 'aprobado') {
      const { data: proyecto } = await supabase
        .from('projects')
        .select('estado')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single();

      if (proyecto?.estado === 'borrador') {
        await admin
          .from('projects')
          .update({ estado: 'en_progreso', updated_at: new Date().toISOString() })
          .eq('id', projectId)
          .eq('user_id', user.id);
      }
    }

    revalidatePath(`/proyectos/${projectId}`);
    revalidatePath(`/presupuestos/${budgetId}`);
    revalidatePath('/proyectos');
    return { success: true };
  } catch (error) {
    console.error('[cambiarEstadoPresupuesto] error:', error);
    return { success: false, error: 'No se pudo cambiar el estado.' };
  }
}

export async function actualizarActividad(
  activityId: string,
  budgetId: string,
  campos: Record<string, unknown>
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.success) return { success: false, error: 'Límite excedido.' };

    const validated = actividadSchema.partial().parse(campos);

    const { error } = await supabase
      .from('activities')
      .update({ ...validated, updated_at: new Date().toISOString() })
      .eq('id', activityId)
      .eq('budget_id', budgetId)
      .eq('user_id', user.id)
      .is('deleted_at', null);

    if (error) throw error;

    revalidatePath(`/presupuestos/${budgetId}`);
    return { success: true };
  } catch (error: any) {
    if (error.name === 'ZodError') return { success: false, error: error.issues?.[0]?.message ?? 'Datos inválidos.' };
    return { success: false, error: 'Error al actualizar actividad.' };
  }
}

/**
 * Sincroniza el precio unitario de un ítem de APU vinculado a una cuadrilla.
 * Recalcula el costo_dia actual de la cuadrilla y actualiza el ítem.
 */
/**
 * Aprueba un presupuesto (en_revision → aprobado).
 * El trigger fn_increment_budget_version llena aprobado_en automáticamente.
 * Avanza el proyecto a 'en_progreso' si aún está en borrador.
 * Usa admin client: la política RLS budgets_update_lock bloquea UPDATEs
 * a presupuestos aprobados para usuarios normales.
 */
export async function aprobarPresupuesto(budgetId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const { data: budget } = await supabase
      .from('budgets')
      .select('estado, project_id')
      .eq('id', budgetId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (!budget) return { success: false, error: 'Presupuesto no encontrado.' };
    if (budget.estado !== 'en_revision') {
      return { success: false, error: 'Solo se pueden aprobar presupuestos en revisión.' };
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from('budgets')
      .update({ estado: 'aprobado', updated_at: new Date().toISOString() })
      .eq('id', budgetId)
      .eq('user_id', user.id);

    if (error) throw error;

    const { data: proyecto } = await supabase
      .from('projects')
      .select('estado')
      .eq('id', budget.project_id)
      .eq('user_id', user.id)
      .single();

    if (proyecto?.estado === 'borrador') {
      await admin
        .from('projects')
        .update({ estado: 'en_progreso', updated_at: new Date().toISOString() })
        .eq('id', budget.project_id)
        .eq('user_id', user.id);
    }

    revalidatePath(`/proyectos/${budget.project_id}`);
    revalidatePath(`/presupuestos/${budgetId}`);
    revalidatePath('/proyectos');
    return { success: true };
  } catch (error) {
    console.error('[aprobarPresupuesto] error:', error);
    return { success: false, error: 'No se pudo aprobar el presupuesto.' };
  }
}

/**
 * Reabre un presupuesto aprobado, regresándolo a borrador.
 * El trigger fn_increment_budget_version limpia aprobado_en = NULL automáticamente.
 * Usa admin client: la política RLS budgets_update_lock bloquea UPDATEs
 * a presupuestos aprobados para usuarios normales.
 */
export async function reabrirPresupuesto(budgetId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const { data: budget } = await supabase
      .from('budgets')
      .select('estado, project_id')
      .eq('id', budgetId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (!budget) return { success: false, error: 'Presupuesto no encontrado.' };
    if (budget.estado !== 'aprobado') {
      return { success: false, error: 'Solo se pueden reabrir presupuestos aprobados.' };
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from('budgets')
      .update({ estado: 'borrador', updated_at: new Date().toISOString() })
      .eq('id', budgetId)
      .eq('user_id', user.id);

    if (error) throw error;

    revalidatePath(`/proyectos/${budget.project_id}`);
    revalidatePath(`/presupuestos/${budgetId}`);
    revalidatePath('/proyectos');
    return { success: true };
  } catch (error) {
    console.error('[reabrirPresupuesto] error:', error);
    return { success: false, error: 'No se pudo reabrir el presupuesto.' };
  }
}

export async function sincronizarPrecioCuadrilla(
  apuItemId: string,
  budgetId: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    // 1. Obtener el ítem para verificar cuadrilla vinculada
    const { data: item, error: itemErr } = await supabase
      .from('apu_items')
      .select('*, apus(rendimiento)')
      .eq('id', apuItemId)
      .eq('user_id', user.id)
      .single();

    if (itemErr || !item || !item.cuadrilla_id) {
      return { success: false, error: 'Ítem no vinculado a una cuadrilla o no encontrado.' };
    }

    // 2. Obtener la cuadrilla con sus trabajadores actuales
    const { data: cuadrilla, error: cuadErr } = await supabase
      .from('cuadrillas')
      .select(`
        id,
        nombre,
        cuadrilla_trabajadores (
          cantidad,
          trabajadores (
            jornal_base,
            factor_prestacional
          )
        )
      `)
      .eq('id', item.cuadrilla_id)
      .single();

    if (cuadErr || !cuadrilla) {
      return { success: false, error: 'No se pudo obtener la información de la cuadrilla.' };
    }

    // 3. Calcular costo_dia actual usando Decimal.js
    let costoDia = new Decimal(0);
    for (const ct of cuadrilla.cuadrilla_trabajadores || []) {
      const trab = Array.isArray(ct.trabajadores) ? ct.trabajadores[0] : ct.trabajadores;
      const jornal = new Decimal(trab?.jornal_base || 0);
      const factor = new Decimal(trab?.factor_prestacional || 1.64);
      const cantidad = new Decimal(ct.cantidad || 1);
      costoDia = costoDia.plus(jornal.mul(factor).mul(cantidad));
    }

    const nuevoPrecio = costoDia.toDecimalPlaces(0).toNumber(); // Redondeado a entero (COP)

    // 4. Actualizar el ítem
    const { error: updateErr } = await supabase
      .from('apu_items')
      .update({ 
        precio_unitario: nuevoPrecio,
        precio_editado_manual: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', apuItemId)
      .eq('user_id', user.id);

    if (updateErr) throw updateErr;

    // 5. Recalcular los totales del APU y actualizar la tabla 'apus' para disparar la cadena de sincronización
    const { data: allItems } = await supabase
      .from('apu_items')
      .select('tipo, cantidad, precio_unitario')
      .eq('apu_id', item.apu_id);

    let costoMaterial = new Decimal(0);
    let costoManoObra = new Decimal(0);
    let costoEquipo = new Decimal(0);

    for (const it of allItems || []) {
      const subtotal = new Decimal(it.cantidad).mul(it.precio_unitario);
      if (it.tipo === 'material') costoMaterial = costoMaterial.plus(subtotal);
      else if (it.tipo === 'mano_obra') costoManoObra = costoManoObra.plus(subtotal);
      else if (it.tipo === 'equipo') costoEquipo = costoEquipo.plus(subtotal);
    }

    const costoHM = costoManoObra.mul(0.03);
    const costoEPP = costoManoObra.mul(0.01);

    const { error: apuUpdateErr } = await supabase
      .from('apus')
      .update({
        costo_material: costoMaterial.toDecimalPlaces(2).toNumber(),
        costo_mano_obra: costoManoObra.toDecimalPlaces(2).toNumber(),
        costo_equipo: costoEquipo.toDecimalPlaces(2).toNumber(),
        costo_herramienta_menor: costoHM.toDecimalPlaces(2).toNumber(),
        costo_epp: costoEPP.toDecimalPlaces(2).toNumber(),
        updated_at: new Date().toISOString()
      })
      .eq('id', item.apu_id)
      .eq('user_id', user.id);

    if (apuUpdateErr) throw apuUpdateErr;

    revalidatePath(`/presupuestos/${budgetId}`);
    return { success: true };
  } catch (err) {
    console.error('[sincronizarPrecioCuadrilla] error:', err);
    return { success: false, error: 'Error al sincronizar precio de cuadrilla.' };
  }
}

/**
 * Actualiza la ciudad ICA de un presupuesto y busca automáticamente
 * la tasa reteica_pct en la tabla municipios.
 */
export async function actualizarCiudadICA(
  budgetId: string,
  ciudad: string
): Promise<ActionResult<{ ica_pct: number }>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado.' };

    const icaDesde = await lookupReteICA(supabase, ciudad);

    // Solo actualizar ica_pct si la ciudad está en la tabla municipios.
    // Si no está registrada, actualizar solo ciudad_ica y dejar el valor manual intacto.
    const updateFields: Record<string, unknown> = {
      ciudad_ica: ciudad,
      updated_at: new Date().toISOString(),
    };
    if (icaDesde !== null) {
      updateFields.ica_pct = icaDesde;
    }

    const { error } = await supabase
      .from('budgets')
      .update(updateFields)
      .eq('id', budgetId)
      .eq('user_id', user.id)
      .is('deleted_at', null);

    if (error) throw error;

    revalidatePath(`/presupuestos/${budgetId}`);
    return { success: true, data: { ica_pct: icaDesde ?? 0 } };
  } catch {
    return { success: false, error: 'No se pudo actualizar la ciudad ICA.' };
  }
}

export async function actualizarVigencia(
  budgetId: string,
  dias: number
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado.' };

    const { error } = await supabase
      .from('budgets')
      .update({ vigencia_dias: dias, updated_at: new Date().toISOString() })
      .eq('id', budgetId)
      .eq('user_id', user.id)
      .is('deleted_at', null);

    if (error) throw error;
    revalidatePath(`/presupuestos/${budgetId}`);
    return { success: true };
  } catch {
    return { success: false, error: 'No se pudo actualizar la vigencia.' };
  }
}
