'use client';

import { useState } from 'react';
import { Send, X, Mail, User, AlertCircle, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { enviarPresupuestoAlCliente } from '@/actions/portal-cliente';
import { generarCartaPresentacion } from '@/actions/carta-presentacion';
import { showToast } from '@/components/shared/Toast';

interface ModalEnviarClienteProps {
  isOpen: boolean;
  onClose: () => void;
  budgetId: string;
  clienteNombre: string | null;
  clienteEmail: string;
  onEnviado?: () => void;
}

export function ModalEnviarCliente({
  isOpen,
  onClose,
  budgetId,
  clienteNombre,
  clienteEmail,
  onEnviado,
}: ModalEnviarClienteProps) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  // Estado de la carta IA
  const [generandoCarta, setGenerandoCarta] = useState(false);
  const [cartaError, setCartaError] = useState('');
  const [cuerpoCorreo, setCuerpoCorreo] = useState('');
  const [cartaEjecutiva, setCartaEjecutiva] = useState('');

  const cartaGenerada = cuerpoCorreo !== '' || cartaEjecutiva !== '';

  async function handleGenerarCarta() {
    setCartaError('');
    setGenerandoCarta(true);
    const result = await generarCartaPresentacion(budgetId);
    setGenerandoCarta(false);
    if (result.success && result.data) {
      setCuerpoCorreo(result.data.cuerpoCorreo);
      setCartaEjecutiva(result.data.cartaEjecutiva);
    } else {
      setCartaError(result.error ?? 'No se pudo generar la carta.');
    }
  }

  async function handleEnviar() {
    setError('');
    setEnviando(true);
    const result = await enviarPresupuestoAlCliente(
      budgetId,
      cartaGenerada
        ? { cuerpoCorreo: cuerpoCorreo || undefined, cartaEjecutiva: cartaEjecutiva || undefined }
        : undefined
    );
    setEnviando(false);
    if (result.success) {
      showToast.success(`Presupuesto enviado a ${clienteEmail}`);
      onEnviado?.();
      onClose();
    } else {
      setError(result.error ?? 'No se pudo enviar el presupuesto.');
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E8E4DE] animate-in fade-in-0 zoom-in-95 duration-200 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E8E4DE] shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#FAF0EB] flex items-center justify-center">
              <Send className="h-4 w-4 text-[#C84B1A]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#1C1814]">Enviar presupuesto al cliente</h2>
              <p className="text-xs text-stone mt-0.5">Se enviará un enlace seguro por correo electrónico</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-lg bg-[#F5F2EE] text-stone hover:bg-[#EDE6DC] hover:text-[#1C1814] transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="px-6 py-5 space-y-5 flex-1 overflow-y-auto">

          {/* Destinatario */}
          <div className="bg-[#F9F8F6] rounded-xl border border-[#E8E4DE] p-4 space-y-3">
            <p className="text-[10px] font-bold text-stone uppercase tracking-widest">Destinatario</p>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-[#EDE6DC] flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-[#6B7A8D]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#1C1814] truncate">
                  {clienteNombre || 'Cliente'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Mail className="h-3 w-3 text-stone shrink-0" />
                  <p className="text-xs text-stone truncate">{clienteEmail}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-[#EBF5FF] rounded-xl border border-[#BFDBFE] p-4">
            <p className="text-xs text-[#1E40AF] leading-relaxed">
              El cliente recibirá un enlace único para ver el presupuesto, aprobarlo o dejar
              observaciones. El enlace tendrá la misma vigencia configurada en el presupuesto.
            </p>
          </div>

          {/* ── Sección carta con IA ── */}
          <div className="border border-[#E8E4DE] rounded-xl overflow-hidden">
            {/* Encabezado de la sección */}
            <div className="px-4 py-3 bg-[#F9F8F6] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#C84B1A]" />
                <span className="text-sm font-semibold text-[#1C1814]">Carta de presentación con IA</span>
                <span className="text-[10px] text-stone font-normal">(opcional)</span>
              </div>

              {/* Botón principal — solo si no hay carta generada y no está cargando */}
              {!cartaGenerada && !generandoCarta && !cartaError && (
                <button
                  onClick={handleGenerarCarta}
                  disabled={enviando}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#C84B1A] bg-[#FAF0EB] hover:bg-[#C84B1A] hover:text-white border border-[#C84B1A]/30 hover:border-[#C84B1A] rounded-lg transition-all duration-150 disabled:opacity-50"
                >
                  <Sparkles className="h-3 w-3" />
                  Generar
                </button>
              )}

              {/* Botón regenerar — cuando ya hay carta */}
              {cartaGenerada && !generandoCarta && (
                <button
                  onClick={handleGenerarCarta}
                  disabled={enviando}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone hover:text-[#1C1814] rounded-lg hover:bg-[#EDE6DC] transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="h-3 w-3" />
                  Regenerar
                </button>
              )}
            </div>

            {/* Spinner de carga */}
            {generandoCarta && (
              <div className="px-4 py-5 flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-[#C84B1A] shrink-0" />
                <span className="text-sm text-stone">Redactando propuesta…</span>
              </div>
            )}

            {/* Error de generación */}
            {cartaError && !generandoCarta && (
              <div className="px-4 py-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{cartaError}</p>
                </div>
                <button
                  onClick={handleGenerarCarta}
                  disabled={enviando}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#C84B1A] hover:text-[#A83A14] transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="h-3 w-3" />
                  Reintentar
                </button>
              </div>
            )}

            {/* Textareas editables — cuando se generó la carta */}
            {cartaGenerada && !generandoCarta && (
              <div className="px-4 py-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone uppercase tracking-widest block">
                    Cuerpo del correo
                  </label>
                  <textarea
                    value={cuerpoCorreo}
                    onChange={e => setCuerpoCorreo(e.target.value)}
                    rows={4}
                    disabled={enviando}
                    className="w-full bg-[#F9F8F6] border border-[#E8E4DE] rounded-lg px-3 py-2.5 text-sm text-[#1C1814] focus:outline-none focus:ring-2 focus:ring-[#C84B1A]/20 focus:border-[#C84B1A] resize-none transition-colors disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone uppercase tracking-widest block">
                    Carta ejecutiva
                    <span className="text-stone font-normal normal-case ml-1">(visible en el portal del cliente)</span>
                  </label>
                  <textarea
                    value={cartaEjecutiva}
                    onChange={e => setCartaEjecutiva(e.target.value)}
                    rows={10}
                    disabled={enviando}
                    className="w-full bg-[#F9F8F6] border border-[#E8E4DE] rounded-lg px-3 py-2.5 text-sm text-[#1C1814] focus:outline-none focus:ring-2 focus:ring-[#C84B1A]/20 focus:border-[#C84B1A] resize-none transition-colors disabled:opacity-50"
                  />
                </div>
              </div>
            )}

            {/* Descripción cuando no hay carta todavía */}
            {!cartaGenerada && !generandoCarta && !cartaError && (
              <p className="px-4 py-3 text-xs text-stone leading-relaxed">
                La IA redactará un cuerpo de correo personalizado y una carta ejecutiva para el portal
                del cliente, usando los datos del presupuesto. Podrás editarla antes de enviar.
              </p>
            )}
          </div>

          {/* Error de envío */}
          {error && (
            <div className="bg-red-50 rounded-xl border border-red-200 px-4 py-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#F9F8F6] border-t border-[#E8E4DE] rounded-b-2xl shrink-0">
          <button
            onClick={onClose}
            disabled={enviando}
            className="px-4 py-2 text-sm font-medium text-stone hover:text-[#1C1814] rounded-lg hover:bg-[#EDE6DC] transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleEnviar}
            disabled={enviando || generandoCarta}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-[#C84B1A] hover:bg-[#A83A14] text-white rounded-lg transition-colors disabled:opacity-60"
          >
            {enviando ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Enviando…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Enviar presupuesto
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
