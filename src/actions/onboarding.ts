'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  onboardingEmpresaSchema,
  onboardingProyectoSchema,
} from '@/lib/validations/auth';
import type { ActionResult } from '@/types';

/**
 * Guardar datos de empresa en el perfil del usuario
 */
export async function saveEmpresa(formData: FormData): Promise<ActionResult> {
  const raw = {
    empresa: formData.get('empresa') as string,
    ciudad: formData.get('ciudad') as string,
    nit: (formData.get('nit') as string) || undefined,
    telefono: (formData.get('telefono') as string) || undefined,
  };

  const parsed = onboardingEmpresaSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No hay sesión activa.' };

  const { error } = await supabase
    .from('profiles')
    .update({
      empresa: parsed.data.empresa,
      ciudad: parsed.data.ciudad,
      nit: parsed.data.nit || null,
      telefono: parsed.data.telefono || null,
    })
    .eq('id', user.id);

  if (error) {
    return { success: false, error: 'Error al guardar datos de empresa.' };
  }

  return { success: true };
}

/**
 * Subir logo de empresa a Supabase Storage
 */
export async function uploadLogo(formData: FormData): Promise<ActionResult> {
  const file = formData.get('logo') as File;
  if (!file || file.size === 0) {
    return { success: false, error: 'No se seleccionó un archivo.' };
  }

  // Validar tamaño (2MB máx)
  if (file.size > 2 * 1024 * 1024) {
    return { success: false, error: 'El archivo no puede superar 2MB.' };
  }

  // Validar formato
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return { success: false, error: 'Solo se permiten archivos JPG, PNG o WebP.' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No hay sesión activa.' };

  const ext = file.name.split('.').pop();
  const filePath = `${user.id}/logotipo.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('logos')
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    return { success: false, error: 'Error al subir el logotipo.' };
  }

  // Obtener URL pública
  const { data: urlData } = supabase.storage
    .from('logos')
    .getPublicUrl(filePath);

  // Actualizar perfil con la URL
  await supabase
    .from('profiles')
    .update({ logo_url: urlData.publicUrl })
    .eq('id', user.id);

  return { success: true, data: { url: urlData.publicUrl } };
}

/**
 * Crear el primer proyecto del usuario
 */
export async function createFirstProject(formData: FormData): Promise<ActionResult> {
  const raw = {
    nombre: formData.get('nombre') as string,
    cliente_nombre: (formData.get('cliente_nombre') as string) || undefined,
    ubicacion: formData.get('ubicacion') as string,
    descripcion: (formData.get('descripcion') as string) || undefined,
  };

  const parsed = onboardingProyectoSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No hay sesión activa.' };

  const { error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      nombre: parsed.data.nombre,
      cliente_nombre: parsed.data.cliente_nombre || null,
      ubicacion: parsed.data.ubicacion,
      descripcion: parsed.data.descripcion || null,
      estado: 'activo',
    });

  if (error) {
    return { success: false, error: 'Error al crear el proyecto.' };
  }

  redirect('/dashboard');
}
