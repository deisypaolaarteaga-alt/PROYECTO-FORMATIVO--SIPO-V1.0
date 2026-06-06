'use client';

import { useState, useEffect } from 'react';
import Decimal from 'decimal.js';
import { formatearCOP } from '@/lib/utils/formato-cop';
import { getEstrategiaFinanciera } from '@/actions/presupuestos';

interface Props {
  budgetId: string;
}

interface MaterialItem {
  nombre: string;
  unidad: string;
  cantidad: number;
  precio_unitario: number;
}

interface MaterialTop {
  nombre: string;
  costoTotal: number;
  pctImpacto: number;
  riesgoInflacion: number;
  ahorroPotencial: number;
}

const ESCENARIOS = [
  {
    nombre:    'Óptimo',
    pct:       15,
    badgeCls:  'bg-emerald-100 text-emerald-700 border-emerald-300',
    activeCls: 'border-emerald-400 bg-emerald-50',
  },
  {
    nombre:    'Competitivo',
    pct:       10,
    badgeCls:  'bg-blue-100 text-blue-700 border-blue-300',
    activeCls: 'border-blue-400 bg-blue-50',
  },
  {
    nombre:    'Límite',
    pct:       5,
    badgeCls:  'bg-amber-100 text-amber-700 border-amber-300',
    activeCls: 'border-amber-400 bg-amber-50',
  },
  {
    nombre:    'Equilibrio',
    pct:       0,
    badgeCls:  'bg-red-100 text-red-700 border-red-300',
    activeCls: 'border-red-400 bg-red-50',
  },
] as const;

function calcEscenario(CD: Decimal, pct: number) {
  const f = new Decimal(pct).div(100);
  return {
    precioVenta:  CD.mul(new Decimal(1).add(f)).toDecimalPlaces(0).toNumber(),
    utilidadNeta: CD.mul(f).toDecimalPlaces(0).toNumber(),
  };
}

function buildTop5(items: MaterialItem[], costoDirecto: number): MaterialTop[] {
  const map = new Map<string, { nombre: string; total: Decimal }>();
  const CD  = new Decimal(costoDirecto);

  for (const it of items) {
    const costo = new Decimal(it.cantidad).mul(new Decimal(it.precio_unitario));
    const clave = it.nombre.toLowerCase().trim();
    const prev  = map.get(clave);
    if (prev) {
      prev.total = prev.total.add(costo);
    } else {
      map.set(clave, { nombre: it.nombre, total: costo });
    }
  }

  return [...map.values()]
    .sort((a, b) => b.total.comparedTo(a.total))
    .slice(0, 5)
    .map(g => ({
      nombre:          g.nombre,
      costoTotal:      g.total.toDecimalPlaces(0).toNumber(),
      pctImpacto:      CD.greaterThan(0)
        ? g.total.div(CD).mul(100).toDecimalPlaces(1).toNumber()
        : 0,
      riesgoInflacion: g.total.mul(new Decimal('0.10')).toDecimalPlaces(0).toNumber(),
      ahorroPotencial: g.total.mul(new Decimal('0.05')).toDecimalPlaces(0).toNumber(),
    }));
}

