'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import Decimal from 'decimal.js';
import { cn } from '@/lib/utils';
import { formatearCOP } from '@/lib/utils/formato-cop';
import { getDetalleVersion, getVersiones } from '@/actions/versiones';
import type { BudgetSnapshot, SnapshotData, SnapshotActividad } from '@/types';

interface ModalCompararVersionesProps {
  snapshotId: string;  // versión antigua
  budgetId: string;
  onClose: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function calcTotalOferta(d: SnapshotData): Decimal {
  const cd    = new Decimal(d.costo_directo ?? 0);
  const admin = cd.mul(new Decimal(d.administracion_pct ?? 0).div(100));
  const impr  = cd.mul(new Decimal(d.imprevistos_pct  ?? 0).div(100));
  const util  = cd.mul(new Decimal(d.utilidad_pct     ?? 0).div(100));
  const sub   = cd.plus(admin).plus(impr).plus(util);
  const ivaPct = new Decimal(d.iva_porcentaje ?? 19).div(100);

  let iva = new Decimal(0);
  switch (d.metodo_iva) {
    case 'sobre_utilidad': iva = util.mul(ivaPct); break;
    case 'sobre_aiu':      iva = admin.plus(impr).plus(util).mul(ivaPct); break;
    case 'sobre_total':    iva = sub.mul(ivaPct); break;
  }
  return sub.plus(iva);
}

function formatearFechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit', month: 'short',
  });
}

type DiffEstado = 'igual' | 'precio_distinto' | 'solo_antigua' | 'solo_nueva';

interface ActividadDiff {
  nombre: string;
  estado: DiffEstado;
  antiguaSubtotal?: number;
  nuevaSubtotal?:   number;
  delta?: number;
}

function diffActividades(
  antiguas: SnapshotActividad[],
  nuevas:   SnapshotActividad[],
): ActividadDiff[] {
  const mapAntiguas = new Map(antiguas.map((a) => [a.nombre, a]));
  const mapNuevas   = new Map(nuevas.map((a) => [a.nombre, a]));
  const todosNombres = new Set([...mapAntiguas.keys(), ...mapNuevas.keys()]);
  const result: ActividadDiff[] = [];

  for (const nombre of todosNombres) {
    const ant = mapAntiguas.get(nombre);
    const nva = mapNuevas.get(nombre);

    if (ant && nva) {
      const deltaD = new Decimal(nva.subtotal ?? 0).minus(ant.subtotal ?? 0);
      const estado: DiffEstado = deltaD.isZero() ? 'igual' : 'precio_distinto';
      result.push({ nombre, estado,
        antiguaSubtotal: ant.subtotal,
        nuevaSubtotal:   nva.subtotal,
        delta: deltaD.toNumber(),
      });
    } else if (ant && !nva) {
      result.push({ nombre, estado: 'solo_antigua', antiguaSubtotal: ant.subtotal });
    } else if (!ant && nva) {
      result.push({ nombre, estado: 'solo_nueva', nuevaSubtotal: nva.subtotal });
    }
  }
  return result;
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function DeltaBadge({ delta }: { delta: number }) {
  const d = new Decimal(delta);
  if (d.isZero()) return null;
  const positivo = d.gt(0);
  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded',
      positivo ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
    )}>
      {positivo ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {positivo ? '+' : ''}{formatearCOP(d.toNumber())}
    </span>
  );
}

