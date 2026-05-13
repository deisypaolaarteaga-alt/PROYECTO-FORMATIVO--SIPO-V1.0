'use client';

import { useState, useEffect } from 'react';
import { formatearCOP, parsearCOP } from '@/lib/utils/formato-cop';
import { cn } from '@/lib/utils';

interface InputPrecioProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export function InputPrecio({ value, onChange, className, placeholder = "$0", autoFocus }: InputPrecioProps) {
  const [displayValue, setDisplayValue] = useState(formatearCOP(value));

  useEffect(() => {
    setDisplayValue(formatearCOP(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = parsearCOP(rawValue);
    setDisplayValue(formatearCOP(numericValue));
    onChange(numericValue);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      autoFocus={autoFocus}
      placeholder={placeholder}
      className={cn(
        "bg-transparent border-none focus:ring-0 p-0 transition-all",
        className
      )}
    />
  );
}
