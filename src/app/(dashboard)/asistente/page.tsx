import { getConversaciones } from '@/actions/conversaciones';
import { ChatHistory } from '@/components/ia/ChatHistory';
import { ChatInterface } from '@/components/ia/ChatInterface';
import { createClient } from '@/lib/supabase/server';

/**
 * Página principal del Asistente IA
 */
export default async function AsistentePage() {
  const conversations = await getConversaciones();
  
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from('projects')
    .select('id, nombre')
    .order('nombre');

  return (
    <div className="flex h-[calc(100vh-64px-32px)] overflow-hidden rounded-2xl border border-neutral-100 shadow-sm animate-fade-in">
      {/* Panel Izquierdo: Historial (Visible en Desktop) */}
      <aside className="hidden lg:block w-80 shrink-0">
        <ChatHistory initialConversations={conversations} />
      </aside>

      {/* Panel Derecho: Chat */}
      <main className="flex-1 min-w-0">
        <ChatInterface projects={projects || []} />
      </main>
    </div>
  );
}
