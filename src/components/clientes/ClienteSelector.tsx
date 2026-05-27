'use client';

import { useState, useEffect } from 'react';
import { buscarClientes } from '@/actions/clientes';
import { Cliente } from '@/types';
import { Search, Plus, User, X, Building2, AlertCircle } from 'lucide-react';
import { ModalCliente } from './ModalCliente';

interface ClienteSelectorProps {
  selectedId?: string | null;
  onSelect: (clienteId: string | null) => void;
  initialCliente?: { id: string; nombre_razon_social: string; nit_cedula?: string | null; ciudad?: string | null } | null;
  required?: boolean;
  error?: string;
}

export function ClienteSelector({ selectedId, onSelect, initialCliente, required, error }: ClienteSelectorProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Pick<Cliente, 'id' | 'nombre_razon_social' | 'nit_cedula' | 'ciudad'>[]>([]);
  const [initialList, setInitialList] = useState<Pick<Cliente, 'id' | 'nombre_razon_social' | 'nit_cedula' | 'ciudad'>[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<any>(initialCliente ?? null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [blurError, setBlurError] = useState(false);
  const [isMouseDownOnList, setIsMouseDownOnList] = useState(false);

  // Carga los primeros 10 clientes al montar para que aparezcan de inmediato al hacer clic
  useEffect(() => {
    buscarClientes('').then(setInitialList);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 1) {
        const data = await buscarClientes(query);
        setResults(data);
      } else {
        setResults(initialList);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, initialList]);

  const handleSelect = (cliente: any) => {
    setIsMouseDownOnList(false);
    setQuery('');
    setResults([]);
    setIsFocused(false);
    setBlurError(false);
    setSelectedCliente(cliente);
    onSelect(cliente.id);
  };

  const handleClear = () => {
    setSelectedCliente(null);
    onSelect(null);
  };

  const handleNuevoCreado = (nuevoCliente: any) => {
    if (nuevoCliente) handleSelect(nuevoCliente);
  };

  const handleBlur = () => {
    if (isMouseDownOnList) return;
    setIsFocused(false);
    if (query.trim().length > 0) {
      setBlurError(true);
    }
    setQuery('');
    setResults([]);
  };

  const hasInputError = blurError || !!error;

  return (
    <div className="space-y-1.5">
      <label className="text-[13px] font-medium text-stone">
        {required ? 'Cliente *' : 'Cliente (Opcional)'}
      </label>

      {selectedCliente ? (
        <div className="flex items-center justify-between p-3 bg-steel-fog rounded-lg border border-concrete animate-in fade-in zoom-in duration-200">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-[var(--accent-primary)] shadow-sm">
              <User className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-stone leading-none">{selectedCliente.nombre_razon_social}</p>
              <p className="text-[11px] text-mortar mt-1">
                {selectedCliente.nit_cedula || 'Sin NIT'} • {selectedCliente.ciudad || 'Sin ciudad'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 hover:bg-concrete rounded-full text-mortar transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-mortar pointer-events-none">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre o NIT..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setBlurError(false); }}
              onFocus={() => { setIsFocused(true); if (!query) setResults(initialList); }}
              onBlur={handleBlur}
              className={`w-full h-10 pl-10 pr-3 text-[14px] rounded-lg border bg-white text-ink focus:outline-none transition-all ${
                hasInputError
                  ? 'border-red-400 hover:border-red-400 focus:border-red-500'
                  : 'border-concrete hover:border-mortar focus:border-[var(--accent-primary)]'
              }`}
            />
          </div>

          {isFocused && results.length > 0 && (
            <ul
              className="w-full bg-white border border-concrete rounded-xl overflow-hidden"
              onMouseDown={() => setIsMouseDownOnList(true)}
              onMouseUp={() => setIsMouseDownOnList(false)}
            >
              {results.map((cliente) => (
                <li key={cliente.id} className="border-b border-concrete last:border-0">
                  <button
                    type="button"
                    onClick={() => handleSelect(cliente)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-steel-fog text-left transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-steel-fog flex items-center justify-center text-mortar shrink-0">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone truncate">{cliente.nombre_razon_social}</p>
                      <p className="text-[11px] text-mortar truncate">
                        {cliente.nit_cedula || 'Sin NIT'} • {cliente.ciudad || 'Sin ciudad'}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {isFocused && query.length >= 1 && results.length === 0 && !blurError && (
            <div className="flex items-center justify-between gap-2 px-3 py-2 bg-steel-fog border border-concrete rounded-lg">
              <div className="flex items-center gap-2 text-mortar text-[12px]">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>No se encontró ningún cliente — ¿deseas crearlo?</span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="shrink-0 text-[12px] font-semibold text-[var(--accent-primary)] hover:underline"
              >
                Crear cliente
              </button>
            </div>
          )}

          {blurError ? (
            <div className="flex items-center justify-between gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-600 text-[12px]">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>Cliente no encontrado — ¿deseas crearlo?</span>
              </div>
              <button
                type="button"
                onClick={() => { setBlurError(false); setIsModalOpen(true); }}
                className="shrink-0 text-[12px] font-semibold text-[var(--accent-primary)] hover:underline"
              >
                Crear cliente
              </button>
            </div>
          ) : error ? (
            <p className="flex items-center gap-1.5 text-[12px] text-red-600">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </p>
          ) : null}

          {!blurError && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 h-9 px-3 rounded-lg border border-dashed border-[var(--accent-primary)]/40 text-[var(--accent-primary)] text-[13px] font-semibold hover:bg-[var(--accent-primary)]/5 transition-colors"
            >
              <Plus className="h-4 w-4" /> Crear nuevo cliente
            </button>
          )}
        </div>
      )}

      <ModalCliente
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleNuevoCreado}
      />
    </div>
  );
}
