'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Clock, 
  Trash2, 
  MoreVertical,
  Folder
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { Skeleton } from '@/components/shared/Skeleton';
import { deleteConversacion, getConversaciones } from '@/actions/conversaciones';
import { toast } from 'sonner';

interface ChatHistoryProps {
  initialConversations: any[];
}

export function ChatHistory({ initialConversations }: ChatHistoryProps) {
  const [conversations, setConversations] = useState(initialConversations);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const params = useParams();
  const router = useRouter();
  const activeId = params.id as string;

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('¿Estás seguro de eliminar esta conversación?')) return;

    try {
      const res = await deleteConversacion(id);
      if (res.success) {
        setConversations(conversations.filter(c => c.id !== id));
        toast.success('Conversación eliminada');
        if (activeId === id) router.push('/asistente');
      } else {
        toast.error(res.error);
      }
    } catch (err) {
      toast.error('Error al eliminar');
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-50 border-r border-neutral-200">
      {/* Header */}
      <div className="p-4 space-y-4">
        <Link href="/asistente">
          <Button fullWidth icon={<Plus className="h-4 w-4" />}>
            Nueva conversación
          </Button>
        </Link>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 custom-scrollbar">
        {filteredConversations.length === 0 && !loading ? (
          <div className="text-center py-10 px-4">
            <MessageSquare className="h-10 w-10 text-neutral-200 mx-auto mb-2" />
            <p className="text-xs text-neutral-400">No se encontraron conversaciones</p>
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/asistente/${conv.id}`}
              className={cn(
                "group flex items-center gap-3 p-3 rounded-xl transition-all relative",
                activeId === conv.id 
                  ? "bg-white shadow-sm border border-neutral-100" 
                  : "hover:bg-neutral-100 border border-transparent"
              )}
            >
              <div className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                activeId === conv.id ? "bg-primary-50 text-primary-600" : "bg-neutral-200 text-neutral-500"
              )}>
                <MessageSquare className="h-4 w-4" />
              </div>

              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium truncate",
                  activeId === conv.id ? "text-neutral-900" : "text-neutral-600"
                )}>
                  {conv.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(conv.updated_at)}
                  </span>
                  {conv.projects && (
                    <span className="flex items-center gap-1 truncate">
                      <Folder className="h-3 w-3" />
                      {conv.projects.nombre}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={(e) => handleDelete(e, conv.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-danger-50 hover:text-danger-600 rounded-lg transition-all text-neutral-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
