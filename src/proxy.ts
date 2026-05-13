import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Proxy de SIPO — reemplaza middleware en Next.js 16+
 * Gestiona sesiones de Supabase y protege rutas autenticadas
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Excluir rutas internas de Next.js y archivos estáticos
     */
    '/((?!api|_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
