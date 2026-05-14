import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import '@/lib/env';

/**
 * Cliente admin con service_role — omite RLS.
 * Usar SOLO para lecturas de tablas públicas (catálogo) o seeds.
 * Nunca exponer al cliente.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Cliente Supabase para Server Components y Server Actions
 * Maneja cookies automáticamente
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll es llamado desde Server Component donde no se pueden modificar cookies
            // Esto es seguro: el middleware manejará el refresh
          }
        },
      },
    }
  );
}