function truncar(s: string, max = 30): string {
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

export function EstrategiaFinancieraTab({ budgetId }: Props) {
  const [costoDirecto, setCostoDirecto] = useState(0);
  const [items, setItems]               = useState<MaterialItem[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [margenInput, setMargenInput]   = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setItems([]);

    getEstrategiaFinanciera(budgetId).then(res => {
      if (cancelled) return;
      if (res.success && res.data) {
        setCostoDirecto(res.data.costoDirecto);
        setItems(res.data.items);
      } else {
        setError(res.error ?? 'Error al cargar la estrategia financiera.');
      }
      setLoading(false);
    }).catch(() => {
      if (!cancelled) { setError('Error inesperado.'); setLoading(false); }
    });

    return () => { cancelled = true; };
  }, [budgetId]);

  const CD           = new Decimal(costoDirecto);
  const margenNum    = parseFloat(margenInput);
  const margenValido = !isNaN(margenNum) && margenInput.trim() !== '';

  const escActivo = margenValido
    ? ESCENARIOS.reduce((prev, curr) =>
        Math.abs(curr.pct - margenNum) < Math.abs(prev.pct - margenNum) ? curr : prev
      )
    : null;

  const top5   = buildTop5(items, costoDirecto);
  const maxPct = top5.length > 0 ? Math.max(...top5.map(m => m.pctImpacto), 1) : 1;

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[0, 1].map(i => (
          <div key={i} className="bg-white rounded-xl border border-[#E8E4DE] p-6 space-y-4 animate-pulse">
            <div className="h-3 w-36 bg-[#E8E4DE] rounded" />
            <div className="h-3 w-48 bg-[#F0EDE8] rounded" />
            <div className="space-y-3 pt-2">
              {[0, 1, 2, 3].map(j => (
                <div key={j} className="h-20 bg-[#F5F2EE] rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 text-stone">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

      {/* ── IZQUIERDA: Simulador de Margen ─────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#E8E4DE] p-6 space-y-5">
        <div>
          <h2 className="text-xs font-bold text-[#1C1814] uppercase tracking-widest">
            Simulador de Margen
          </h2>
          <p className="text-xs text-stone mt-1">
            Costo directo:{' '}
            <span className="font-semibold text-[#1C1814]">{formatearCOP(costoDirecto)}</span>
          </p>
        </div>

        {/* 4 tarjetas de escenarios */}
        <div className="space-y-3">
          {ESCENARIOS.map(esc => {
            const res    = calcEscenario(CD, esc.pct);
            const activo = escActivo?.nombre === esc.nombre;
            return (
              <div
                key={esc.nombre}
                className={`rounded-lg border-2 p-4 transition-all duration-200 ${
                  activo ? esc.activeCls : 'border-[#E8E4DE] bg-white'
                }`}
              >
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border mb-2 ${esc.badgeCls}`}>
                  {esc.nombre} — {esc.pct}%
                </span>
                <div>
                  <p className="text-[10px] text-stone uppercase tracking-wide">
                    Precio de venta sugerido
                  </p>
                  <p
                    className="text-2xl font-black text-[#1C1814] tabular-nums leading-tight"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {formatearCOP(res.precioVenta)}
                  </p>
                </div>
                <p className="text-xs text-stone mt-1">
                  Utilidad neta:{' '}
                  <span className="font-semibold text-[#1C1814]">{formatearCOP(res.utilidadNeta)}</span>
                </p>
              </div>
            );
          })}
        </div>

        {/* Input personalizado */}
        <div className="border-t border-[#E8E4DE] pt-4 space-y-3">
          <label className="block text-[10px] font-bold text-stone uppercase tracking-widest">
            Simula tu propio margen
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={margenInput}
              onChange={e => setMargenInput(e.target.value)}
              placeholder="ej: 8"
              className="w-full h-10 bg-[#F5F2EE] border border-[#E8E4DE] rounded-lg px-3 focus:ring-1 focus:ring-[#C84B1A]/40 font-semibold text-sm text-[#1C1814]"
            />
            <span className="text-sm font-semibold text-[#6B7A8D] shrink-0">%</span>
          </div>
          {margenValido && (
            <div className="bg-[#FAF0EB] rounded-lg border border-[#C84B1A]/20 p-3 space-y-0.5">
              <p className="text-[10px] text-stone uppercase tracking-wide">Con {margenNum}% de margen</p>
              <p
                className="text-xl font-bold text-[#1C1814] tabular-nums"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {formatearCOP(calcEscenario(CD, margenNum).precioVenta)}
              </p>
              <p className="text-xs text-stone">
                Utilidad neta:{' '}
                <span className="font-semibold text-[#1C1814]">
                  {formatearCOP(calcEscenario(CD, margenNum).utilidadNeta)}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── DERECHA: Top 5 Materiales Críticos ─────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#E8E4DE] p-6 space-y-5">
        <h2 className="text-xs font-bold text-[#1C1814] uppercase tracking-widest">
          Top 5 Materiales Críticos
        </h2>

        {top5.length === 0 ? (
          <div className="text-center py-10 space-y-1">
            <p className="text-sm text-stone">Sin materiales registrados en los APUs.</p>
            <p className="text-xs text-stone/60">
              Agrega ítems de tipo material en el panel APU para ver el análisis.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-5">
              {top5.map((mat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="text-sm font-medium text-[#1C1814] truncate"
                      title={mat.nombre}
                    >
                      {truncar(mat.nombre)}
                    </span>
                    <span className="text-xs font-bold text-[#E8571A] shrink-0 tabular-nums">
                      {mat.pctImpacto}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-[#F5F2EE] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width:           `${maxPct > 0 ? (mat.pctImpacto / maxPct) * 100 : 0}%`,
                        backgroundColor: '#E8571A',
                        transition:      'width 0.5s ease-out',
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-stone">
                    Riesgo +10%:{' '}
                    <span className="font-semibold text-[#C84B1A]">+{formatearCOP(mat.riesgoInflacion)}</span>
                  </p>
                </div>
              ))}
            </div>

            {/* Estrategia de compra */}
            <div
              className="rounded-lg p-4 space-y-2"
              style={{ backgroundColor: '#FFF8F5', border: '1px solid #E8571A' }}
            >
              <p className="text-[11px] font-bold text-[#1C1814]">
                💡 Estrategia de compra
              </p>
              <p className="text-xs text-[#374151] leading-relaxed">
                El material <strong>{truncar(top5[0].nombre)}</strong> representa
                el <strong>{top5[0].pctImpacto}%</strong> de tu costo directo.
                Si negocias un descuento del 5% con tu proveedor, tu utilidad aumenta
                automáticamente en <strong>{formatearCOP(top5[0].ahorroPotencial)}</strong> sin
                subirle el precio a tu cliente.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
