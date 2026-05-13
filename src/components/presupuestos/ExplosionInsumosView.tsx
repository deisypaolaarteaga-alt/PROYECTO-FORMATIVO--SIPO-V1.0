'use client';

import { useState, useEffect } from 'react';
import {
  Package, Hammer, Truck, Wrench, Shield,
  ShoppingCart, AlertCircle, TrendingUp
} from 'lucide-react';
import { getExplosionInsumos } from '@/actions/insumos';
import { Skeleton, SkeletonTable } from '@/components/shared/Skeleton';
import { formatearCOP } from '@/lib/utils/formato-cop';
import { cn } from '@/lib/utils';
import type { ExplosionInsumos, InsumoExplotado, TipoAPUItem } from '@/types';

// ── Configuración visual por tipo de insumo ──────────────────────────────────

const TIPO_CONFIG: Record<TipoAPUItem, {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  material:          { label: 'Materiales',        Icon: Package, color: 'text-burn-orange',  bgColor: 'bg-burn-pale',  borderColor: 'border-burn-orange/30' },
  mano_obra:         { label: 'Mano de Obra',       Icon: Hammer,  color: 'text-steel-mid',    bgColor: 'bg-steel-fog',  borderColor: 'border-steel-mid/30'   },
  equipo:            { label: 'Equipos',            Icon: Truck,   color: 'text-success-text', bgColor: 'bg-success-bg', borderColor: 'border-success-border' },
  herramienta_menor: { label: 'Herramienta Menor',  Icon: Wrench,  color: 'text-warning-text', bgColor: 'bg-warning-bg', borderColor: 'border-warning-border' },
  epp:               { label: 'EPP',                Icon: Shield,  color: 'text-stone',        bgColor: 'bg-sand',       borderColor: 'border-concrete'       },
};

const ORDEN_TIPOS: TipoAPUItem[] = ['material', 'mano_obra', 'equipo', 'herramienta_menor', 'epp'];

// ── Componente principal ──────────────────────────────────────────────────────

interface Props {
  budgetId: string;
}

export function ExplosionInsumosView({ budgetId }: Props) {
  const [data, setData]       = useState<ExplosionInsumos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);

    const load = async () => {
      try {
        const result = await getExplosionInsumos(budgetId);
        if (cancelled) return;
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.error ?? 'Error al cargar la explosión de insumos.');
        }
      } catch (err) {
        if (cancelled) return;
        console.error('[ExplosionInsumosView]', err);
        setError('Error inesperado al cargar los insumos. Intenta de nuevo.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [budgetId]);

  if (loading) return <ExplosionSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-full bg-danger-bg flex items-center justify-center">
          <AlertCircle className="h-6 w-6 text-danger-text" />
        </div>
        <p className="text-sm text-danger-text font-medium">{error}</p>
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-14 h-14 rounded-xl bg-sand border border-concrete flex items-center justify-center">
          <Package className="h-7 w-7 text-mortar" />
        </div>
        <div>
          <p className="font-semibold text-ink">Aún no hay insumos para mostrar</p>
          <p className="text-sm text-stone mt-1 max-w-xs">
            Agrega actividades con APU desde la pestaña{' '}
            <span className="font-medium text-ink">Estructura</span>{' '}
            del presupuesto para ver la explosión de materiales aquí.
          </p>
        </div>
      </div>
    );
  }

  // Agrupar items por tipo
  const porTipo = new Map<TipoAPUItem, InsumoExplotado[]>();
  for (const item of data.items) {
    const arr = porTipo.get(item.tipo) ?? [];
    arr.push(item);
    porTipo.set(item.tipo, arr);
  }

  const tiposPresentes = ORDEN_TIPOS.filter(t => (porTipo.get(t)?.length ?? 0) > 0);

  return (
    <div className="space-y-6">

      {/* Encabezado informativo */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink">Explosión de Insumos</h2>
          <p className="text-xs text-stone mt-0.5">
            {data.items.length} insumos únicos · todos los APUs del presupuesto consolidados
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-stone uppercase tracking-wider font-medium">Costo Directo Total</p>
          <p className="text-xl font-bold text-ink">{formatearCOP(data.totales.gran_total)}</p>
        </div>
      </div>

      {/* Tabla por categoría */}
      {tiposPresentes.map(tipo => (
        <CategoriaTable
          key={tipo}
          tipo={tipo}
          items={porTipo.get(tipo)!}
          subtotal={data.totales[tipo]}
        />
      ))}

      {/* Tarjeta Gran Total */}
      <GranTotalCard data={data} tiposPresentes={tiposPresentes} />

    </div>
  );
}

// ── Tabla por categoría ───────────────────────────────────────────────────────

