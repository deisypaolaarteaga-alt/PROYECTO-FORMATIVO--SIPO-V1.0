'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const TIPOS_OBRA = [
  { value: 'residencial',     label: 'Residencial' },
  { value: 'comercial',       label: 'Comercial' },
  { value: 'industrial',      label: 'Industrial' },
  { value: 'infraestructura', label: 'Infraestructura' },
  { value: 'institucional',   label: 'Institucional' },
  { value: 'hotelero',        label: 'Hotelero' },
  { value: 'otro',            label: 'Otro' },
];

interface SelectorTipoObraProps {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  label?: string;
  className?: string;
}

export function SelectorTipoObra({
  value,
  onChange,
  name,
  label = 'Tipo de obra',
  className,
}: SelectorTipoObraProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = TIPOS_OBRA.find((t) => t.value === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="text-[13px] font-medium text-stone">{label}</label>
      )}
      {name && <input type="hidden" name={name} value={value} />}
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'w-full h-10 flex items-center justify-between gap-2 px-3 text-[14px] rounded-lg border bg-white transition-all text-left',
            open
              ? 'border-[#C84B1A] ring-1 ring-[#C84B1A]/20'
              : 'border-[#E8E4DE] hover:border-[#C8C0B5]',
            selected ? 'text-[#1C1814]' : 'text-[#A89F96]'
          )}
        >
          <span>{selected?.label ?? 'Selecciona tipo'}</span>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-[#A89F96] transition-transform duration-150 shrink-0',
              open && 'rotate-180'
            )}
          />
        </button>

        {open && (
          <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-lg border border-[#E8E4DE] shadow-[0_4px_16px_0_rgba(28,24,20,0.10)] overflow-hidden">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              className={cn(
                'w-full text-left px-3.5 py-2.5 text-[14px] transition-colors',
                !value
                  ? 'bg-[#FAF0EB] text-[#C84B1A] font-semibold'
                  : 'text-[#3D3530] hover:bg-[#F4F2EE]'
              )}
            >
              Sin especificar
            </button>
            <div className="h-px bg-[#EAE6E0] mx-2" />
            {TIPOS_OBRA.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => { onChange(t.value); setOpen(false); }}
                className={cn(
                  'w-full text-left px-3.5 py-2.5 text-[14px] transition-colors',
                  value === t.value
                    ? 'bg-[#FAF0EB] text-[#C84B1A] font-semibold'
                    : 'text-[#3D3530] hover:bg-[#F4F2EE]'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
