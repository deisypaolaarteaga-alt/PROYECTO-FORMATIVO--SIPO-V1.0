import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Bypass total para el portal del cliente: ruta 100% pública, sin sesión ni cookies de auth.
  // Este guard previene que updateSession() corra incluso si el matcher regex
  // falla en el Edge Runtime de Vercel con la ruta /presupuesto-publico/*.
  if (request.nextUrl.pathname.startsWith('/presupuesto-publico')) {
    return NextResponse.next({ request });
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|presupuesto-publico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
