'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { UserPreferences } from '@/types';
import type { ActionResult } from '@/types';

export async function guardarApariencia(
  prefs: Partial<UserPreferences>
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { success: false, error: 'Sin sesión activa.' };

  const { data: current } = await supabase
    .from('profiles')
    .select('preferences')
    .eq('id', user.id)
    .single();

  const merged = { ...(current?.preferences ?? {}), ...prefs };

  const { error } = await supabase
    .from('profiles')
    .update({ preferences: merged })
    .eq('id', user.id);

  if (error) {
    console.error('guardarApariencia error:', error);
    return { success: false, error: 'Error al guardar preferencias.' };
  }

  revalidatePath('/perfil');
  return { success: true };
}
