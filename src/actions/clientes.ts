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

      return {
        ...cliente,
        total_proyectos: totalProyectos,
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
    return { success: false, error: error.message || 'Error al crear cliente' };
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const { error } = await supabase
      .from('clientes')
      .update({
        ...data,
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
    return { success: false, error: error.message || 'Error al actualizar cliente' };
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
 * Buscar clientes para selectores
 */
export async function buscarClientes(query: string): Promise<Pick<Cliente, 'id' | 'nombre_razon_social' | 'nit_cedula' | 'ciudad'>[]> {
  try {
    if (!query || query.length < 2) return [];
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('clientes')
      .select('id, nombre_razon_social, nit_cedula, ciudad')
      .eq('user_id', user.id)
      .eq('activo', true)
      .or(`nombre_razon_social.ilike.%${query}%,nit_cedula.ilike.%${query}%`)
      .limit(10);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[buscarClientes] error:', error);
    return [];
  }
}
