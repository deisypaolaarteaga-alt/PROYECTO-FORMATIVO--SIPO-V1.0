'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2, Pencil } from 'lucide-react';
import { renombrarPlantilla } from '@/actions/plantillas';
import { toast } from 'sonner';
import type { UserPlantilla } from '@/types';

interface Props {
  plantilla: UserPlantilla | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ModalRenombrarPlantilla({ plantilla, isOpen, onClose }: Props) {
  const [nombre, setNombre] = useState('');
  const [guardando, setGuardando] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isOpen && plantilla) setNombre(plantilla.nombre);
  }, [isOpen, plantilla]);

  if (!isOpen || !plantilla) return null;

  async function handleGuardar() {
    if (!nombre.trim() || nombre.trim().length < 3) {
      toast.error('El nombre debe tener al menos 3 caracteres');
      return;
    }
    setGuardando(true);
    const res = await renombrarPlantilla(plantilla!.id, nombre.trim());
    setGuardando(false);
    if (res.success) {
      toast.success('Plantilla renombrada');
      onClose();
      router.refresh();
    } else {
      toast.error(res.error || 'No se pudo renombrar la plantilla');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleGuardar();
    if (e.key === 'Escape') onClose();
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => { if (!guardando) onClose(); }}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E4DE]">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#FFF4EE] flex items-center justify-center">
              <Pencil className="h-4 w-4 text-[#D95510]" />
            </div>
            <h3 className="text-[15px] font-bold text-[#111827]">Renombrar plantilla</h3>
          </div>
          <button
            onClick={onClose}
            disabled={guardando}
            className="p-1.5 rounded-lg hover:bg-[#F3F4F6] transition-colors disabled:opacity-40"
          >
            <X className="h-4 w-4 text-[#6B7280]" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          <label className="block text-[13px] font-semibold text-[#374151] mb-2">
            Nuevo nombre
          </label>
          <input
            autoFocus
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={200}
            placeholder="Nombre de la plantilla"
            className="w-full h-11 px-4 text-[14px] border border-[#D1D5DB] rounded-xl focus:border-[#D95510] focus:ring-2 focus:ring-[#D95510]/20 outline-none transition-all bg-white"
          />
          <p className="text-[11px] text-[#9CA3AF] mt-1.5">Mínimo 3 caracteres.</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[#E8E4DE] bg-[#F9F8F6]">
          <button
            onClick={onClose}
            disabled={guardando}
            className="px-4 py-2 text-[13px] font-medium text-[#6B7280] hover:bg-[#F3F4F6] rounded-lg transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando || nombre.trim().length < 3}
            className="flex items-center gap-2 px-5 py-2 text-[13px] font-semibold bg-[#D95510] text-white rounded-lg hover:bg-[#C04A0D] disabled:opacity-50 transition-colors shadow-sm"
          >
            {guardando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
