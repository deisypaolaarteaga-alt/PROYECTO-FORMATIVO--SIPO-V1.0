'use client';

import { useState } from 'react';
import { X, BookmarkPlus, Loader2, CheckCircle2 } from 'lucide-react';
import { guardarComoPlantilla } from '@/actions/plantillas';
import { toast } from 'sonner';

interface ModalGuardarPlantillaProps {
  budgetId: string;
  budgetNombre: string;
  tipoObra?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ModalGuardarPlantilla({
  budgetId,
  budgetNombre,
  tipoObra,
  isOpen,
  onClose,
}: ModalGuardarPlantillaProps) {
  const [nombre, setNombre] = useState(budgetNombre);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setNombre(budgetNombre);
    setGuardado(false);
    onClose();
  };

  const handleGuardar = async () => {
    if (!nombre.trim()) return;
    setGuardando(true);
    const res = await guardarComoPlantilla(budgetId, nombre.trim(), tipoObra ?? null);
    setGuardando(false);
    if (res.success) {
      setGuardado(true);
      toast.success('Plantilla guardada correctamente');
      setTimeout(handleClose, 1200);
    } else {
      toast.error(res.error ?? 'No se pudo guardar la plantilla');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-steel-dark/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="px-5 py-4 border-b border-concrete flex items-center justify-between bg-steel-fog/50">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-burn-orange/10 flex items-center justify-center">
              <BookmarkPlus className="h-4 w-4 text-burn-orange" />
            </div>
            <h3 className="text-[15px] font-bold text-ink">Guardar como plantilla</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={guardando}
            className="p-1.5 hover:bg-concrete rounded-full transition-colors disabled:opacity-40"
          >
            <X className="h-4 w-4 text-stone" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {guardado ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 className="h-10 w-10 text-[#2D7A45]" />
              <p className="text-[14px] font-bold text-ink">¡Plantilla guardada!</p>
              <p className="text-[12px] text-stone text-center">
                Ya puedes usarla al crear nuevos presupuestos.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-ink">
                  Nombre de la plantilla
                </label>
                <input
                  autoFocus
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleGuardar(); }}
                  placeholder="Ej: Edificio residencial estándar"
                  className="w-full h-11 px-4 text-[14px] border border-concrete rounded-xl focus:border-burn-orange outline-none shadow-sm transition-all"
                />
                <p className="text-[11px] text-stone">
                  Se copiarán todos los capítulos, actividades y APUs del presupuesto actual.
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleClose}
                  disabled={guardando}
                  className="flex-1 h-10 text-[13px] font-semibold text-stone border border-concrete rounded-xl hover:bg-steel-fog/40 transition-colors disabled:opacity-40"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardar}
                  disabled={guardando || !nombre.trim()}
                  className="flex-1 h-10 inline-flex items-center justify-center gap-2 text-[13px] font-bold bg-burn-orange text-white rounded-xl hover:bg-[#C84B1A] transition-colors disabled:opacity-50"
                >
                  {guardando ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</>
                  ) : (
                    <><BookmarkPlus className="h-4 w-4" /> Guardar plantilla</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
