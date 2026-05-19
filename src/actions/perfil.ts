'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface PerfilEmpresaData {
  empresa:          string;
  nit:              string;
  ciudad:           string;
  direccion:        string;
  telefono:         string;
  email_empresa:    string;
  regimen_tributario: string;
  nombre_completo?: string;
  cargo_firma?:     string;
}

export async function guardarPerfilEmpresa(data: PerfilEmpresaData) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { success: false, error: 'Sin sesión activa.' };

  const { error } = await supabase
    .from('profiles')
    .update({
      empresa:            data.empresa || null,
      nit:                data.nit || null,
      ciudad:             data.ciudad || null,
      direccion:          data.direccion || null,
      telefono:           data.telefono || null,
      email_empresa:      data.email_empresa || null,
      regimen_tributario: data.regimen_tributario || 'no_responsable',
      nombre_completo:    data.nombre_completo || null,
      cargo_firma:        data.cargo_firma || null,
    })
    .eq('id', user.id);

  if (error) {
    console.error('guardarPerfilEmpresa error:', error);
    return { success: false, error: 'Error al guardar. Intenta de nuevo.' };
  }

  revalidatePath('/perfil');
  return { success: true };
}

export async function subirLogoPerfil(formData: FormData) {
  const file = formData.get('logo') as File;
  if (!file || file.size === 0) return { success: false, error: 'No se seleccionó archivo.' };

  if (file.size > 2 * 1024 * 1024) return { success: false, error: 'El logo no puede superar 2MB.' };

  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) return { success: false, error: 'Solo JPG, PNG o WebP.' };

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { success: false, error: 'Sin sesión activa.' };

  const ext      = file.name.split('.').pop() || 'png';
  const filePath = `${user.id}/logotipo.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from('logos')
    .upload(filePath, file, { upsert: true });

  if (uploadErr) {
    console.error('subirLogoPerfil upload error:', uploadErr);
    return { success: false, error: 'Error al subir el logo. Verifica que el bucket "logos" exista en Supabase Storage.' };
  }

  const { data: urlData } = supabase.storage.from('logos').getPublicUrl(filePath);

  // Agregar cache-busting para que el navegador no use la versión anterior
  const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ logo_url: urlData.publicUrl })
    .eq('id', user.id);

  if (updateErr) {
    console.error('subirLogoPerfil profile update error:', updateErr);
    return { success: false, error: 'Logo subido pero no se pudo guardar la URL.' };
  }

  revalidatePath('/perfil');
  return { success: true, data: { url: publicUrl } };
}

export async function eliminarLogoPerfil() {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { success: false, error: 'Sin sesión activa.' };

  // Intentar eliminar ambas extensiones comunes
  await Promise.allSettled([
    supabase.storage.from('logos').remove([`${user.id}/logotipo.png`]),
    supabase.storage.from('logos').remove([`${user.id}/logotipo.jpg`]),
    supabase.storage.from('logos').remove([`${user.id}/logotipo.webp`]),
  ]);

  const { error } = await supabase
    .from('profiles')
    .update({ logo_url: null })
    .eq('id', user.id);

  if (error) return { success: false, error: 'Error al eliminar el logo.' };

  revalidatePath('/perfil');
  return { success: true };
}

export async function subirFirmaPerfil(formData: FormData) {
  const file = formData.get('firma') as File;
  if (!file || file.size === 0) return { success: false, error: 'No se seleccionó archivo.' };

  if (file.size > 2 * 1024 * 1024) return { success: false, error: 'La firma no puede superar 2MB.' };

  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) return { success: false, error: 'Solo JPG, PNG o WebP.' };

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { success: false, error: 'Sin sesión activa.' };

  const ext      = file.name.split('.').pop() || 'png';
  const filePath = `${user.id}/firma.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from('firmas')
    .upload(filePath, file, { upsert: true });

  if (uploadErr) {
    console.error('subirFirmaPerfil upload error:', uploadErr);
    return { success: false, error: 'Error al subir la firma. Verifica que el bucket "firmas" exista en Supabase Storage.' };
  }

  const { data: urlData } = supabase.storage.from('firmas').getPublicUrl(filePath);
  const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ firma_url: urlData.publicUrl })
    .eq('id', user.id);

  if (updateErr) {
    console.error('subirFirmaPerfil profile update error:', updateErr);
    return { success: false, error: 'Firma subida pero no se pudo guardar la URL.' };
  }

  revalidatePath('/perfil');
  return { success: true, data: { url: publicUrl } };
}

export async function eliminarFirmaPerfil() {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { success: false, error: 'Sin sesión activa.' };

  await Promise.allSettled([
    supabase.storage.from('firmas').remove([`${user.id}/firma.png`]),
    supabase.storage.from('firmas').remove([`${user.id}/firma.jpg`]),
    supabase.storage.from('firmas').remove([`${user.id}/firma.webp`]),
  ]);

  const { error } = await supabase
    .from('profiles')
    .update({ firma_url: null })
    .eq('id', user.id);

  if (error) return { success: false, error: 'Error al eliminar la firma.' };

  revalidatePath('/perfil');
  return { success: true };
}
