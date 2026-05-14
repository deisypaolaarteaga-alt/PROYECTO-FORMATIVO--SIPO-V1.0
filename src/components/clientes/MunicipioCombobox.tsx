'use client';

import { useState } from 'react';
import { MapPin, ChevronDown, X } from 'lucide-react';
import { MUNICIPIOS_COLOMBIA, MunicipioItem } from '@/lib/data/municipios-colombia';
import { cn } from '@/lib/utils';

interface MunicipioComboboxProps {
  value: string;
  onChange: (ciudad: string) => void;
  onDepartamentoChange?: (departamento: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export function MunicipioCombobox({
  value,
  onChange,
  onDepartamentoChange,
  label = 'Ciudad / Municipio',
  placeholder = 'Buscar municipio...',
  className,
}: MunicipioComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = search.length >= 2
    ? MUNICIPIOS_COLOMBIA.filter(m =>
        m.nombre.toLowerCase().includes(search.toLowerCase()) ||
        m.departamento.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 60)
    : MUNICIPIOS_COLOMBIA.slice(0, 20);

  const selectedItem = value
    ? MUNICIPIOS_COLOMBIA.find(m => m.nombre === value) ?? { nombre: value, departamento: '' }
    : null;

  const handleSelect = (m: MunicipioItem) => {
    onChange(m.nombre);
    onDepartamentoChange?.(m.departamento);
    setSearch('');
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    onDepartamentoChange?.('');
    setSearch('');
  };

  return (
    <div className={cn('space-y-1.5 relative', className)}>
      {label && (
        <label className="text-sm font-medium text-stone">{label}</label>
      )}

      <div
        role="combobox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
        className={cn(
          'flex items-center h-10 w-full px-3 rounded-lg border border-concrete bg-white text-sm cursor-pointer select-none',
          'hover:border-mortar transition-all',
          isOpen && 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/20'
        )}
      >
        <MapPin className="h-4 w-4 text-mortar mr-2 shrink-0" />
        {selectedItem ? (
          <span className="flex-1 text-stone truncate">
            {selectedItem.nombre}
            {selectedItem.departamento && (
              <span className="text-mortar text-xs"> — {selectedItem.departamento}</span>
            )}
          </span>
        ) : (
          <span className="flex-1 text-mortar/70">{placeholder}</span>
        )}
        {value ? (
          <button
            type="button"
            onClick={handleClear}
            className="ml-1 text-mortar hover:text-stone transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <ChevronDown className="h-4 w-4 text-mortar ml-1" />
        )}
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => { setIsOpen(false); setSearch(''); }}
          />
          <div className="absolute z-50 mt-1 w-full bg-white border border-concrete rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
            <div className="p-2 border-b border-concrete">
              <input
                autoFocus
                type="text"
                placeholder="Escribir municipio o departamento..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full text-sm px-2 py-1.5 outline-none text-stone placeholder:text-mortar"
              />
            </div>
            <div className="max-h-[220px] overflow-y-auto">
              {filtered.length > 0 ? (
                filtered.map(m => (
                  <button
                    key={`${m.nombre}-${m.departamento}`}
                    type="button"
                    onClick={() => handleSelect(m)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-steel-fog text-left transition-colors border-b border-concrete/40 last:border-0"
                  >
                    <MapPin className="h-3.5 w-3.5 text-mortar shrink-0" />
                    <span className="text-sm font-medium text-stone">{m.nombre}</span>
                    <span className="text-xs text-mortar">— {m.departamento}</span>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-mortar italic">
                  No se encontraron resultados
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
