import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Route Handler server-side para recuperar contraseña.
 * Supabase redirige aquí con ?code= después de verificar el token del email.
 * El intercambio debe hacerse server-side porque el PKCE verifier
 * lo generó el servidor (en resetPasswordForEmail) y vive en cookies,
 * no en localStorage del browser.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const errorCode = searchParams.get('error_code');
  const error = searchParams.get('error');

  // Supabase redirige aquí con ?error= cuando el token es inválido o expiró
  if (error || errorCode) {
    return NextResponse.redirect(`${origin}/recuperar-contrasena?error=link_expirado`);
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      return NextResponse.redirect(`${origin}/nueva-contrasena`);
    }
    console.error('[recuperar] exchangeCodeForSession error:', exchangeError.message, exchangeError.code);
  }

  return NextResponse.redirect(`${origin}/recuperar-contrasena?error=link_expirado`);
}
