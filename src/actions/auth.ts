'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import {
  loginSchema,
  registroSchema,
  recuperarContrasenaSchema,
  nuevaContrasenaSchema,
} from '@/lib/validations/schemas';
import type { ActionResult } from '@/types';

export async function signIn(formData: FormData): Promise<ActionResult<{ email: string }>> {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  // Paso 1: verificar credenciales
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (signInError) {
    if (signInError.message.includes('Email not confirmed')) {
      return { success: false, error: 'Debes confirmar tu email primero. Revisa tu bandeja de entrada (incluyendo spam).' };
    }
    if (signInError.message.includes('Invalid login credentials')) {
      return { success: false, error: 'Email o contraseña incorrectos.' };
    }
    if (signInError.message.includes('Too many requests')) {
      return { success: false, error: 'Demasiados intentos. Espera unos minutos.' };
    }
    return { success: false, error: 'Error al iniciar sesión. Intenta de nuevo.' };
  }

  // Paso 2: destruir la sesión temporal antes de enviar el OTP
  await supabase.auth.signOut();

  // Paso 3: enviar OTP al correo
  const { error: otpError } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { shouldCreateUser: false },
  });

  if (otpError) {
    console.error('[signIn] signInWithOtp error:', otpError);
    return { success: false, error: 'No se pudo enviar el código OTP. Intenta de nuevo.' };
  }

  return { success: true, data: { email: parsed.data.email } };
}

/**
 * Reenviar OTP al correo (desde la pantalla de verificación).
 */
export async function sendOtp(email: string): Promise<ActionResult> {
  if (!email) return { success: false, error: 'Email requerido.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });

  if (error) {
    if (error.message.includes('Too many requests')) {
      return { success: false, error: 'Demasiados intentos. Espera unos minutos antes de reenviar.' };
    }
    return { success: false, error: 'No se pudo reenviar el código. Intenta de nuevo.' };
  }

  return { success: true };
}

/**
 * Paso 2 del login con 2FA:
 * Verifica el OTP de 6 dígitos. Si es correcto establece la sesión y redirige al dashboard.
 */
export async function verifyOtp(email: string, token: string): Promise<ActionResult> {
  if (!email || !token || token.length !== 6) {
    return { success: false, error: 'Código inválido.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });

  if (error) {
    if (error.message.includes('Token has expired') || error.message.includes('invalid')) {
      return { success: false, error: 'Código incorrecto o expirado. Solicita uno nuevo.' };
    }
    return { success: false, error: 'No se pudo verificar el código. Intenta de nuevo.' };
  }

  redirect('/dashboard');
}

/**
 * Registrar nuevo usuario.
 * Retorna { success: true, data: { email } } para que el cliente muestre
 * la pantalla de confirmación — NO redirige al dashboard.
 */
export async function signUp(formData: FormData): Promise<ActionResult<{ email: string }>> {
  try {
    const raw = {
      nombre_completo: formData.get('nombre_completo') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmar_password: formData.get('confirmar_password') as string,
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

    console.log('SIGNUP RESULT:', JSON.stringify({
      userId: data?.user?.id,
      email: data?.user?.email,
      errorMsg: error?.message,
      errorCode: error?.code,
      errorStatus: error?.status,
    }));

    if (error) {
      if (error.code === 'user_already_exists' ||
          error.message.toLowerCase().includes('already registered')) {
        return { success: false, error: 'Ya existe una cuenta con este correo electrónico.' };
      }
      return { success: false, error: 'Error al crear la cuenta. Intenta de nuevo.' };
    }

    // Fallback: Supabase devuelve identities[] vacío cuando el email ya existe sin error explícito
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      return { success: false, error: 'Ya existe una cuenta con este correo electrónico.' };
    }

    return { success: true, data: { email: parsed.data.email } };

  } catch (e) {
    if (isRedirectError(e)) throw e;
    console.error('[signUp] error:', e);
    return { success: false, error: 'Error al crear la cuenta. Intenta de nuevo.' };
  }
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
 * Enviar correo de recuperación de contraseña.
 * El enlace del correo va a /auth/callback?next=/nueva-contrasena para que
 * el callback intercambie el código por sesión y luego lleve al formulario.
 */
export async function resetPassword(formData: FormData): Promise<ActionResult> {
  const raw = { email: formData.get('email') as string };

  const parsed = recuperarContrasenaSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/nueva-contrasena`,
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
 * Actualizar contraseña (desde link de recuperación — usuario ya tiene sesión via callback)
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
