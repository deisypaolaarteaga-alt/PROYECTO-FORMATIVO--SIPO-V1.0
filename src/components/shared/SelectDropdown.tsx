'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md';
  error?: boolean;
}

export function SelectDropdown({
  value,
  onChange,
  options,
  placeholder,
  className,
  disabled = false,
  id,
  name,
  size = 'md',
  error = false,
}: SelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selected = options.find(o => o.value === value);
  const display = selected?.label ?? placeholder ?? '';
  const isEmpty = !selected && placeholder !== undefined;

  const heightCls = size === 'xs' ? 'h-7' : size === 'sm' ? 'h-8' : 'h-10';
  const textCls   = size === 'xs' ? 'text-[11px]' : size === 'sm' ? 'text-xs' : 'text-sm';
  const padCls    = size === 'xs' ? 'px-1.5' : size === 'sm' ? 'px-2' : 'px-3';
  const iconCls   = size === 'xs' ? 'h-3 w-3' : size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setOpen(v => !v)}
        className={cn(
          'w-full flex items-center justify-between gap-1',
          heightCls, padCls, textCls,
          'bg-[#F8F7F5] border rounded-lg text-left transition-all cursor-pointer',
          'focus:outline-none focus:ring-2',
          error
            ? 'border-red-400 focus:ring-red-200 focus:border-red-500'
            : 'border-[#E5E1D8] focus:ring-[#E8571A]/20 focus:border-[#E8571A]',
          isEmpty ? 'text-[#9CA3AF]' : 'text-[#374151]',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <span className="truncate flex-1">{display}</span>
        <ChevronDown
          className={cn(
            iconCls,
            'shrink-0 text-[#9CA3AF] transition-transform duration-150',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[100px] bg-white border border-[#E5E1D8] rounded-lg shadow-md overflow-hidden">
          <div className="max-h-56 overflow-y-auto">
            {placeholder !== undefined && (
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false); }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm transition-colors',
                  value === ''
                    ? 'bg-[#FFF4EF] text-[#E8571A] font-medium'
                    : 'text-[#9CA3AF] hover:bg-[#FFF4EF] hover:text-[#E8571A]',
                )}
              >
                {placeholder}
              </button>
            )}
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                disabled={opt.disabled}
                onClick={() => { if (!opt.disabled) { onChange(opt.value); setOpen(false); } }}
                className={cn(
                  'w-full text-left px-3 py-2 transition-colors',
                  textCls,
                  opt.disabled
                    ? 'text-[#9CA3AF] cursor-not-allowed opacity-60'
                    : opt.value === value
                      ? 'bg-[#FFF4EF] text-[#E8571A] font-medium'
                      : 'text-[#374151] hover:bg-[#FFF4EF] hover:text-[#E8571A]',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {name && <input type="hidden" name={name} value={value} />}
    </div>
  );
}
