'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Send, 
  Sparkles, 
  User, 
  Bot, 
  Loader2, 
  ChevronDown,
  Save,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { CHAT_SUGGESTIONS } from '@/lib/anthropic/prompts';
import { cleanAIResponse } from '@/lib/anthropic/parser';
import { ConvertirAPresupuesto } from './ConvertirAPresupuesto';
import { toast } from 'sonner';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

interface ChatInterfaceProps {
  initialMessages?: Message[];
  conversationId?: string;
  projectId?: string;
  projects?: any[];
}

export function ChatInterface({ 
  initialMessages = [], 
  conversationId: initialConvId,
  projectId: initialProjectId,
  projects = []
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentConvId, setCurrentConvId] = useState(initialConvId);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || '');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  // Auto-scroll al final
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Ajustar altura de textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ia/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          conversationId: currentConvId,
          projectId: selectedProjectId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al conectar con la IA');
      }

      const reader = response.body?.getReader();
      const decoder = new TextEncoder().encode().constructor === TextEncoder ? new TextDecoder() : null;
      
      if (!reader) throw new Error('No se pudo iniciar el stream');

      let assistantMessage: Message = { role: 'assistant', content: '' };
      setMessages(prev => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        
        // Manejar metadata (ID de conversación si es nueva)
        if (chunk.startsWith('__METADATA__:')) {
          const newId = chunk.split(':')[1].trim();
          if (!currentConvId) {
            setCurrentConvId(newId);
            window.history.pushState({}, '', `/asistente/${newId}`);
          }
          continue;
        }

        assistantMessage.content += chunk;
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1] = { ...assistantMessage };
          return newMsgs;
        });
      }

    } catch (err: any) {
      toast.error(err.message);
      // Remover el último mensaje de la IA si falló
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-neutral-900">SIPO Asistente IA</h2>
            <p className="text-[10px] text-neutral-400 flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-success-500 animate-pulse" />
              Claude 3.5 Sonnet activo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ConvertirAPresupuesto 
            messages={messages} 
            projects={projects} 
            selectedProjectId={selectedProjectId} 
          />
          
          <select 
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="text-xs border-neutral-200 rounded-lg py-1.5 pl-2 pr-8 bg-neutral-50 hover:bg-neutral-100 transition-colors focus:ring-primary-500/20 outline-none"
          >
            <option value="">Sin proyecto</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-6 custom-scrollbar"
      >
        {messages.length === 0 ? (
          <WelcomeScreen onSuggestionClick={(text) => handleSend(text)} />
        ) : (
          messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))
        )}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex gap-4 max-w-3xl">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400">
              <Bot className="h-5 w-5" />
            </div>
            <div className="bg-neutral-100 rounded-2xl px-4 py-3 text-neutral-400 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              SIPO está escribiendo...
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-neutral-100">
        <div className="max-w-4xl mx-auto relative">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Describe tu obra o haz una pregunta técnica..."
            className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl pl-4 pr-14 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all resize-none shadow-sm"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className={cn(
              "absolute right-3 bottom-3 p-2 rounded-xl transition-all",
              input.trim() && !isLoading 
                ? "bg-primary-500 text-white shadow-md hover:scale-105 active:scale-95" 
                : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-center text-neutral-400 mt-2">
          Presiona Enter para enviar · Claude 3.5 puede cometer errores, verifica los cálculos importantes.
        </p>
      </div>
    </div>
  );
}

// ──── Sub-componentes ────

function WelcomeScreen({ onSuggestionClick }: { onSuggestionClick: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-2xl mx-auto animate-fade-in">
      <div className="h-16 w-16 bg-primary-50 text-primary-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
        <Sparkles className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-2">
        ¡Hola! Soy tu asistente SIPO
      </h1>
      <p className="text-neutral-500 text-sm mb-10">
        Puedo ayudarte a generar APUs detallados, organizar capítulos de obra 
        y crear presupuestos completos para tus proyectos en Colombia.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
        {CHAT_SUGGESTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => onSuggestionClick(s.prompt)}
            className="flex items-center gap-3 p-4 bg-neutral-50 hover:bg-primary-50 hover:border-primary-200 border border-neutral-100 rounded-2xl text-left transition-all group"
          >
            <div className="h-8 w-8 shrink-0 rounded-lg bg-white border border-neutral-100 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
              <MessageSquare className="h-4 w-4 text-neutral-400 group-hover:text-primary-600" />
            </div>
            <span className="text-xs font-medium text-neutral-700 group-hover:text-primary-700">
              {s.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const cleanContent = cleanAIResponse(message.content);

  return (
    <div className={cn(
      "flex gap-4 animate-slide-up",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      <div className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm",
        isUser ? "bg-primary-500 text-white" : "bg-neutral-100 text-neutral-500"
      )}>
        {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </div>

      <div className={cn(
        "max-w-[85%] rounded-2xl px-5 py-3 shadow-sm",
        isUser 
          ? "bg-primary-500 text-white rounded-tr-none" 
          : "bg-neutral-50 text-neutral-800 border border-neutral-100 rounded-tl-none"
      )}>
        <div className={cn(
          "prose prose-sm max-w-none prose-headings:font-bold prose-p:leading-relaxed",
          isUser ? "prose-invert" : "prose-neutral"
        )}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {cleanContent}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
