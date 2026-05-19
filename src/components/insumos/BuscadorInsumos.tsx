'use client';

import { useState, useEffect } from 'react';
import { Search, Package, Users, Drill, Star, Plus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { formatearCOP } from '@/lib/utils/formato-cop';
import { searchInsumos } from '@/actions/insumos';
import { cn } from '@/lib/utils';

interface BuscadorInsumosProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (insumo: any) => void;
}

/* Icono por fuente */
const SOURCE_ICON: Record<string, { bg: string; text: string }> = {
  materials: { bg: 'bg-[#FAF0EB]', text: 'text-[#D95510]' },
  labor:     { bg: 'bg-[#EBF2FA]', text: 'text-[#1E4D8C]' },
  equipment: { bg: 'bg-[#EBFAF0]', text: 'text-[#166534]' },
  user:      { bg: 'bg-[#FEF3E2]', text: 'text-[#7A4B00]' },
};

export function BuscadorInsumos({ isOpen, onClose, onSelect }: BuscadorInsumosProps) {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'all' | 'material' | 'mano_obra' | 'equipo' | 'user'>('all');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen) handleSearch();
    }, 300);
    return () => clearTimeout(timer);
  }, [query, tab, isOpen]);

  async function handleSearch() {
    setLoading(true);
    try {
      const res = await searchInsumos(query, tab === 'all' ? undefined : tab);
      setResults(res || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1A2535]/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#D0D4DB] flex items-center justify-between bg-[#ECEEF2]">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-[#D95510]" />
            <h3 className="text-sm font-bold text-[#1F2937] uppercase tracking-tight">Buscador de Insumos</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#DDE0E6] rounded-full transition-colors">
            <X className="h-4 w-4 text-[#6B7A8D]" />
          </button>
        </div>

        {/* Search & Tabs */}
        <div className="p-6 border-b border-[#D0D4DB] space-y-4">
          <div className="relative">
            <input
              autoFocus
              placeholder="Buscar por nombre (ej: Cemento, Oficial, Mezcladora...)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-[#ECEEF2] border border-[#C8CDD6] rounded-lg focus:border-[#D95510] focus:ring-2 focus:ring-[#D95510]/20 outline-none transition-all text-sm"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6B7A8D]" />
            {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D95510] animate-spin" />}
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {[
              { id: 'all',      label: 'Todos',       icon: Search  },
              { id: 'material', label: 'Materiales',  icon: Package },
              { id: 'mano_obra',label: 'Mano de Obra',icon: Users   },
              { id: 'equipo',   label: 'Equipos',     icon: Drill   },
              { id: 'user',     label: 'Mis Insumos', icon: Star    },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border",
                  tab === t.id
                    ? "bg-[#D95510] border-[#D95510] text-white"
                    : "bg-white border-[#C8CDD6] text-[#6B7A8D] hover:border-[#D0D4DB] hover:text-[#4B5563]"
                )}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="grid grid-cols-1 gap-1">
            {results.map((item, idx) => {
              const iconCfg = SOURCE_ICON[item.source] ?? SOURCE_ICON.user;
              return (
                <button
                  key={`${item.id}-${idx}`}
                  onClick={() => onSelect(item)}
                  className="flex items-center justify-between p-4 rounded-lg hover:bg-[#ECEEF2] text-left transition-colors group border border-transparent hover:border-[#D0D4DB]"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", iconCfg.bg, iconCfg.text)}>
                      {item.source === 'materials' ? <Package className="h-5 w-5" /> :
                       item.source === 'labor'     ? <Users   className="h-5 w-5" /> :
                       item.source === 'equipment' ? <Drill   className="h-5 w-5" /> : <Star className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1F2937]">{item.nombre}</p>
                      <p className="text-[11px] text-[#6B7A8D] uppercase font-semibold tracking-wider">
                        {item.unidad} • {item.categoria || item.oficio || item.tipo}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#1F2937] tabular-nums">{formatearCOP(Number(item.precio_referencia || item.precio_diario || item.precio_unitario || 0))}</p>
                    {item.source !== 'user' && <span className="text-[9px] font-bold text-[#C8CDD6] uppercase tracking-widest">SISTEMA</span>}
                  </div>
                </button>
              );
            })}

            {results.length === 0 && !loading && (
              <div className="py-12 text-center space-y-4">
                <p className="text-sm text-[#6B7A8D] italic">No encontramos insumos con ese nombre.</p>
                <Button variant="secondary" size="sm" icon={<Plus className="h-4 w-4" />}>
                  Crear nuevo insumo personalizado
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
