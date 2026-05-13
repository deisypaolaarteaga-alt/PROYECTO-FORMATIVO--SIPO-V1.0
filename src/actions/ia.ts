'use server';

import { createClient } from '@/lib/supabase/server';
import { encrypt } from '@/lib/security/encryption';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/types';

export async function saveUserAnthropicKey(key: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const encrypted = encrypt(key);

    const { error } = await supabase
      .from('profiles')
      .update({ anthropic_key_enc: encrypted })
      .eq('id', user.id);

    if (error) throw error;
    
    revalidatePath('/configuracion/ia');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'No se pudo guardar la API Key.' };
  }
}

export async function toggleIAGlobal(enabled: boolean): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const { error } = await supabase
      .from('profiles')
      .update({ ia_global_enabled: enabled })
      .eq('id', user.id);

    if (error) throw error;
    
    revalidatePath('/configuracion/ia');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'No se pudo actualizar la preferencia.' };
  }
}
