'use server';

import { createClient } from '@/lib/supabase/server';

export interface TrabajadorReferencia {
  id: string;
  especialidad: string;
  categoria: string;
  jornal_base: number;
  factor_prestacional: number;
  jornal_con_prestaciones: number;
  activo: boolean;
  user_id: string | null;
}

export async function getTrabajadoresReferencia(): Promise<TrabajadorReferencia[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('trabajadores')
    .select('id, especialidad, categoria, jornal_base, factor_prestacional, jornal_con_prestaciones, activo, user_id')
    .order('categoria', { ascending: true })
    .order('especialidad', { ascending: true });

  if (error || !data) return [];

  const mapped = data.map((t) => ({
    id: t.id,
    especialidad: t.especialidad,
    categoria: t.categoria,
    jornal_base: Number(t.jornal_base),
    factor_prestacional: Number(t.factor_prestacional),
    jornal_con_prestaciones: Number(t.jornal_con_prestaciones),
    activo: t.activo ?? true,
    user_id: t.user_id ?? null,
  }));

  // Por especialidad: mostrar PROPIO si existe, REFERENCIA si no
  const byEspecialidad = new Map<string, TrabajadorReferencia>();
  for (const t of mapped) {
    const key = t.especialidad.toLowerCase();
    const existing = byEspecialidad.get(key);
    if (!existing || t.user_id !== null) {
      byEspecialidad.set(key, t);
    }
  }
  return Array.from(byEspecialidad.values());
}

export interface TrabajadorInput {
  especialidad: string;
  categoria: string;
  jornal_base: number;
  factor_prestacional: number;
  nivel_riesgo: number;
  ciudad_referencia?: string;
}

export async function crearTrabajador(
  data: TrabajadorInput
): Promise<{ success: boolean; data?: TrabajadorReferencia; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autorizado' };

  const { data: nuevo, error } = await supabase
    .from('trabajadores')
    .insert({
      user_id: user.id,
      especialidad: data.especialidad.trim(),
      categoria: data.categoria,
      jornal_base: data.jornal_base,
      factor_prestacional: data.factor_prestacional,
      nivel_riesgo: data.nivel_riesgo,
      ciudad_referencia: data.ciudad_referencia?.trim() || 'Nacional',
      activo: true,
    })
    .select('id, especialidad, categoria, jornal_base, factor_prestacional, jornal_con_prestaciones, activo, user_id')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Ya tienes un trabajador con esa especialidad.' };
    }
    console.error('[crearTrabajador]', error);
    return { success: false, error: 'No se pudo crear el trabajador.' };
  }

  return {
    success: true,
    data: {
      id: nuevo.id,
      especialidad: nuevo.especialidad,
      categoria: nuevo.categoria,
      jornal_base: Number(nuevo.jornal_base),
      factor_prestacional: Number(nuevo.factor_prestacional),
      jornal_con_prestaciones: Number(nuevo.jornal_con_prestaciones),
      activo: nuevo.activo ?? true,
      user_id: nuevo.user_id,
    },
  };
}

export async function actualizarTrabajador(
  id: string,
  data: TrabajadorInput
): Promise<{ success: boolean; data?: TrabajadorReferencia; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autorizado' };

  const { data: actualizado, error } = await supabase
    .from('trabajadores')
    .update({
      especialidad: data.especialidad.trim(),
      categoria: data.categoria,
      jornal_base: data.jornal_base,
      factor_prestacional: data.factor_prestacional,
      nivel_riesgo: data.nivel_riesgo,
      ciudad_referencia: data.ciudad_referencia?.trim() || 'Nacional',
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, especialidad, categoria, jornal_base, factor_prestacional, jornal_con_prestaciones, activo, user_id')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Ya tienes un trabajador con esa especialidad.' };
    }
    console.error('[actualizarTrabajador]', error);
    return { success: false, error: 'No se pudo actualizar el trabajador.' };
  }

  return {
    success: true,
    data: {
      id: actualizado.id,
      especialidad: actualizado.especialidad,
      categoria: actualizado.categoria,
      jornal_base: Number(actualizado.jornal_base),
      factor_prestacional: Number(actualizado.factor_prestacional),
      jornal_con_prestaciones: Number(actualizado.jornal_con_prestaciones),
      activo: actualizado.activo ?? true,
      user_id: actualizado.user_id,
    },
  };
}

