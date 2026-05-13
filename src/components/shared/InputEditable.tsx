'use client';

import { cn } from '@/lib/utils';

interface InputEditableProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export function InputEditable({ value, onChange, className, placeholder, autoFocus }: InputEditableProps) {
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={handleFocus}
      autoFocus={autoFocus}
      placeholder={placeholder}
      className={cn(
        "bg-transparent border-none focus:ring-0 p-0 w-full transition-all",
        className
      )}
    />
  );
}
