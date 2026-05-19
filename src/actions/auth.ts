'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  loginSchema,
  registroSchema,
  recuperarContrasenaSchema,
  nuevaContrasenaSchema,
} from '@/lib/validations/schemas';
import type { ActionResult } from '@/types';

/**
 * Iniciar sesión con email y contraseña
 */
export async function signIn(formData: FormData): Promise<ActionResult> {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    if (error.message.includes('Email not confirmed')) {
      return { success: false, error: 'Debes confirmar tu email primero. Revisa tu bandeja de entrada (incluyendo spam).' };
    }
    if (error.message.includes('Invalid login credentials')) {
      return { success: false, error: 'Email o contraseña incorrectos.' };
    }
    if (error.message.includes('Too many requests')) {
      return { success: false, error: 'Demasiados intentos. Espera unos minutos.' };
    }
    return { success: false, error: 'Error al iniciar sesión. Intenta de nuevo.' };
  }

  redirect('/dashboard');
}

/**
 * Registrar nuevo usuario
 */
export async function signUp(formData: FormData): Promise<ActionResult> {
  const raw = {
    nombre_completo: formData.get('nombre_completo') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    confirmar_password: formData.get('confirmar_password') as string,
    empresa: (formData.get('empresa') as string) || undefined,
    ciudad: (formData.get('ciudad') as string) || undefined,
  };

  const parsed = registroSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      data: { 
        nombre_completo: parsed.data.nombre_completo,
      }
    }
  });

  if (error?.message?.includes('already registered')) {
    return { success: false, error: 'Este email ya tiene una cuenta registrada.' };
  }
  if (error) {
    return { success: false, error: 'Error al crear la cuenta. Intenta de nuevo.' };
  }

  if (data.user && !data.session) {
    return { 
      success: true, 
      data: { needsConfirmation: true },
      message: 'Revisa tu correo para confirmar tu cuenta.' 
    };
  }

  redirect('/onboarding');
}

/**
 * Iniciar sesión con Google OAuth
 */
export async function signInWithGoogle(): Promise<ActionResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    return {
      success: false,
      error: 'Error al conectar con Google. Intenta de nuevo.',
    };
  }

  if (data.url) {
    redirect(data.url);
  }

  return { success: false, error: 'No se pudo obtener la URL de autenticación.' };
}

/**
 * Cerrar sesión
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

/**
 * Enviar correo de recuperación de contraseña
 */
export async function resetPassword(formData: FormData): Promise<ActionResult> {
  const raw = { email: formData.get('email') as string };

  const parsed = recuperarContrasenaSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/nueva-contrasena`,
  });

  if (error) {
    return {
      success: false,
      error: 'Error al enviar el correo. Intenta de nuevo.',
    };
  }

  return { success: true };
}

/**
 * Cambiar contraseña desde el perfil (usuario autenticado)
 */
export async function cambiarContrasena(
  nuevaContrasena: string,
  confirmarContrasena: string
): Promise<ActionResult> {
  if (nuevaContrasena.length < 8)
    return { success: false, error: 'La contraseña debe tener al menos 8 caracteres.' };
  if (nuevaContrasena !== confirmarContrasena)
    return { success: false, error: 'Las contraseñas no coinciden.' };

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { success: false, error: 'Sin sesión activa.' };

  const { error } = await supabase.auth.updateUser({ password: nuevaContrasena });
  if (error) {
    console.error('cambiarContrasena error:', error);
    return { success: false, error: 'Error al cambiar la contraseña. Intenta de nuevo.' };
  }

  return { success: true, message: 'Contraseña actualizada correctamente.' };
}

/**
 * Actualizar contraseña (desde link de recuperación)
 */
export async function updatePassword(formData: FormData): Promise<ActionResult> {
  const raw = {
    password: formData.get('password') as string,
    confirmar_password: formData.get('confirmar_password') as string,
  };

  const parsed = nuevaContrasenaSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return {
      success: false,
      error: 'Error al actualizar la contraseña. El enlace puede haber expirado.',
    };
  }

  redirect('/login');
}
