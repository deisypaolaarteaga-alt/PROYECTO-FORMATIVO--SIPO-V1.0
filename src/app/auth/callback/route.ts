import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/dashboard';

  // DEBUG — eliminar en producción estable
  console.log('[auth/callback] params:', { code: code ? `${code.slice(0, 8)}…` : null, token_hash: !!token_hash, type, next });

  const supabase = await createClient();

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'recovery' | 'email' | 'signup' | 'invite' | 'magiclink' | 'email_change',
    });
    if (!error) {
      const destination = type === 'recovery' ? '/nueva-contrasena' : next;
      return NextResponse.redirect(`${origin}${destination}`);
    }
    console.error('[auth/callback] verifyOtp error:', error.message, error.code);
  }

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Cuando viene por PKCE (code), `type` no está en la URL.
      // `next` sí viene del redirectTo configurado en resetPassword (?next=/nueva-contrasena).
      const destination = next;
      console.log('[auth/callback] OK → user:', data.user?.email, '→', destination);
      return NextResponse.redirect(`${origin}${destination}`);
    }
    // Expone el error en la URL para diagnóstico — quitar cuando el flujo funcione
    const detail = encodeURIComponent(`${error.code ?? 'unknown'}: ${error.message}`);
    console.error('[auth/callback] exchangeCodeForSession error:', error.message, error.code, error.status);
    return NextResponse.redirect(`${origin}/login?error=auth&detail=${detail}`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth&detail=no_code_no_token`);
}
