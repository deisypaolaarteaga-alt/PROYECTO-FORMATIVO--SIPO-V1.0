'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { proveedorSchema } from '@/lib/validations/schemas';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { ActionResult, Proveedor, TipoAPUItem } from '@/types';

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

// Asigna (o quita) un proveedor a todos los apu_items con ese nombre/unidad/tipo
// dentro de un presupuesto dado. Un mass-update es correcto aquí porque la vista de
// explosión agrega ítems idénticos de distintos APUs — conceptualmente es el mismo insumo.
export async function asignarProveedorAInsumos(
  budgetId: string,
  nombre: string,
  unidad: string,
  tipo: TipoAPUItem,
  proveedorId: string | null
): Promise<ActionResult> {
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

    // Obtener los IDs de actividades del presupuesto
    const { data: activities, error: actError } = await supabase
      .from('activities')
      .select('id')
      .eq('budget_id', budgetId)
      .eq('user_id', user.id)
      .is('deleted_at', null);

    if (actError) throw actError;
    if (!activities || activities.length === 0) return { success: true };

    const activityIds = activities.map(a => a.id);

    // Obtener los IDs de APUs de esas actividades
    const { data: apus, error: apuError } = await supabase
      .from('apus')
      .select('id')
      .eq('budget_id', budgetId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .in('activity_id', activityIds);

    if (apuError) throw apuError;
    if (!apus || apus.length === 0) return { success: true };

    const apuIds = apus.map(a => a.id);

    // UPDATE con admin client para superar RLS en la escritura cruzada
    const adminClient = createAdminClient();
    const { error: updateError } = await adminClient
      .from('apu_items')
      .update({ proveedor_id: proveedorId, updated_at: new Date().toISOString() })
      .in('apu_id', apuIds)
      .eq('nombre', nombre)
      .eq('unidad', unidad)
      .eq('tipo', tipo);

    if (updateError) throw updateError;

    revalidatePath(`/presupuestos/${budgetId}`);
    return { success: true };
  } catch (error) {
    console.error('[asignarProveedorAInsumos] error:', error);
    return { success: false, error: 'No se pudo asignar el proveedor al insumo.' };
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
