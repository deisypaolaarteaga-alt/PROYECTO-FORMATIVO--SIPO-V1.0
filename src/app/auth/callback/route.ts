import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Callback de OAuth (Google)
 * Supabase redirige aquí después del login con OAuth
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // En caso de error, redirigir al login
  return NextResponse.redirect(`${origin}/login?error=auth_error`);
}
