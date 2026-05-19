'use client';

import { useState, useEffect, useMemo } from 'react';
import { HardHat, Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Card } from '@/components/shared/Card';
import { Input } from '@/components/shared/Input';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonTable } from '@/components/shared/Skeleton';
import { formatearCOP } from '@/lib/utils/formato-cop';
import { getTrabajadoresReferencia, type TrabajadorReferencia } from '@/actions/mano-obra';
import { cn } from '@/lib/utils';

type ColKey = 'especialidad' | 'categoria' | 'jornal_base' | 'factor_prestacional' | 'costo_hora';
type SortDir = 'asc' | 'desc';

const COLS: { key: ColKey; label: string; align: 'left' | 'right' }[] = [
  { key: 'especialidad',       label: 'Especialidad',            align: 'left'  },
  { key: 'categoria',          label: 'Categoría',               align: 'left'  },
  { key: 'jornal_base',        label: 'Jornal base',             align: 'right' },
  { key: 'factor_prestacional',label: 'Factor prestacional',     align: 'right' },
  { key: 'costo_hora',         label: 'Costo / hora',            align: 'right' },
];

function SortIcon({ col, sortCol, sortDir }: { col: ColKey; sortCol: ColKey; sortDir: SortDir }) {
  if (col !== sortCol) return <ChevronsUpDown className="h-3.5 w-3.5 text-concrete" />;
  return sortDir === 'asc'
    ? <ChevronUp className="h-3.5 w-3.5 text-burn-orange" />
    : <ChevronDown className="h-3.5 w-3.5 text-burn-orange" />;
}

function valorOrden(t: TrabajadorReferencia, col: ColKey): string | number {
  if (col === 'costo_hora') return t.jornal_con_prestaciones / 8;
  return t[col as keyof TrabajadorReferencia] as string | number;
}

export default function ManoObraPage() {
  const [trabajadores, setTrabajadores] = useState<TrabajadorReferencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<ColKey>('especialidad');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  useEffect(() => {
    getTrabajadoresReferencia().then((data) => {
      setTrabajadores(data);
      setLoading(false);
    });
  }, []);

  function toggleSort(col: ColKey) {
    if (col === sortCol) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  }

  const filas = useMemo(() => {
    const filtrado = search.trim()
      ? trabajadores.filter((t) =>
          t.especialidad.toLowerCase().includes(search.toLowerCase()) ||
          t.categoria.toLowerCase().includes(search.toLowerCase())
        )
      : trabajadores;

    return [...filtrado].sort((a, b) => {
      const va = valorOrden(a, sortCol);
      const vb = valorOrden(b, sortCol);
      const cmp = typeof va === 'string' ? va.localeCompare(vb as string) : (va as number) - (vb as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [trabajadores, search, sortCol, sortDir]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-burn-orange/10">
          <HardHat className="h-5 w-5 text-burn-orange" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-charcoal">Mano de Obra</h1>
          <p className="text-sm text-steel-mid">
            Referencia salarial Colombia 2025 · Solo lectura
          </p>
        </div>
      </div>

      <Card>
        {/* Buscador */}
        <div className="p-4 border-b border-concrete">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-steel-mid pointer-events-none" />
            <Input
              placeholder="Buscar por especialidad o categoría…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="p-4">
            <SkeletonTable rows={8} cols={5} />
          </div>
        ) : filas.length === 0 ? (
          <EmptyState
            title="Sin resultados"
            description={search ? 'No hay trabajadores que coincidan con la búsqueda.' : 'No hay trabajadores registrados.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-sand/40 border-b border-concrete">
                  {COLS.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => toggleSort(col.key)}
                      className={cn(
                        'px-4 py-3 font-medium text-steel-mid cursor-pointer select-none',
                        'hover:text-charcoal transition-colors whitespace-nowrap',
                        col.align === 'right' ? 'text-right' : 'text-left',
                      )}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {col.align === 'right' && <SortIcon col={col.key} sortCol={sortCol} sortDir={sortDir} />}
                        {col.label}
                        {col.align === 'left' && <SortIcon col={col.key} sortCol={sortCol} sortDir={sortDir} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-concrete/50">
                {filas.map((t) => {
                  const costoPrestaciones = t.jornal_con_prestaciones;
                  const costoHora = costoPrestaciones / 8;
                  return (
                    <tr key={t.id} className="hover:bg-sand/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-charcoal">{t.especialidad}</td>
                      <td className="px-4 py-3 text-steel-mid">{t.categoria}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-charcoal">
                        {formatearCOP(t.jornal_base)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span className="inline-flex items-center justify-end gap-1">
                          <span className="text-charcoal">{(t.factor_prestacional * 100).toFixed(2)}</span>
                          <span className="text-steel-mid text-xs">%</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span className="font-semibold text-burn-orange">
                          {formatearCOP(costoHora)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Footer con conteo */}
            <div className="px-4 py-2.5 border-t border-concrete bg-sand/20 text-xs text-steel-mid">
              {filas.length === trabajadores.length
                ? `${trabajadores.length} trabajadores`
                : `${filas.length} de ${trabajadores.length} trabajadores`}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