function CategoriaTable({
  tipo,
  items,
  subtotal,
}: {
  tipo: TipoAPUItem;
  items: InsumoExplotado[];
  subtotal: number;
}) {
  const cfg = TIPO_CONFIG[tipo];
  const { Icon } = cfg;
  const esMaterial = tipo === 'material';

  return (
    <div className={cn('rounded-xl border overflow-hidden', cfg.borderColor)}>

      {/* Header de categoría */}
      <div className={cn('px-6 py-4 flex items-center justify-between', cfg.bgColor)}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center">
            <Icon className={cn('h-4 w-4', cfg.color)} />
          </div>
          <span className={cn('font-semibold text-sm uppercase tracking-wider', cfg.color)}>
            {cfg.label}
          </span>
          <span className="text-xs text-stone font-medium bg-white/70 px-2 py-0.5 rounded-full">
            {items.length} {items.length === 1 ? 'ítem' : 'ítems'}
          </span>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-stone uppercase tracking-wider font-medium">Subtotal</p>
          <p className={cn('text-base font-bold tabular-nums', cfg.color)}>{formatearCOP(subtotal)}</p>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-concrete">
            <tr className="text-xs text-stone uppercase tracking-wider">
              <th className="px-6 py-3 text-left font-medium">Descripción</th>
              <th className="px-4 py-3 text-left font-medium w-20">Unidad</th>
              <th className="px-4 py-3 text-right font-medium w-36">Cantidad Total</th>
              <th className="px-4 py-3 text-right font-medium w-36">Precio Unit.</th>
              <th className="px-4 py-3 text-right font-medium w-40">Total</th>
              {esMaterial && <th className="px-4 py-3 w-44" />}
            </tr>
          </thead>

          <tbody className="divide-y divide-sand">
            {items.map((item, idx) => (
              <FilaInsumo key={idx} item={item} mostrarAccion={esMaterial} />
            ))}
          </tbody>

          <tfoot>
            <tr className={cn('border-t-2 border-concrete/60', cfg.bgColor)}>
              <td
                colSpan={4}
                className="px-6 py-3 text-xs font-semibold text-stone uppercase tracking-wider"
              >
                Subtotal {cfg.label}
              </td>
              <td className={cn('px-4 py-3 text-right font-bold tabular-nums', cfg.color)}>
                {formatearCOP(subtotal)}
              </td>
              {esMaterial && <td />}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ── Fila individual ───────────────────────────────────────────────────────────

function FilaInsumo({
  item,
  mostrarAccion,
}: {
  item: InsumoExplotado;
  mostrarAccion: boolean;
}) {
  return (
    <tr className="hover:bg-sand/60 transition-colors duration-100 group">
      <td className="px-6 py-3.5">
        <span className="text-ink font-medium">{item.nombre}</span>
      </td>
      <td className="px-4 py-3.5">
        <span className="text-stone text-xs font-medium bg-sand border border-concrete px-2 py-0.5 rounded">
          {item.unidad}
        </span>
      </td>
      <td className="px-4 py-3.5 text-right text-ink font-semibold tabular-nums">
        {item.cantidad_total.toLocaleString('es-CO', { maximumFractionDigits: 4 })}
      </td>
      <td className="px-4 py-3.5 text-right text-stone tabular-nums">
        {formatearCOP(item.precio_unitario)}
      </td>
      <td className="px-4 py-3.5 text-right font-bold text-ink tabular-nums">
        {formatearCOP(item.subtotal_total)}
      </td>
      {mostrarAccion && (
        <td className="px-4 py-3.5 text-right">
          <button
            className={cn(
              'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
              'flex items-center gap-1.5 ml-auto',
              'text-xs font-medium text-steel-mid hover:text-burn-orange',
              'border border-concrete hover:border-burn-orange/50',
              'rounded-lg px-3 py-1.5 bg-white',
              'whitespace-nowrap'
            )}
            title="Próximamente: generar orden de compra para este material"
          >
            <ShoppingCart className="h-3 w-3 shrink-0" />
            Orden de Compra
          </button>
        </td>
      )}
    </tr>
  );
}

// ── Tarjeta Gran Total ────────────────────────────────────────────────────────

function GranTotalCard({
  data,
  tiposPresentes,
}: {
  data: ExplosionInsumos;
  tiposPresentes: TipoAPUItem[];
}) {
  return (
    <div className="bg-ink rounded-xl p-6 text-white">
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white/90 uppercase tracking-wider">
              Gran Total — Costos Directos
            </p>
            <p className="text-xs text-white/50 mt-0.5">
              Suma consolidada de todos los insumos del presupuesto
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-3xl font-bold tabular-nums leading-none">
            {formatearCOP(data.totales.gran_total)}
          </p>
        </div>
      </div>

      {/* Breakdown por tipo */}
      <div className="mt-5 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {tiposPresentes.map(tipo => {
          const cfg = TIPO_CONFIG[tipo];
          const { Icon } = cfg;
          const pct = data.totales.gran_total > 0
            ? ((data.totales[tipo] / data.totales.gran_total) * 100).toFixed(1)
            : '0.0';

          return (
            <div key={tipo} className="bg-white/5 rounded-lg p-3 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-white/50 shrink-0" />
                <span className="text-[10px] font-medium text-white/60 uppercase tracking-wider truncate">
                  {cfg.label}
                </span>
              </div>
              <p className="text-sm font-bold tabular-nums">
                {formatearCOP(data.totales[tipo])}
              </p>
              <div className="flex items-center gap-1.5">
                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-burn-orange/70 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[10px] text-white/40 tabular-nums">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Skeleton de carga ─────────────────────────────────────────────────────────

function ExplosionSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-64" />
        </div>
        <div className="space-y-1 text-right">
          <Skeleton className="h-3 w-28 ml-auto" />
          <Skeleton className="h-6 w-36 ml-auto" />
        </div>
      </div>

      {/* Categorías skeleton */}
      {[6, 4, 2].map((rows, i) => (
        <div key={i} className="rounded-xl border border-concrete overflow-hidden">
          <div className="bg-sand px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
            <div className="space-y-1.5 text-right">
              <Skeleton className="h-3 w-16 ml-auto" />
              <Skeleton className="h-5 w-24 ml-auto" />
            </div>
          </div>
          <div className="bg-white p-4">
            <SkeletonTable rows={rows} cols={5} />
          </div>
        </div>
      ))}

      {/* Gran Total skeleton */}
      <Skeleton className="h-40 rounded-xl" />
    </div>
  );
}
