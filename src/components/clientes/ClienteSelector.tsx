'use client';

import { useState, useEffect } from 'react';
import { buscarClientes } from '@/actions/clientes';
import { Cliente } from '@/types';
import { Search, Plus, User, MapPin, X, Building2 } from 'lucide-react';
import { Badge } from '@/components/shared/Badge';
import { ModalCliente } from './ModalCliente';
import { cn } from '@/lib/utils';

interface ClienteSelectorProps {
  selectedId?: string | null;
  onSelect: (clienteId: string | null) => void;
}

export function ClienteSelector({ selectedId, onSelect }: ClienteSelectorProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Pick<Cliente, 'id' | 'nombre_razon_social' | 'nit_cedula' | 'ciudad'>[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Buscar clientes cuando cambia el query
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2) {
        const data = await buscarClientes(query);
        setResults(data);
        setShowDropdown(true);
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (cliente: any) => {
    setSelectedCliente(cliente);
    onSelect(cliente.id);
    setQuery('');
    setShowDropdown(false);
  };

  const handleClear = () => {
    setSelectedCliente(null);
    onSelect(null);
  };

  return (
    <div className="space-y-1.5 relative">
      <label className="text-[13px] font-medium text-stone">Cliente (Opcional)</label>
      
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
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-mortar pointer-events-none">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre o NIT..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setShowDropdown(true)}
            className="w-full h-10 pl-10 pr-3 text-[14px] rounded-lg border border-concrete bg-white text-ink hover:border-mortar focus:outline-none focus:border-[var(--accent-primary)] transition-all"
          />

          {showDropdown && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-concrete rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
              <div className="max-h-[240px] overflow-y-auto">
                {results.length > 0 ? (
                  results.map((cliente) => (
                    <button
                      key={cliente.id}
                      type="button"
                      onClick={() => handleSelect(cliente)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-steel-fog text-left transition-colors border-b border-concrete last:border-0"
                    >
                      <div className="h-8 w-8 rounded-full bg-steel-fog flex items-center justify-center text-mortar">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-stone truncate">{cliente.nombre_razon_social}</p>
                        <p className="text-[11px] text-mortar truncate">
                          {cliente.nit_cedula || 'Sin NIT'} • {cliente.ciudad || 'Sin ciudad'}
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-mortar italic">
                    No se encontraron resultados
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 p-3 bg-steel-fog/50 hover:bg-steel-fog text-[var(--accent-primary)] text-sm font-bold transition-colors border-t border-concrete"
              >
                <Plus className="h-4 w-4" /> Registrar nuevo cliente
              </button>
            </div>
          )}
        </div>
      )}

      {/* Backdrop para cerrar el dropdown */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40 bg-transparent" 
          onClick={() => setShowDropdown(false)} 
        />
      )}

      <ModalCliente 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
