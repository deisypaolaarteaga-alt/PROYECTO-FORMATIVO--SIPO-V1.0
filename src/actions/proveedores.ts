'use server';

import { createClient } from '@/lib/supabase/server';
import { proveedorSchema } from '@/lib/validations/schemas';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { ActionResult, Proveedor } from '@/types';

export async function getProveedores(filtros?: {
  busqueda?: string;
  tipo?: string;
  categoria?: string;
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autorizado');

    let query = supabase
      .from('proveedores')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('nombre_razon_social', { ascending: true });

    if (filtros?.busqueda) {
      query = query.or(
        `nombre_razon_social.ilike.%${filtros.busqueda}%,nit_cedula.ilike.%${filtros.busqueda}%`
      );
    }

    if (filtros?.tipo && filtros.tipo !== 'todos') {
      query = query.eq('tipo', filtros.tipo);
    }

    if (filtros?.categoria && filtros.categoria !== 'todos') {
      query = query.eq('categoria', filtros.categoria);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[getProveedores] error:', error);
    return [];
  }
}

export async function getProveedor(proveedorId: string): Promise<Proveedor | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('proveedores')
      .select('*')
      .eq('id', proveedorId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (error || !data) return null;
    return data as Proveedor;
  } catch (error) {
    console.error('[getProveedor] error:', error);
    return null;
  }
}

export async function crearProveedor(
  data: z.infer<typeof proveedorSchema>
): Promise<ActionResult<Proveedor>> {
  try {
    const validated = proveedorSchema.parse(data);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const { data: nuevo, error } = await supabase
      .from('proveedores')
      .insert([{ ...validated, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/proveedores');
    return { success: true, data: nuevo };
  } catch (error: any) {
    console.error('[crearProveedor] error:', error);
    return { success: false, error: 'No se pudo crear el proveedor.' };
  }
}

export async function actualizarProveedor(
  proveedorId: string,
  data: Partial<z.infer<typeof proveedorSchema>>
): Promise<ActionResult> {
  try {
    const validated = proveedorSchema.partial().parse(data);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const { error } = await supabase
      .from('proveedores')
      .update({ ...validated, updated_at: new Date().toISOString() })
      .eq('id', proveedorId)
      .eq('user_id', user.id);

    if (error) throw error;

    revalidatePath('/proveedores');
    revalidatePath(`/proveedores/${proveedorId}`);
    return { success: true };
  } catch (error: any) {
    console.error('[actualizarProveedor] error:', error);
    return { success: false, error: 'No se pudo actualizar el proveedor.' };
  }
}

export async function eliminarProveedor(proveedorId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const { error } = await supabase
      .from('proveedores')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', proveedorId)
      .eq('user_id', user.id);

    if (error) throw error;

    revalidatePath('/proveedores');
    return { success: true };
  } catch (error: any) {
    console.error('[eliminarProveedor] error:', error);
    return { success: false, error: 'Error al eliminar proveedor' };
  }
}

export async function buscarProveedores(
  query: string
): Promise<Pick<Proveedor, 'id' | 'nombre_razon_social' | 'nit_cedula' | 'ciudad' | 'categoria'>[]> {
  try {
    if (!query || query.length < 2) return [];

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('proveedores')
      .select('id, nombre_razon_social, nit_cedula, ciudad, categoria')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .or(`nombre_razon_social.ilike.%${query}%,nit_cedula.ilike.%${query}%`)
      .limit(10);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[buscarProveedores] error:', error);
    return [];
  }
}
