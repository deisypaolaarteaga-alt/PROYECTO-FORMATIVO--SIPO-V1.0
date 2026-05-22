'use client';

import { useState, useTransition } from 'react';
import {
  X, Download, MessageSquarePlus, Loader2,
  PackagePlus, TrendingUp, Wrench, HardHat,
  Zap, ShieldCheck, BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatearCOP } from '@/lib/utils/formato-cop';
import { importarActividadAInsumos, sugerirCorreccionPrecio } from '@/actions/catalogo';
import { toast } from 'sonner';
import type { CatalogoActividad, CatalogoApuItem } from '@/types';

const TIPO_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  material:          { label: 'Material',         color: 'text-[#D95510]',  bg: 'bg-orange-50 border-orange-200',  icon: PackagePlus  },
  mano_obra:         { label: 'Mano de obra',      color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',      icon: HardHat      },
  equipo:            { label: 'Equipo',            color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200',  icon: Wrench       },
  herramienta_menor: { label: 'Herr. menor',       color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200',   icon: Zap          },
  epp:               { label: 'EPP',               color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: ShieldCheck },
};

function agruparItems(items: CatalogoApuItem[]) {
  const grupos: Record<string, CatalogoApuItem[]> = {};
  for (const item of items) {
    if (!grupos[item.tipo]) grupos[item.tipo] = [];
    grupos[item.tipo].push(item);
  }
  return grupos;
}

interface Props {
  actividad: CatalogoActividad | null;
  isOpen: boolean;
  onClose: () => void;
  tipoObra: string;
}

export function CatalogoActividadDrawer({ actividad, isOpen, onClose, tipoObra }: Props) {
  const [mostrarSugerencia, setMostrarSugerencia] = useState(false);
  const [precioSugerido, setPrecioSugerido] = useState('');
  const [comentario, setComentario] = useState('');
  const [importando, startImportar] = useTransition();
  const [enviando, startEnviar] = useTransition();

  if (!isOpen || !actividad) return null;

  const apuItems: CatalogoApuItem[] = (actividad.catalogo_apu_items ?? [])
    .slice()
    .sort((a, b) => a.orden - b.orden);

  const grupos = agruparItems(apuItems);
  const pRef = Number(actividad.precio_referencia_nacional || 0);
  const pMin = Number(actividad.rango_min || 0);
  const pMax = Number(actividad.rango_max || 0);

  const totalAPU = apuItems.reduce((acc, item) => acc + Number(item.cantidad) * Number(item.precio_unitario), 0);

  function handleImportar() {
    startImportar(async () => {
      const res = await importarActividadAInsumos({
        id: actividad!.id,
        nombre: actividad!.nombre,
        unidad: actividad!.unidad,
        precio_referencia_nacional: actividad!.precio_referencia_nacional,
      });
      if (res.success) {
        toast.success(`"${actividad!.nombre}" importado a Mis Insumos.`);
      } else {
        toast.error(res.error ?? 'No se pudo importar.');
      }
    });
  }

  function handleEnviarSugerencia() {
    const precio = parseFloat(precioSugerido.replace(/[^\d.]/g, ''));
    if (!precio || precio <= 0) {
      toast.error('Ingresa un precio válido mayor a cero.');
      return;
    }
    startEnviar(async () => {
      const res = await sugerirCorreccionPrecio(actividad!.id, pRef, precio, comentario);
      if (res.success) {
        toast.success('Gracias. Tu sugerencia fue registrada.');
        setMostrarSugerencia(false);
        setPrecioSugerido('');
        setComentario('');
      } else {
        toast.error(res.error ?? 'No se pudo enviar la sugerencia.');
      }
    });
  }

  function cerrar() {
    setMostrarSugerencia(false);
    setPrecioSugerido('');
    setComentario('');
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
        onClick={cerrar}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className="fixed top-0 right-0 z-50 h-screen w-full max-w-[520px] bg-white shadow-2xl flex flex-col"
        style={{ borderLeft: '1px solid #E5E1D8' }}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="shrink-0 px-5 py-4 border-b border-[#E5E1D8] flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide shrink-0',
                'bg-orange-50 text-orange-700 border-orange-200'
              )}>
                {tipoObra}
              </span>
              {actividad.codigo && (
                <span className="text-[11px] font-mono text-slate-400 shrink-0">{actividad.codigo}</span>
              )}
            </div>
            <h2 className="text-[15px] font-bold text-slate-900 leading-snug">{actividad.nombre}</h2>
            {actividad.descripcion && (
              <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">{actividad.descripcion}</p>
            )}
          </div>
          <button
            onClick={cerrar}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0 mt-0.5"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {/* ── Precios de referencia ─────────────────────────────────────── */}
        <div className="shrink-0 px-5 py-4 border-b border-[#E5E1D8] bg-[#FDF9F6]">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Precio de referencia</p>
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[24px] font-black text-[#D95510] tabular-nums leading-none">
                  {pRef > 0 ? formatearCOP(pRef) : '—'}
                </span>
                <span className="text-[12px] text-slate-500 font-medium">/ {actividad.unidad}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Precio nacional Colombia 2025–2026</p>
            </div>

            {pMin > 0 && pMax > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 border border-slate-200 rounded-lg px-3 py-2 bg-white">
                <BarChart3 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>Rango:</span>
                <span className="font-bold text-slate-700">
                  {formatearCOP(pMin)} – {formatearCOP(pMax)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Cuerpo con scroll ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* APU de referencia */}
          {apuItems.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">APU de referencia</p>
                <span className="text-[10px] text-slate-400">{apuItems.length} insumos</span>
              </div>

              <div className="rounded-xl border border-[#E5E1D8] overflow-hidden">
                {Object.entries(grupos).map(([tipo, items]) => {
                  const cfg = TIPO_CONFIG[tipo] ?? { label: tipo, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200', icon: PackagePlus };
                  const Icon = cfg.icon;
                  const subtotalGrupo = items.reduce((acc, i) => acc + Number(i.cantidad) * Number(i.precio_unitario), 0);

                  return (
                    <div key={tipo}>
                      {/* Cabecera de grupo */}
                      <div className={cn('flex items-center gap-2 px-3 py-1.5 border-b border-[#E5E1D8]', cfg.bg)}>
                        <Icon className={cn('h-3.5 w-3.5 shrink-0', cfg.color)} />
                        <span className={cn('text-[10px] font-bold uppercase tracking-wide', cfg.color)}>
                          {cfg.label}
                        </span>
                        <span className="ml-auto text-[10px] font-bold text-slate-600 tabular-nums">
                          {formatearCOP(subtotalGrupo)}
                        </span>
                      </div>

                      {/* Filas de ítems */}
                      {items.map((item, idx) => {
                        const sub = Number(item.cantidad) * Number(item.precio_unitario);
                        return (
                          <div
                            key={item.id ?? idx}
                            className="grid grid-cols-[1fr_52px_80px_88px] items-center px-3 py-2 text-[12px] border-b border-slate-100 last:border-0 bg-white hover:bg-slate-50/60 transition-colors"
                          >
                            <span className="text-slate-800 leading-snug truncate pr-2">{item.nombre}</span>
                            <span className="text-slate-400 font-mono text-[10px] text-center uppercase">{item.unidad}</span>
                            <span className="text-slate-600 tabular-nums text-right">{Number(item.cantidad).toFixed(3)}</span>
                            <span className="text-slate-800 font-semibold tabular-nums text-right">
                              {formatearCOP(sub)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}

                {/* Total APU */}
                <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 border-t border-slate-200">
                  <span className="text-[12px] font-bold text-slate-700">Total APU (rendimiento = 1)</span>
                  <span className="text-[14px] font-black text-slate-900 tabular-nums">{formatearCOP(totalAPU)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center">
              <p className="text-[12px] text-slate-400">Esta actividad no tiene APU de referencia registrado.</p>
            </div>
          )}

          {/* Formulario de sugerencia */}
          {mostrarSugerencia && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
              <p className="text-[12px] font-bold text-amber-800">Sugerir corrección de precio</p>
              <div>
                <label className="text-[11px] font-semibold text-amber-700 block mb-1">
                  Precio sugerido (COP / {actividad.unidad})
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Ej: 85000"
                  value={precioSugerido}
                  onChange={e => setPrecioSugerido(e.target.value)}
                  className="w-full h-8 px-3 text-[13px] border border-amber-200 rounded-lg bg-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-amber-700 block mb-1">
                  Comentario (opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ciudad de referencia, fuente del precio, fecha de cotización..."
                  value={comentario}
                  onChange={e => setComentario(e.target.value)}
                  className="w-full px-3 py-2 text-[12px] border border-amber-200 rounded-lg bg-white focus:border-amber-400 focus:outline-none resize-none"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setMostrarSugerencia(false)}
                  className="px-3 py-1.5 text-[12px] text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEnviarSugerencia}
                  disabled={enviando || !precioSugerido}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
                >
                  {enviando && <Loader2 className="h-3 w-3 animate-spin" />}
                  Enviar sugerencia
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer con acciones ──────────────────────────────────────────── */}
        <div className="shrink-0 px-5 py-3.5 border-t border-[#E5E1D8] bg-white flex items-center gap-2">
          {!mostrarSugerencia && (
            <button
              onClick={() => setMostrarSugerencia(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Sugerir precio
            </button>
          )}

          <button
            onClick={handleImportar}
            disabled={importando}
            className="ml-auto flex items-center gap-2 px-4 py-2 text-[13px] font-semibold bg-[#D95510] text-white rounded-lg hover:bg-[#C04A0D] disabled:opacity-60 transition-colors shadow-sm"
          >
            {importando
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Download className="h-3.5 w-3.5" />
            }
            Importar a Mis Insumos
          </button>
        </div>
      </aside>
    </>
  );
}
