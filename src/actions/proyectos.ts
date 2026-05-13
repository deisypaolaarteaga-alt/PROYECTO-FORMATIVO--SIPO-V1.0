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

    // Validación Zod
    const raw = Object.fromEntries(formData.entries());
    const validated = proyectoSchema.parse(raw);

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
    if (error.name === 'ZodError') return { success: false, error: error.errors[0].message };
    return { success: false, error: 'No se pudo crear el proyecto.' };
  }
}

/**
 * Obtiene todos los proyectos activos del usuario
 */
export async function getProjects() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('projects')
    .select('*, budgets(count)')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  return data || [];
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
    const validated = proyectoSchema.parse(raw);

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
    if (error.name === 'ZodError') return { success: false, error: error.errors[0]?.message ?? 'Datos inválidos.' };
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
