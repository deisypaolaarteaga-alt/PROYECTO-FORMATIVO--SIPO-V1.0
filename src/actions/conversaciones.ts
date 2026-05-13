'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/types';

/**
 * Crea una nueva conversación
 */
export async function createConversacion(projectId?: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { success: false, error: 'Inicia sesión para continuar.' };

    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({
        user_id: user.id,
        project_id: projectId || null,
        title: 'Nueva conversación'
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/asistente');
    return { success: true, data };
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    return { success: false, error: 'No se pudo crear la conversación.' };
  }
}

/**
 * Agrega un mensaje a una conversación
 */
export async function addMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const { data: conv } = await supabase
      .from('ai_conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();
    if (!conv) return { success: false, error: 'No autorizado' };

    const { data, error } = await supabase
      .from('ai_messages')
      .insert({ conversation_id: conversationId, role, content })
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('ai_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)
      .eq('user_id', user.id);

    return { success: true, data };
  } catch (error: any) {
    console.error('Error adding message:', error);
    return { success: false, error: 'No se pudo guardar el mensaje.' };
  }
}

/**
 * Obtiene todas las conversaciones del usuario
 */
export async function getConversaciones() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return [];

    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*, projects(nombre)')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
}

/**
 * Obtiene una conversación con sus mensajes
 */
export async function getConversacion(id: string) {
  try {
    const supabase = await createClient();
    
    const { data: conv, error: convError } = await supabase
      .from('ai_conversations')
      .select('*, projects(id, nombre)')
      .eq('id', id)
      .single();

    if (convError) throw convError;

    const { data: messages, error: msgError } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (msgError) throw msgError;

    return { ...conv, messages };
  } catch (error) {
    console.error('Error fetching conversation details:', error);
    return null;
  }
}

/**
 * Elimina una conversación (soft delete)
 */
export async function deleteConversacion(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const { error } = await supabase
      .from('ai_conversations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    revalidatePath('/asistente');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'No se pudo eliminar la conversación.' };
  }
}

/**
 * Actualiza el título de una conversación
 */
export async function updateConversacionTitle(id: string, title: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const { error } = await supabase
      .from('ai_conversations')
      .update({ title })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    revalidatePath('/asistente');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'No se pudo actualizar el título.' };
  }
}
