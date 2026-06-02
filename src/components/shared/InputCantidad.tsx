'use client';

import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface InputCantidadProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

export function InputCantidad({ value, onChange, className }: InputCantidadProps) {
  const [localValue, setLocalValue] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);
  const prevValueRef = useRef(value);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    prevValueRef.current = value;
    setLocalValue(String(value));
    setIsFocused(true);
    // Seleccionar todo el texto para facilitar reemplazo
    requestAnimationFrame(() => e.target.select());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Solo actualiza estado local — no propaga al padre mientras escribe
    setLocalValue(e.target.value);
  };

  const commit = (raw: string) => {
    setIsFocused(false);
    const trimmed = raw.trim();
    if (trimmed === '') {
      onChange(prevValueRef.current);
      return;
    }
    const parsed = parseFloat(trimmed.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0) {
      onChange(parsed);
    } else {
      onChange(prevValueRef.current);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    commit(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commit((e.target as HTMLInputElement).value);
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      setLocalValue(String(prevValueRef.current));
      setIsFocused(false);
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={isFocused ? localValue : String(value)}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={cn(
        'w-full bg-transparent border-none focus:ring-0 p-0 text-right text-stone text-sm',
        className
      )}
    />
  );
}
