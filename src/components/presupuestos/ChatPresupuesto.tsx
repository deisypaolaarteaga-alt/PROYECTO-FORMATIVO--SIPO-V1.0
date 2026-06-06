'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, MessageSquare, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { consultarIA, type MensajeChat } from '@/actions/chat-presupuesto';

interface Props {
  budgetId: string;
  onClose: () => void;
}

const BIENVENIDA = 'Hola, puedo ayudarte a entender este presupuesto. Pregúntame sobre flujo de caja, materiales, proveedores o el orden de las actividades.';

export function ChatPresupuesto({ budgetId, onClose }: Props) {
  const [mensajes, setMensajes] = useState<MensajeChat[]>([
    { rol: 'ia', texto: BIENVENIDA },
  ]);
  const [input, setInput] = useState('');
  const [cargando, setCargando] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, cargando]);

  async function handleEnviar() {
    const texto = input.trim();
    if (!texto || cargando) return;

    // Historial previo sin el mensaje de bienvenida (generado localmente)
    const historialPrevio = mensajes.slice(1);
    const conMensajeUsuario: MensajeChat[] = [...mensajes, { rol: 'usuario', texto }];
    setMensajes(conMensajeUsuario);
    setInput('');
    setCargando(true);

    const resultado = await consultarIA(budgetId, texto, historialPrevio);

    setMensajes(prev => [
      ...prev,
      {
        rol: 'ia',
        texto: 'error' in resultado ? `⚠ ${resultado.error}` : resultado.respuesta,
      },
    ]);
    setCargando(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  }

  return (
    <div className="fixed right-0 top-0 h-full w-[380px] bg-white border-l border-[#E8E4DE] shadow-xl z-50 flex flex-col">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#E8E4DE] bg-[#FAF0EB] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-[#C84B1A] flex items-center justify-center shrink-0">
            <MessageSquare className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-[#1C1814]">Consultar con IA</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-[#E8E4DE] text-[#6B7A8D] rounded font-medium uppercase tracking-wide">
            Groq
          </span>
        </div>
        <button
          onClick={onClose}
          className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-[#E8E4DE] transition-colors text-[#6B7A8D] hover:text-[#1C1814]"
          aria-label="Cerrar chat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── Lista de mensajes ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {mensajes.map((msg, i) => (
          <div
            key={i}
            className={cn('flex gap-2.5', msg.rol === 'usuario' ? 'flex-row-reverse' : 'flex-row')}
          >
            <div className={cn(
              'h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5',
              msg.rol === 'usuario'
                ? 'bg-[#1C1814]'
                : 'bg-[#FAF0EB] border border-[#E8E4DE]'
            )}>
              {msg.rol === 'usuario'
                ? <User className="h-3.5 w-3.5 text-white" />
                : <Bot className="h-3.5 w-3.5 text-[#C84B1A]" />}
            </div>

            <div className={cn(
              'max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap',
              msg.rol === 'usuario'
                ? 'bg-[#1C1814] text-white rounded-tr-sm'
                : 'bg-[#F5F2EE] text-[#1C1814] rounded-tl-sm'
            )}>
              {msg.texto}
            </div>
          </div>
        ))}

        {cargando && (
          <div className="flex gap-2.5">
            <div className="h-7 w-7 rounded-full bg-[#FAF0EB] border border-[#E8E4DE] flex items-center justify-center shrink-0">
              <Bot className="h-3.5 w-3.5 text-[#C84B1A]" />
            </div>
            <div className="bg-[#F5F2EE] rounded-2xl rounded-tl-sm px-3.5 py-2.5 flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#C84B1A]" />
              <span className="text-[13px] text-stone">Consultando…</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ──────────────────────────────────────────────────────── */}
      <div className="border-t border-[#E8E4DE] p-3 shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu pregunta…"
            rows={1}
            disabled={cargando}
            className="flex-1 resize-none rounded-xl border border-[#E8E4DE] bg-[#FAF8F5] px-3.5 py-2.5 text-[13px] text-[#1C1814] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#C84B1A] focus:ring-1 focus:ring-[#C84B1A]/20 disabled:opacity-60 max-h-32 overflow-y-auto leading-relaxed"
            style={{ minHeight: '40px' }}
          />
          <button
            onClick={handleEnviar}
            disabled={!input.trim() || cargando}
            className="h-10 w-10 rounded-xl bg-[#C84B1A] text-white flex items-center justify-center hover:bg-[#A83A14] disabled:opacity-40 transition-colors shrink-0"
            aria-label="Enviar"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        <p className="text-[10px] text-[#9CA3AF] mt-2 text-center leading-tight">
          Las respuestas se basan únicamente en los datos de este presupuesto.
        </p>
      </div>
    </div>
  );
}
