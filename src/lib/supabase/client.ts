'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Cliente Supabase para componentes del lado del cliente
 * Usa la clave anónima (segura para el navegador)
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
