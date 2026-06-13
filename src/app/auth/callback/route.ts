import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/dashboard';

  console.log('[auth/callback] URL completa:', request.url);
  console.log('[auth/callback] Params:', { code: code ? `${code.slice(0, 12)}…` : null, token_hash: !!token_hash, type, next });

  const supabase = await createClient();

  if (token_hash && type) {
    console.log('[auth/callback] Intentando verifyOtp con token_hash, type:', type);
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'recovery' | 'email' | 'signup' | 'invite' | 'magiclink' | 'email_change',
    });
    if (!error) {
      const destination = type === 'recovery' ? '/nueva-contrasena' : next;
      console.log('[auth/callback] verifyOtp OK → redirigiendo a:', destination);
      return NextResponse.redirect(`${origin}${destination}`);
    }
    console.error('[auth/callback] verifyOtp error:', JSON.stringify({ message: error.message, code: error.code, status: error.status }));
  }

  if (code) {
    console.log('[auth/callback] Intentando exchangeCodeForSession…');
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Cuando viene por PKCE (code), el `type` no está en la URL del callback.
      // Usamos `next` que sí viene del redirectTo configurado en resetPassword.
      const destination = next !== '/dashboard' ? next : '/dashboard';
      console.log('[auth/callback] exchangeCodeForSession OK → user:', data.user?.email, '→ redirigiendo a:', destination);
      return NextResponse.redirect(`${origin}${destination}`);
    }
    console.error('[auth/callback] exchangeCodeForSession error:', JSON.stringify({ message: error.message, code: error.code, status: error.status }));
  }

  console.error('[auth/callback] Todos los métodos fallaron → /login?error=auth');
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
