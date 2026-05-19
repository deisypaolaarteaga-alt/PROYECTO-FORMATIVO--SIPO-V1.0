'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { proyectoSchema } from '@/lib/validations/schemas';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/types';

/**
 * Crea un nuevo proyecto
 */
export async function createProject(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Sesión expirada o no válida.' };

    // Rate Limiting
    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.success) return { success: false, error: `Demasiadas solicitudes. Intenta en ${rateLimit.retryAfter}s.` };

    // Validación Zod — convierte strings vacíos a undefined (FormData siempre envía "")
    const raw = Object.fromEntries(formData.entries());
    const sanitized = Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, v === '' ? undefined : v])
    );
    const validated = proyectoSchema.parse(sanitized);

    const { data, error } = await supabase
      .from('projects')
      .insert({
        ...validated,
        user_id: user.id,
        estado: 'borrador',
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/proyectos');
    revalidatePath('/dashboard');
    return { success: true, data };
  } catch (error: any) {
    if (error.name === 'ZodError') return { success: false, error: error.issues?.[0]?.message ?? 'Datos inválidos.' };
    return { success: false, error: 'No se pudo crear el proyecto.' };
  }
}

/**
 * Obtiene todos los proyectos activos del usuario con datos enriquecidos:
 * valor_total, fecha_vence_proxima, presupuestos_count, presupuesto_estado_reciente.
 */
export async function getProjects() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: projects } = await supabase
    .from('projects')
    .select('*, budgets(id, estado, created_at, vigencia_dias), clientes(nombre_razon_social)')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  if (!projects || projects.length === 0) return [];

  // Recolectar todos los budget IDs para consulta en lote
  const allBudgetIds = projects
    .flatMap((p: any) => (p.budgets ?? []).map((b: any) => b.id))
    .filter(Boolean) as string[];

  // Obtener total_oferta desde v_resumen_presupuesto en una sola query
  const resumenMap: Record<string, number> = {};
  if (allBudgetIds.length > 0) {
    const { data: resumenes } = await supabase
      .from('v_resumen_presupuesto')
      .select('budget_id, total_oferta')
      .in('budget_id', allBudgetIds);

    for (const r of resumenes ?? []) {
      resumenMap[r.budget_id] = Number(r.total_oferta ?? 0);
    }
  }

  return projects.map((p: any) => {
    const budgets: any[] = p.budgets ?? [];

    const presupuestos_count = budgets.length;
    const presupuesto_estado_reciente = budgets[0]?.estado ?? null;
    const valor_total = budgets.reduce((sum, b) => sum + (resumenMap[b.id] ?? 0), 0);

    // Fecha de vencimiento más próxima entre presupuestos con vigencia definida
    const fechas = budgets
      .filter(b => b.created_at && b.vigencia_dias)
      .map(b => new Date(b.created_at).getTime() + Number(b.vigencia_dias) * 86400000);
    const fecha_vence_proxima = fechas.length > 0
      ? new Date(Math.min(...fechas)).toISOString()
      : null;

    return { ...p, presupuestos_count, presupuesto_estado_reciente, valor_total, fecha_vence_proxima };
  });
}

/**
 * Obtiene un proyecto específico (solo si no está borrado)
 */
export async function getProject(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('projects')
    .select('*, clientes(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single();
    
  return data;
}

/**
 * Actualiza un proyecto
 */
export async function updateProject(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.success) return { success: false, error: 'Demasiadas solicitudes.' };

    const raw = Object.fromEntries(formData.entries());
    const sanitized = Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, v === '' ? undefined : v])
    );
    const validated = proyectoSchema.parse(sanitized);

    const { error } = await supabase
      .from('projects')
      .update(validated)
      .eq('id', id)
      .eq('user_id', user.id)
      .is('deleted_at', null);

    if (error) throw error;

    revalidatePath(`/proyectos/${id}`);
    revalidatePath('/proyectos');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'No se pudo actualizar el proyecto.' };
  }
}

/**
 * Actualiza campos de un proyecto usando un objeto plano (sin FormData)
 */
export async function actualizarProyecto(
  id: string,
  campos: Record<string, unknown>
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.success) return { success: false, error: 'Demasiadas solicitudes.' };

    const validated = proyectoSchema.partial().parse(campos);

    const { error } = await supabase
      .from('projects')
      .update({ ...validated, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .is('deleted_at', null);

    if (error) throw error;

    revalidatePath(`/proyectos/${id}`);
    revalidatePath('/proyectos');
    return { success: true };
  } catch (error: any) {
    if (error.name === 'ZodError') return { success: false, error: error.issues?.[0]?.message ?? 'Datos inválidos.' };
    return { success: false, error: 'No se pudo actualizar el proyecto.' };
  }
}

const TRANSICIONES_PROYECTO: Record<string, string[]> = {
  borrador:    ['en_progreso'],
  en_progreso: ['finalizado'],
  finalizado:  ['archivado'],
  archivado:   [],
};

/**
 * Cambia el estado de un proyecto.
 * Las transiciones válidas son: borrador→en_progreso→finalizado→archivado.
 * Llamado automáticamente desde cambiarEstadoPresupuesto cuando se aprueba un presupuesto.
 */
export async function cambiarEstadoProyecto(
  proyectoId: string,
  nuevoEstado: string
): Promise<ActionResult> {
  const estadosValidos = Object.keys(TRANSICIONES_PROYECTO);
  if (!estadosValidos.includes(nuevoEstado)) {
    return { success: false, error: 'Estado de proyecto no válido.' };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const { data: proyecto } = await supabase
      .from('projects')
      .select('estado')
      .eq('id', proyectoId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (!proyecto) return { success: false, error: 'Proyecto no encontrado.' };

    const permitidos = TRANSICIONES_PROYECTO[proyecto.estado] ?? [];
    if (!permitidos.includes(nuevoEstado)) {
      return { success: false, error: `Transición no permitida: "${proyecto.estado}" → "${nuevoEstado}".` };
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from('projects')
      .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
      .eq('id', proyectoId)
      .eq('user_id', user.id);

    if (error) throw error;

    revalidatePath(`/proyectos/${proyectoId}`);
    revalidatePath('/proyectos');
    return { success: true };
  } catch (error) {
    console.error('[cambiarEstadoProyecto] error:', error);
    return { success: false, error: 'No se pudo cambiar el estado del proyecto.' };
  }
}

/**
 * Soft Delete de un proyecto
 */
export async function deleteProject(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const { error } = await supabase
      .from('projects')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    revalidatePath('/proyectos');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'No se pudo eliminar el proyecto.' };
  }
}