function FilaDiff({ diff }: { diff: ActividadDiff }) {
  const rowCls = cn(
    'text-sm border-b border-[#F0EDE8]',
    diff.estado === 'igual'          && 'bg-white',
    diff.estado === 'precio_distinto'&& 'bg-amber-50',
    diff.estado === 'solo_antigua'   && 'bg-red-50',
    diff.estado === 'solo_nueva'     && 'bg-green-50',
  );

  return (
    <tr className={rowCls}>
      {/* Columna antigua */}
      <td className="px-3 py-2.5 w-1/2 border-r border-[#E8E4DE]">
        <div className="flex justify-between items-center gap-2">
          <span className={cn(
            'text-stone-700 truncate max-w-[55%]',
            diff.estado === 'solo_antigua' && 'line-through text-red-500',
          )}>
            {diff.estado !== 'solo_nueva' ? diff.nombre : '—'}
          </span>
          {diff.antiguaSubtotal != null && (
            <span className="tabular-nums text-stone-600 shrink-0">
              {formatearCOP(diff.antiguaSubtotal)}
            </span>
          )}
        </div>
      </td>
      {/* Columna nueva */}
      <td className="px-3 py-2.5 w-1/2">
        <div className="flex justify-between items-center gap-2">
          <span className={cn(
            'text-stone-700 truncate max-w-[55%]',
            diff.estado === 'solo_nueva' && 'text-green-700 font-medium',
          )}>
            {diff.estado !== 'solo_antigua' ? diff.nombre : '—'}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {diff.nuevaSubtotal != null && (
              <span className="tabular-nums text-stone-600">
                {formatearCOP(diff.nuevaSubtotal)}
              </span>
            )}
            {diff.delta != null && diff.delta !== 0 && (
              <DeltaBadge delta={diff.delta} />
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export function ModalCompararVersiones({ snapshotId, budgetId, onClose }: ModalCompararVersionesProps) {
  const [antiguo,  setAntiguo]  = useState<BudgetSnapshot | null>(null);
  const [actual,   setActual]   = useState<SnapshotData | null>(null);
  const [actualMeta, setActualMeta] = useState<{ version: number; created_at: string } | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getDetalleVersion(snapshotId),
      getVersiones(budgetId),
    ]).then(([snapRes, versRes]) => {
      if (!snapRes.success || !snapRes.snapshot) {
        setError(snapRes.error ?? 'Error al cargar la versión');
        setLoading(false);
        return;
      }
      setAntiguo(snapRes.snapshot);

      // La versión "actual" es la más reciente (v más alta) — si hay sólo 1 snapshot
      // usamos sus datos como proxy del estado actual del editor.
      if (versRes.success && versRes.versiones && versRes.versiones.length > 0) {
        const masReciente = versRes.versiones[0]; // ya vienen ordenadas DESC
        if (masReciente.id !== snapshotId) {
          // Cargar el snapshot más reciente como "actual"
          getDetalleVersion(masReciente.id).then((latestRes) => {
            if (latestRes.success && latestRes.snapshot?.data) {
              setActual(latestRes.snapshot.data);
              setActualMeta({ version: latestRes.snapshot.version, created_at: latestRes.snapshot.created_at });
            }
            setLoading(false);
          });
          return;
        }
      }
      // Si el snapshot solicitado es el único o el más reciente, comparar consigo mismo como fallback
      setActual(snapRes.snapshot.data ?? null);
      setActualMeta({ version: snapRes.snapshot.version, created_at: snapRes.snapshot.created_at });
      setLoading(false);
    });
  }, [snapshotId, budgetId]);

  const diffs = useMemo((): ActividadDiff[] => {
    if (!antiguo?.data || !actual) return [];
    const antiguasFlat  = antiguo.data.capitulos.flatMap((c) => c.actividades);
    const nuevasFlat    = actual.capitulos.flatMap((c) => c.actividades);
    return diffActividades(antiguasFlat, nuevasFlat);
  }, [antiguo, actual]);

  const totalesDiff = useMemo(() => {
    if (!antiguo?.data || !actual) return null;
    const cdAntiguo = new Decimal(antiguo.data.costo_directo ?? 0);
    const cdActual  = new Decimal(actual.costo_directo ?? 0);
    const toAntiguo = calcTotalOferta(antiguo.data);
    const toActual  = calcTotalOferta(actual);
    return {
      cdAntiguo, cdActual, deltaCd: cdActual.minus(cdAntiguo),
      toAntiguo, toActual, deltaTo: toActual.minus(toAntiguo),
    };
  }, [antiguo, actual]);

  const countBadge = useMemo(() => {
    const igual   = diffs.filter((d) => d.estado === 'igual').length;
    const cambio  = diffs.filter((d) => d.estado === 'precio_distinto').length;
    const solAnt  = diffs.filter((d) => d.estado === 'solo_antigua').length;
    const solNva  = diffs.filter((d) => d.estado === 'solo_nueva').length;
    return { igual, cambio, solAnt, solNva };
  }, [diffs]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E4DE] shrink-0">
          <div>
            <h2 className="text-lg font-bold text-[#1C1814]">Comparar versiones</h2>
            <p className="text-sm text-stone-500 mt-0.5">
              Diferencias actividad por actividad entre las dos versiones seleccionadas.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#F5F2EE] transition-colors text-stone-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {loading && (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
            </div>
          )}

          {error && <div className="text-center py-16 text-red-500">{error}</div>}

          {!loading && !error && antiguo && actual && (
            <>
              {/* Leyenda */}
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#E8E4DE] text-stone-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-200 inline-block" />
                  Sin cambios ({countBadge.igual})
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                  Precio distinto ({countBadge.cambio})
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
                  Eliminada ({countBadge.solAnt})
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-green-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />
                  Nueva ({countBadge.solNva})
                </span>
              </div>

              {/* Tabla comparación */}
              <div className="rounded-xl border border-[#E8E4DE] overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#F5F2EE] text-xs uppercase tracking-wide text-stone-500 border-b border-[#E8E4DE]">
                      <th className="px-3 py-3 text-left font-semibold w-1/2 border-r border-[#E8E4DE]">
                        v{antiguo.version} — {formatearFechaCorta(antiguo.created_at)}
                      </th>
                      <th className="px-3 py-3 text-left font-semibold w-1/2">
                        {actualMeta
                          ? `v${actualMeta.version} — ${formatearFechaCorta(actualMeta.created_at)}`
                          : 'Versión actual'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {diffs.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-4 py-8 text-center text-stone-400 text-sm">
                          Las dos versiones son idénticas.
                        </td>
                      </tr>
                    ) : (
                      diffs.map((d, i) => <FilaDiff key={i} diff={d} />)
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer totales */}
              {totalesDiff && (
                <div className="rounded-xl border border-[#E8E4DE] overflow-hidden">
                  <div className="bg-[#F5F2EE] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Comparativa de totales
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-stone-400 border-b border-[#F0EDE8]">
                        <th className="px-4 py-2 text-left font-medium">Concepto</th>
                        <th className="px-4 py-2 text-right font-medium">v{antiguo.version}</th>
                        <th className="px-4 py-2 text-right font-medium">
                          {actualMeta ? `v${actualMeta.version}` : 'Actual'}
                        </th>
                        <th className="px-4 py-2 text-right font-medium">Diferencia</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-[#F0EDE8]">
                        <td className="px-4 py-2.5 text-stone-700">Costo Directo</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{formatearCOP(totalesDiff.cdAntiguo.toNumber())}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{formatearCOP(totalesDiff.cdActual.toNumber())}</td>
                        <td className="px-4 py-2.5 text-right">
                          <DeltaBadge delta={totalesDiff.deltaCd.toNumber()} />
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-semibold text-[#1C1814]">Total Oferta</td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{formatearCOP(totalesDiff.toAntiguo.toNumber())}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{formatearCOP(totalesDiff.toActual.toNumber())}</td>
                        <td className="px-4 py-2.5 text-right">
                          <DeltaBadge delta={totalesDiff.deltaTo.toNumber()} />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