export async function copiarTrabajadorReferencia(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autorizado' };

  // Leer trabajador de referencia (solo acepta user_id IS NULL)
  const { data: ref, error: fetchError } = await supabase
    .from('trabajadores')
    .select('especialidad, categoria, jornal_base, factor_prestacional, nivel_riesgo, ciudad_referencia')
    .eq('id', id)
    .is('user_id', null)
    .single();

  if (fetchError || !ref) {
    return { success: false, error: 'Trabajador de referencia no encontrado.' };
  }

  // Verificar que el usuario no tenga ya uno con la misma especialidad
  const { data: existente } = await supabase
    .from('trabajadores')
    .select('id')
    .eq('especialidad', ref.especialidad)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existente) {
    return { success: false, error: 'Ya tienes un trabajador con esa especialidad.' };
  }

  const { error: insertError } = await supabase
    .from('trabajadores')
    .insert({
      user_id: user.id,
      especialidad: ref.especialidad,
      categoria: ref.categoria,
      jornal_base: ref.jornal_base,
      factor_prestacional: ref.factor_prestacional,
      nivel_riesgo: ref.nivel_riesgo ?? 4,
      ciudad_referencia: ref.ciudad_referencia ?? 'Nacional',
      activo: true,
    });

  if (insertError) {
    if (insertError.code === '23505') {
      return { success: false, error: 'Ya tienes un trabajador con esa especialidad.' };
    }
    console.error('[copiarTrabajadorReferencia]', insertError);
    return { success: false, error: 'No se pudo copiar el trabajador.' };
  }

  return { success: true };
}

export async function toggleTrabajadorUsuario(
  id: string,
  activo: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autorizado' };

  const { error } = await supabase
    .from('trabajadores')
    .update({ activo })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { success: false, error: 'No se pudo actualizar el trabajador.' };
  return { success: true };
}

export async function prepararTrabajadorParaEdicion(
  id: string
): Promise<{ success: boolean; data?: TrabajadorReferencia; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autorizado' };

  // Si ya es propio del usuario, retornarlo directamente
  const { data: propio } = await supabase
    .from('trabajadores')
    .select('id, especialidad, categoria, jornal_base, factor_prestacional, jornal_con_prestaciones, activo, user_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (propio) {
    return {
      success: true,
      data: {
        id: propio.id,
        especialidad: propio.especialidad,
        categoria: propio.categoria,
        jornal_base: Number(propio.jornal_base),
        factor_prestacional: Number(propio.factor_prestacional),
        jornal_con_prestaciones: Number(propio.jornal_con_prestaciones),
        activo: propio.activo ?? true,
        user_id: propio.user_id,
      },
    };
  }

  // Es trabajador de referencia — leer sus datos
  const { data: ref, error: fetchError } = await supabase
    .from('trabajadores')
    .select('especialidad, categoria, jornal_base, factor_prestacional, nivel_riesgo, ciudad_referencia')
    .eq('id', id)
    .is('user_id', null)
    .single();

  if (fetchError || !ref) {
    return { success: false, error: 'Trabajador no encontrado.' };
  }

  // Si el usuario ya tiene una copia con la misma especialidad, retornarla
  const { data: existente } = await supabase
    .from('trabajadores')
    .select('id, especialidad, categoria, jornal_base, factor_prestacional, jornal_con_prestaciones, activo, user_id')
    .eq('especialidad', ref.especialidad)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existente) {
    return {
      success: true,
      data: {
        id: existente.id,
        especialidad: existente.especialidad,
        categoria: existente.categoria,
        jornal_base: Number(existente.jornal_base),
        factor_prestacional: Number(existente.factor_prestacional),
        jornal_con_prestaciones: Number(existente.jornal_con_prestaciones),
        activo: existente.activo ?? true,
        user_id: existente.user_id,
      },
    };
  }

  // Crear copia para el usuario
  const { data: nuevo, error: insertError } = await supabase
    .from('trabajadores')
    .insert({
      user_id: user.id,
      especialidad: ref.especialidad,
      categoria: ref.categoria,
      jornal_base: ref.jornal_base,
      factor_prestacional: ref.factor_prestacional,
      nivel_riesgo: ref.nivel_riesgo ?? 4,
      ciudad_referencia: ref.ciudad_referencia ?? 'Nacional',
      activo: true,
    })
    .select('id, especialidad, categoria, jornal_base, factor_prestacional, jornal_con_prestaciones, activo, user_id')
    .single();

  if (insertError) {
    return { success: false, error: 'No se pudo preparar el trabajador para edición.' };
  }

  return {
    success: true,
    data: {
      id: nuevo.id,
      especialidad: nuevo.especialidad,
      categoria: nuevo.categoria,
      jornal_base: Number(nuevo.jornal_base),
      factor_prestacional: Number(nuevo.factor_prestacional),
      jornal_con_prestaciones: Number(nuevo.jornal_con_prestaciones),
      activo: nuevo.activo ?? true,
      user_id: nuevo.user_id,
    },
  };
}

export async function eliminarTrabajador(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autorizado' };

  const { error } = await supabase
    .from('trabajadores')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { success: false, error: 'No se pudo eliminar el trabajador.' };
  return { success: true };
}
