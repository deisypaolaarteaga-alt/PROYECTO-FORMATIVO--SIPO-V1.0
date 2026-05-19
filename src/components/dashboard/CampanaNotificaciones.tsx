'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import type { VencimientoItem } from '@/actions/analytics';

export default function CampanaNotificaciones({
  vencimientos,
}: {
  vencimientos: VencimientoItem[];
}) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickFuera(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    if (abierto) document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, [abierto]);

  const colorDias = (dias: number) => {
    if (dias <= 7)  return 'text-[#DC2626]';
    if (dias <= 15) return 'text-[#EA580C]';
    return 'text-[#2563EB]';
  };

  const bgEstado: Record<string, string> = {
    borrador:    'bg-[#F3F4F6] text-[#6B7280]',
    en_revision: 'bg-[#FFF7ED] text-[#EA580C]',
    aprobado:    'bg-[#F0FDF4] text-[#059669]',
    rechazado:   'bg-[#FEF2F2] text-[#DC2626]',
    archivado:   'bg-[#F3F4F6] text-[#9CA3AF]',
  };

  const labelEstado: Record<string, string> = {
    borrador:    'Borrador',
    en_revision: 'En revisión',
    aprobado:    'Aprobado',
    rechazado:   'Rechazado',
    archivado:   'Archivado',
  };

  const lista = vencimientos.slice(0, 8);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white hover:bg-gray-50 transition-colors cursor-pointer overflow-visible"
      >
        <Bell className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
        {vencimientos.length > 0 && (
          <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#D95510] text-[9px] font-bold text-white leading-none">
            {vencimientos.length}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 mt-2 w-[340px] rounded-xl border border-[#E5E7EB] bg-white shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#F3F4F6]">
            <span className="text-[13px] font-semibold text-[#111827]">Notificaciones</span>
            <span className="text-[11px] font-medium text-[#6B7280]">
              {vencimientos.length} presupuesto{vencimientos.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Lista */}
          {lista.length === 0 ? (
            <p className="text-[12px] text-[#9CA3AF] text-center py-6">Sin notificaciones</p>
          ) : (
            <ul>
              {lista.map((v) => (
                <li
                  key={v.budget_id}
                  className="flex items-center gap-3 px-4 py-2.5 border-b border-[#F9FAFB] last:border-0 hover:bg-[#F9FAFB] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[#111827] truncate">{v.titulo}</p>
                  </div>
                  <span className={`text-[11px] font-semibold shrink-0 ${colorDias(v.dias_restantes)}`}>
                    {v.dias_restantes <= 0
                      ? 'Vencido'
                      : `${v.dias_restantes}d`}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${bgEstado[v.estado] ?? 'bg-[#F3F4F6] text-[#6B7280]'}`}
                  >
                    {labelEstado[v.estado] ?? v.estado}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* Footer */}
          <Link
            href="/presupuestos"
            onClick={() => setAbierto(false)}
            className="block text-center text-[12px] font-medium text-[#D95510] hover:text-[#B84610] py-3 border-t border-[#F3F4F6] transition-colors"
          >
            Ver todos los presupuestos
          </Link>
        </div>
      )}
    </div>
  );
}
