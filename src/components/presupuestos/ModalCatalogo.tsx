'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight, BookOpen, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/shared/Button';
import { obtenerCapitulosCatalogo, importarDesdeCatalogo } from '@/actions/catalogo';
import { formatearCOP } from '@/lib/utils/formato-cop';
import { toast } from 'sonner';
import type { CatalogoCapitulo } from '@/types';

const TIPOS_OBRA = [
  { id: 'residencial',    label: 'Residencial' },
  { id: 'comercial',      label: 'Comercial' },
  { id: 'industrial',     label: 'Industrial' },
  { id: 'infraestructura', label: 'Infraestructura' },
  { id: 'institucional',  label: 'Institucional' },
  { id: 'hotelero',       label: 'Hotelero' },
] as const;

interface ModalCatalogoProps {
  isOpen: boolean;
  onClose: () => void;
  budgetId: string;
  onImported: (nuevosCapitulos: any[]) => void;
}

export function ModalCatalogo({ isOpen, onClose, budgetId, onImported }: ModalCatalogoProps) {
  const [tipoObra, setTipoObra] = useState<string>('residencial');
  const [capitulos, setCapitulos] = useState<CatalogoCapitulo[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setSelected(new Set());
    setSearch('');
    cargarCatalogo(tipoObra);
  }, [isOpen, tipoObra]);

  async function cargarCatalogo(tipo: string) {
    setLoading(true);
    const res = await obtenerCapitulosCatalogo(tipo);
    if (res.success && res.data) {
      setCapitulos(res.data);
    } else {
      toast.error(res.error ?? 'Error al cargar catálogo');
    }
    setLoading(false);
  }

  const filtrados = useMemo(() => {
    if (!search.trim()) return capitulos;
    const q = search.toLowerCase();
    return capitulos.filter(cap =>
      cap.nombre.toLowerCase().includes(q) ||
      cap.catalogo_actividades?.some(a => a.nombre.toLowerCase().includes(q))
    );
  }, [capitulos, search]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(filtrados.map(c => c.id)));
  const clearAll = () => setSelected(new Set());

  const totalActividades = useMemo(() => {
    return capitulos
      .filter(c => selected.has(c.id))
      .reduce((acc, c) => acc + (c.catalogo_actividades?.length ?? 0), 0);
  }, [capitulos, selected]);

  const handleImportar = async () => {
    if (selected.size === 0) return toast.error('Selecciona al menos un capítulo.');
    setImporting(true);
    const res = await importarDesdeCatalogo(budgetId, Array.from(selected));
    setImporting(false);

    if (res.success) {
      const totalActs = res.data?.insertados ?? 0;
      onImported([]);  // dispara router.refresh() antes de cerrar el modal
      onClose();
      toast.success(`${selected.size} capítulo(s) y ${totalActs} actividades importadas con éxito`);
    } else {
      toast.error(res.error ?? 'Error al importar');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 shrink-0">
          <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <BookOpen className="h-4.5 w-4.5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-slate-900">Importar desde catálogo</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Precios de referencia Colombia 2025</p>
          </div>
        </div>

        {/* Filtros tipo de obra */}
        <div className="px-6 pt-4 pb-3 border-b border-slate-100 shrink-0 space-y-3">
          <div className="flex gap-2">
            {TIPOS_OBRA.map(t => (
              <button
                key={t.id}
                onClick={() => setTipoObra(t.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all border',
                  tipoObra === t.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar capítulo o actividad..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-9 pl-8 pr-4 text-[13px] border border-slate-200 rounded-lg focus:border-blue-400 focus:outline-none bg-slate-50"
            />
          </div>
        </div>

        {/* Lista de capítulos */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-[13px]">
              No se encontraron capítulos
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-1 pb-1">
                <span className="text-[11px] text-slate-400 font-medium">
                  {filtrados.length} capítulos disponibles
                </span>
                <div className="flex gap-3">
                  <button onClick={selectAll} className="text-[11px] text-blue-600 font-bold hover:underline">
                    Seleccionar todos
                  </button>
                  {selected.size > 0 && (
                    <button onClick={clearAll} className="text-[11px] text-slate-400 hover:text-slate-600 hover:underline">
                      Limpiar
                    </button>
                  )}
                </div>
              </div>

              {filtrados.map(cap => {
                const isSelected = selected.has(cap.id);
                const isExpanded = expanded.has(cap.id);
                const actCount = cap.catalogo_actividades?.length ?? 0;

                return (
                  <div
                    key={cap.id}
                    className={cn(
                      'rounded-xl border transition-all',
                      isSelected ? 'border-blue-300 bg-blue-50/50' : 'border-slate-100 bg-white hover:border-slate-200'
                    )}
                  >
                    <div className="flex items-center gap-3 px-4 py-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleSelect(cap.id)}
                        className={cn(
                          'h-5 w-5 rounded border-2 shrink-0 flex items-center justify-center transition-all',
                          isSelected
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-slate-300 hover:border-blue-400'
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                      </button>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-bold text-slate-800 truncate">{cap.nombre}</span>
                          <span className="text-[10px] text-slate-400 shrink-0">{actCount} actividades</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{cap.codigo}</span>
                      </div>

                      {/* Expand toggle */}
                      {actCount > 0 && (
                        <button
                          onClick={() => toggleExpand(cap.id)}
                          className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {isExpanded
                            ? <ChevronDown className="h-3.5 w-3.5" />
                            : <ChevronRight className="h-3.5 w-3.5" />
                          }
                        </button>
                      )}
                    </div>

                    {/* Actividades expandidas */}
                    {isExpanded && actCount > 0 && (
                      <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-2 space-y-1">
                        {cap.catalogo_actividades?.map(act => {
                          const tieneAPU = (act.catalogo_apu_items?.length ?? 0) > 0;
                          return (
                            <div key={act.id} className="flex items-center justify-between py-1.5 text-[12px]">
                              <span className="text-slate-600 truncate flex-1 mr-4">{act.nombre}</span>
                              <div className="flex items-center gap-2 shrink-0">
                                {tieneAPU && (
                                  <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase tracking-wide">
                                    APU
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-400 uppercase font-mono">{act.unidad}</span>
                                <span className="font-medium text-slate-700 w-28 text-right">
                                  {formatearCOP(Number(act.precio_referencia_nacional))}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="text-[12px] text-slate-500">
            {selected.size > 0 ? (
              <span className="font-medium text-slate-700">
                {selected.size} capítulo(s) · {totalActividades} actividades
              </span>
            ) : (
              'Selecciona los capítulos a importar'
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={selected.size === 0}
              loading={importing}
              onClick={handleImportar}
            >
              Importar {selected.size > 0 ? `(${selected.size})` : ''}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
