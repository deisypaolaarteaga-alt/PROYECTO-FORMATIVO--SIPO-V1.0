'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Calendar, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type PeriodoPicker, getMesesDisponibles } from '@/lib/utils/periodos';

const MESES = getMesesDisponibles(24);
const MESES_CORTOS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

function formatearRangoPersonalizado(v: string): string {
  const parts = v.split(':');
  if (parts.length < 3) return 'Rango personalizado';
  const [, desdeStr, hastaStr] = parts;
  const fmtDia = (s: string) => {
    const [, m, d] = s.split('-').map(Number);
    if (!m || !d) return s;
    return `${String(d).padStart(2, '0')} ${MESES_CORTOS[m - 1]}`;
  };
  const anioHasta = hastaStr.split('-')[0] ?? '';
  return `${fmtDia(desdeStr)} – ${fmtDia(hastaStr)} ${anioHasta}`;
}

interface SelectorPeriodoProps {
  value: PeriodoPicker;
  onChange: (periodo: PeriodoPicker) => void;
  className?: string;
}

export function SelectorPeriodo({ value, onChange, className }: SelectorPeriodoProps) {
  const [open,               setOpen]               = useState(false);
  const [mostrarPersonalizar, setMostrarPersonalizar] = useState(false);
  const [desdeInput,         setDesdeInput]         = useState('');
  const [hastaInput,         setHastaInput]         = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const esPersonalizado = value.startsWith('personalizado:');

  const label = value === 'todo'
    ? 'Todos los períodos'
    : esPersonalizado
      ? formatearRangoPersonalizado(value)
      : (MESES.find((m) => m.value === value)?.label ?? value);

  function handleToggle() {
    setOpen((o) => {
      const next = !o;
      if (next && esPersonalizado) {
        const parts = value.split(':');
        setDesdeInput(parts[1] ?? '');
        setHastaInput(parts[2] ?? '');
        setMostrarPersonalizar(true);
      }
      if (!next) setMostrarPersonalizar(false);
      return next;
    });
  }

  function handleSelectFijo(v: string) {
    onChange(v);
    setOpen(false);
    setMostrarPersonalizar(false);
  }

  function handleClickPersonalizar() {
    if (esPersonalizado) {
      const parts = value.split(':');
      setDesdeInput(parts[1] ?? '');
      setHastaInput(parts[2] ?? '');
    } else {
      setDesdeInput('');
      setHastaInput('');
    }
    setMostrarPersonalizar(true);
  }

  function handleAplicar() {
    if (!desdeInput || !hastaInput || desdeInput > hastaInput) return;
    onChange(`personalizado:${desdeInput}:${hastaInput}`);
    setOpen(false);
    setMostrarPersonalizar(false);
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setMostrarPersonalizar(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const aplicarDisabled = !desdeInput || !hastaInput || desdeInput > hastaInput;

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={handleToggle}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-white transition-colors text-[12px] whitespace-nowrap',
          open || esPersonalizado
            ? 'border-[#C84B1A] text-[#C84B1A]'
            : 'border-[#E8E4DE] text-[#3D3530] hover:border-[#C8C0B5]'
        )}
      >
        <Calendar className="w-3.5 h-3.5 shrink-0 text-[#A89F96]" />
        <span style={{ fontFamily: 'var(--font-mono)' }}>{label}</span>
        <ChevronDown
          className={cn(
            'w-3 h-3 text-[#A89F96] transition-transform duration-150',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[220px] bg-white rounded-lg border border-[#E8E4DE] shadow-[0_4px_16px_0_rgba(28,24,20,0.10)] overflow-hidden">

          {/* Opciones fijas */}
          <button
            onClick={() => handleSelectFijo('todo')}
            className={cn(
              'w-full text-left px-3.5 py-2.5 text-[12px] transition-colors',
              value === 'todo'
                ? 'bg-[#FAF0EB] text-[#C84B1A] font-semibold'
                : 'text-[#3D3530] hover:bg-[#F4F2EE]'
            )}
          >
            Todos los períodos
          </button>
          <div className="h-px bg-[#EAE6E0] mx-2 my-1" />
          {MESES.map((m) => (
            <button
              key={m.value}
              onClick={() => handleSelectFijo(m.value)}
              className={cn(
                'w-full text-left px-3.5 py-2.5 text-[12px] transition-colors',
                value === m.value
                  ? 'bg-[#FAF0EB] text-[#C84B1A] font-semibold'
                  : 'text-[#3D3530] hover:bg-[#F4F2EE]'
              )}
            >
              {m.label}
            </button>
          ))}

          {/* Separador + Personalizar */}
          <div className="h-px bg-[#EAE6E0] mx-2 my-1" />
          <button
            onClick={handleClickPersonalizar}
            className={cn(
              'w-full text-left px-3.5 py-2.5 text-[12px] transition-colors flex items-center gap-2',
              esPersonalizado || mostrarPersonalizar
                ? 'bg-[#FAF0EB] text-[#C84B1A] font-semibold'
                : 'text-[#3D3530] hover:bg-[#F4F2EE]'
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 shrink-0 opacity-60" />
            Personalizar
          </button>

          {/* Panel inline de fechas */}
          {mostrarPersonalizar && (
            <div className="px-3 pt-2 pb-3 border-t border-[#EAE6E0] bg-[#FAF8F6]">
              <div className="flex flex-col gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-[#A89F96] uppercase tracking-[0.08em] mb-1">
                    Desde
                  </label>
                  <input
                    type="date"
                    value={desdeInput}
                    onChange={(e) => setDesdeInput(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-[12px] border border-[#E8E4DE] rounded-md bg-white text-[#1C1814] focus:outline-none focus:border-[#C84B1A] transition-colors"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#A89F96] uppercase tracking-[0.08em] mb-1">
                    Hasta
                  </label>
                  <input
                    type="date"
                    value={hastaInput}
                    min={desdeInput || undefined}
                    onChange={(e) => setHastaInput(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-[12px] border border-[#E8E4DE] rounded-md bg-white text-[#1C1814] focus:outline-none focus:border-[#C84B1A] transition-colors"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  />
                </div>
                <button
                  onClick={handleAplicar}
                  disabled={aplicarDisabled}
                  className="w-full py-1.5 rounded-md text-[12px] font-semibold transition-colors bg-[#C84B1A] text-white hover:bg-[#A83A14] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Aplicar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
