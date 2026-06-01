import { createAdminClient } from '@/lib/supabase/server';

/**
 * Retorna true si el usuario autenticado es super_admin.
 * Usa createAdminClient para leer profiles sin restricciones RLS.
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', userId)
    .maybeSingle();
  return data?.rol === 'super_admin';
}
