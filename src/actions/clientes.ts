'use server';

import { createClient } from '@/lib/supabase/server';
import { clienteSchema } from '@/lib/validations/schemas';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { ActionResult, Cliente } from '@/types';

/**
 * Listar clientes del usuario con estadísticas de proyectos
 */
export async function getClientes(filtros?: { 
  busqueda?: string; 
  tipo?: string; 
  ciudad?: string 
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autorizado');

    let query = supabase
      .from('clientes')
      .select(`
        *,
        projects (
          id,
          budgets (
            costo_directo
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('activo', true)
      .order('nombre_razon_social', { ascending: true });

    if (filtros?.busqueda) {
      query = query.or(`nombre_razon_social.ilike.%${filtros.busqueda}%,nit_cedula.ilike.%${filtros.busqueda}%`);
    }

    if (filtros?.tipo && filtros.tipo !== 'todos') {
      query = query.eq('tipo', filtros.tipo);
    }

    if (filtros?.ciudad) {
      query = query.eq('ciudad', filtros.ciudad);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Procesar datos para incluir conteos y sumas
    const clientesProcesados = (data || []).map(cliente => {
      const proyectos = cliente.projects || [];
      const totalProyectos = proyectos.length;
      let valorTotalProyectos = 0;

      proyectos.forEach((p: any) => {
        (p.budgets || []).forEach((b: any) => {
          valorTotalProyectos += Number(b.costo_directo || 0);
        });
      });

      const totalPresupuestos = proyectos.reduce(
        (acc: number, p: any) => acc + (p.budgets?.length ?? 0),
        0,
      );

      return {
        ...cliente,
        total_proyectos: totalProyectos,
        total_presupuestos: totalPresupuestos,
        valor_total_proyectos: valorTotalProyectos
      };
    });

    return clientesProcesados;
  } catch (error) {
    console.error('[getClientes] error:', error);
    return [];
  }
}

/**
 * Obtener un cliente específico con sus proyectos
 */
export async function getCliente(clienteId: string): Promise<Cliente | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('clientes')
      .select(`
        *,
        projects (
          *,
          budgets (
            id,
            titulo,
            costo_directo,
            estado
          )
        )
      `)
      .eq('id', clienteId)
      .eq('user_id', user.id)
      .single();

    if (error || !data) return null;
    return data as unknown as Cliente;
  } catch (error) {
    console.error('[getCliente] error:', error);
    return null;
  }
}

/**
 * Crear un nuevo cliente
 */
export async function crearCliente(data: z.infer<typeof clienteSchema>): Promise<ActionResult<Cliente>> {
  try {
    const validated = clienteSchema.parse(data);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    if (validated.nit_cedula) {
      const { data: existing } = await supabase
        .from('clientes')
        .select('id')
        .eq('user_id', user.id)
        .eq('nit_cedula', validated.nit_cedula)
        .eq('activo', true)
        .maybeSingle();
      if (existing) {
        return { success: false, error: `Ya existe un cliente activo con el NIT/Cédula "${validated.nit_cedula}".` };
      }
    }

    const { data: newCliente, error } = await supabase
      .from('clientes')
      .insert([{
        ...validated,
        user_id: user.id
      }])
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/clientes');
    return { success: true, data: newCliente };
  } catch (error: any) {
    console.error('[crearCliente] error:', error);
    if (error.name === 'ZodError') return { success: false, error: error.issues?.[0]?.message ?? 'Completa todos los campos obligatorios' };
    return { success: false, error: 'No se pudo crear el cliente.' };
  }
}

/**
 * Actualizar datos de un cliente
 */
export async function actualizarCliente(
  clienteId: string,
  data: Partial<z.infer<typeof clienteSchema>>
): Promise<ActionResult> {
  try {
    const validated = clienteSchema.partial().parse(data);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const { error } = await supabase
      .from('clientes')
      .update({
        ...validated,
        updated_at: new Date().toISOString()
      })
      .eq('id', clienteId)
      .eq('user_id', user.id);

    if (error) throw error;

    revalidatePath('/clientes');
    revalidatePath(`/clientes/${clienteId}`);
    return { success: true };
  } catch (error: any) {
    console.error('[actualizarCliente] error:', error);
    if (error.name === 'ZodError') return { success: false, error: error.issues?.[0]?.message ?? 'Completa todos los campos obligatorios' };
    return { success: false, error: 'No se pudo actualizar el cliente.' };
  }
}

/**
 * Desactivar cliente (soft delete)
 */
export async function desactivarCliente(clienteId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const { error } = await supabase
      .from('clientes')
      .update({ activo: false })
      .eq('id', clienteId)
      .eq('user_id', user.id);

    if (error) throw error;

    revalidatePath('/clientes');
    return { success: true };
  } catch (error: any) {
    console.error('[desactivarCliente] error:', error);
    return { success: false, error: 'Error al desactivar cliente' };
  }
}

/**
 * Reactivar cliente previamente desactivado
 */
export async function reactivarCliente(clienteId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const { error } = await supabase
      .from('clientes')
      .update({ activo: true, updated_at: new Date().toISOString() })
      .eq('id', clienteId)
      .eq('user_id', user.id);

    if (error) throw error;

    revalidatePath('/clientes');
    revalidatePath(`/clientes/${clienteId}`);
    return { success: true };
  } catch (error: any) {
    console.error('[reactivarCliente] error:', error);
    return { success: false, error: 'Error al reactivar cliente' };
  }
}

/**
 * Buscar clientes para selectores.
 * Si query está vacío retorna los primeros 10 activos ordenados por nombre.
 */
export async function buscarClientes(query: string): Promise<Pick<Cliente, 'id' | 'nombre_razon_social' | 'nit_cedula' | 'ciudad'>[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const trimmed = query.trim();

    const base = supabase
      .from('clientes')
      .select('id, nombre_razon_social, nit_cedula, ciudad')
      .eq('user_id', user.id)
      .eq('activo', true)
      .order('nombre_razon_social', { ascending: true })
      .limit(10);

    const { data, error } = trimmed.length > 0
      ? await base.or(`nombre_razon_social.ilike.%${trimmed}%,nit_cedula.ilike.%${trimmed}%`)
      : await base;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[buscarClientes] error:', error);
    return [];
  }
}
