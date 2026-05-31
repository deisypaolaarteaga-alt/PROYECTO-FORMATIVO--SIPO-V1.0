'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  HardHat, Search, ChevronUp, ChevronDown, ChevronsUpDown,
  Download, Plus, Layers, CheckCircle2, AlertCircle, ExternalLink,
  Power, PowerOff, Loader2, Edit2, UserPlus, Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/shared/Card';
import { Input } from '@/components/shared/Input';
import { Button } from '@/components/shared/Button';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonTable } from '@/components/shared/Skeleton';
import {
  Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter,
} from '@/components/shared/Modal';
import { ModalTrabajador } from '@/components/mano-obra/ModalTrabajador';
import { formatearCOP } from '@/lib/utils/formato-cop';
import {
  getTrabajadoresReferencia,
  toggleTrabajadorUsuario,
  prepararTrabajadorParaEdicion,
  eliminarTrabajador,
  type TrabajadorReferencia,
} from '@/actions/mano-obra';
import { getCuadrillas, agregarTrabajadorACuadrilla } from '@/actions/cuadrillas';
import { cn } from '@/lib/utils';

type ColKey = 'especialidad' | 'categoria' | 'jornal_base' | 'factor_prestacional' | 'costo_hora';
type SortDir = 'asc' | 'desc';

const COLS: { key: ColKey; label: string; align: 'left' | 'right' }[] = [
  { key: 'especialidad',        label: 'Especialidad',         align: 'left'  },
  { key: 'categoria',           label: 'Categoría',            align: 'left'  },
  { key: 'jornal_base',         label: 'Jornal base',          align: 'right' },
  { key: 'factor_prestacional', label: 'Factor prestacional',  align: 'right' },
  { key: 'costo_hora',          label: 'Costo / hora',         align: 'right' },
];

const CATEGORIAS: { key: string; label: string }[] = [
  { key: 'director',    label: 'Director'    },
  { key: 'residente',   label: 'Residente'   },
  { key: 'maestro',     label: 'Maestro'     },
  { key: 'oficial',     label: 'Oficial'     },
  { key: 'ayudante',    label: 'Ayudante'    },
  { key: 'especialista',label: 'Especialista'},
];

type CuadrillaBasica = { id: string; nombre: string; categoria_actividad: string | null };

function SortIcon({ col, sortCol, sortDir }: { col: ColKey; sortCol: ColKey; sortDir: SortDir }) {
  if (col !== sortCol) return <ChevronsUpDown className="h-3.5 w-3.5 text-white/40" />;
  return sortDir === 'asc'
    ? <ChevronUp className="h-3.5 w-3.5 text-[#E8956A]" />
    : <ChevronDown className="h-3.5 w-3.5 text-[#E8956A]" />;
}

function valorOrden(t: TrabajadorReferencia, col: ColKey): string | number {
  if (col === 'costo_hora') return t.jornal_con_prestaciones / 8;
  return t[col as keyof TrabajadorReferencia] as string | number;
}

function exportarCSV(filas: TrabajadorReferencia[]) {
  const headers = [
    'Especialidad', 'Categoría', 'Tipo', 'Jornal base (COP)',
    'Factor prestacional (%)', 'Jornal c/prestaciones (COP)', 'Costo/hora (COP)',
  ];
  const rows = filas.map((t) => [
    `"${t.especialidad}"`,
    `"${t.categoria}"`,
    t.user_id ? '"Propio"' : '"Referencia"',
    t.jornal_base.toFixed(2),
    (t.factor_prestacional * 100).toFixed(2),
    t.jornal_con_prestaciones.toFixed(2),
    (t.jornal_con_prestaciones / 8).toFixed(2),
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `trabajadores-sipo-2026.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ManoObraPage() {
  const [trabajadores, setTrabajadores] = useState<TrabajadorReferencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null);
  const [sortCol, setSortCol] = useState<ColKey>('especialidad');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [mostrarInactivos, setMostrarInactivos] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [preparandoEdicion, setPreparandoEdicion] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState<string | null>(null);

  // Modal crear/editar trabajador propio
  const [modalTrabajador, setModalTrabajador] = useState<
    { open: true; trabajador?: TrabajadorReferencia } | { open: false }
  >({ open: false });

  // Modal agregar a cuadrilla
  const [trabajadorModal, setTrabajadorModal] = useState<TrabajadorReferencia | null>(null);
  const [cuadrillas, setCuadrillas] = useState<CuadrillaBasica[]>([]);
  const [loadingCuadrillas, setLoadingCuadrillas] = useState(false);
  const [cuadrillaId, setCuadrillaId] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [guardando, setGuardando] = useState(false);
  const [resultadoModal, setResultadoModal] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    getTrabajadoresReferencia().then((data) => {
      setTrabajadores(data);
      setLoading(false);
    });
  }, []);

  const abrirModalCuadrilla = useCallback(async (t: TrabajadorReferencia) => {
    setTrabajadorModal(t);
    setCuadrillaId('');
    setCantidad(1);
    setResultadoModal(null);
    setLoadingCuadrillas(true);
    const data = await getCuadrillas();
    setCuadrillas(
      data
        .filter((c) => !c.es_sistema)
        .map((c) => ({ id: c.id, nombre: c.nombre, categoria_actividad: c.categoria_actividad }))
    );
    setLoadingCuadrillas(false);
  }, []);

  const cerrarModalCuadrilla = useCallback(() => {
    setTrabajadorModal(null);
    setResultadoModal(null);
  }, []);

  async function handleAgregar() {
    if (!trabajadorModal || !cuadrillaId) return;
    setGuardando(true);
    const res = await agregarTrabajadorACuadrilla(cuadrillaId, trabajadorModal.id, cantidad);
    setGuardando(false);
    setResultadoModal(
      res.success
        ? { ok: true, msg: 'Trabajador agregado a la cuadrilla.' }
        : { ok: false, msg: res.error ?? 'Error desconocido' }
    );
  }

  async function handleToggle(t: TrabajadorReferencia) {
    setToggling(t.id);
    let target = t;

    if (!t.user_id) {
      const res = await prepararTrabajadorParaEdicion(t.id);
      if (!res.success || !res.data) { setToggling(null); return; }
      const copia = res.data;
      setTrabajadores((prev) => {
        const sinRef = prev.filter(
          (w) => !(w.user_id === null && w.especialidad.toLowerCase() === copia.especialidad.toLowerCase())
        );
        const yaExiste = sinRef.some((w) => w.id === copia.id);
        return yaExiste ? sinRef : [...sinRef, copia];
      });
      target = copia;
      setToggling(copia.id);
    }

    const res = await toggleTrabajadorUsuario(target.id, !target.activo);
    setToggling(null);
    if (res.success) {
      setTrabajadores((prev) =>
        prev.map((w) => (w.id === target.id ? { ...w, activo: !target.activo } : w))
      );
    }
  }

  async function handleEliminar(t: TrabajadorReferencia) {
    if (!t.user_id) return;
    if (!confirm(`¿Eliminar "${t.especialidad}"? Esta acción no se puede deshacer.`)) return;
    setEliminando(t.id);
    const res = await eliminarTrabajador(t.id);
    setEliminando(null);
    if (res.success) {
      setTrabajadores((prev) => prev.filter((w) => w.id !== t.id));
    }
  }

  async function handleEditar(t: TrabajadorReferencia) {
    if (t.user_id) {
      setModalTrabajador({ open: true, trabajador: t });
      return;
    }
    // Trabajador de referencia: copiar internamente si no existe copia, luego abrir modal
    setPreparandoEdicion(t.id);
    const res = await prepararTrabajadorParaEdicion(t.id);
    setPreparandoEdicion(null);
    if (!res.success || !res.data) return;
    // Reemplazar la fila de referencia con la copia propia en el estado local
    setTrabajadores((prev) => {
      const sinRef = prev.filter(
        (w) => !(w.user_id === null && w.especialidad.toLowerCase() === res.data!.especialidad.toLowerCase())
      );
      const yaExiste = sinRef.some((w) => w.id === res.data!.id);
      return yaExiste ? sinRef : [...sinRef, res.data!];
    });
    setModalTrabajador({ open: true, trabajador: res.data });
  }

  function handleSaved(_nuevo: TrabajadorReferencia) {
    getTrabajadoresReferencia().then(setTrabajadores);
    setModalTrabajador({ open: false });
  }

  function toggleSort(col: ColKey) {
    if (col === sortCol) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  }

  const filas = useMemo(() => {
    let filtrado = mostrarInactivos ? trabajadores : trabajadores.filter((t) => t.activo);
    if (categoriaFiltro) {
      filtrado = filtrado.filter((t) => t.categoria === categoriaFiltro);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      filtrado = filtrado.filter(
        (t) =>
          t.especialidad.toLowerCase().includes(q) ||
          t.categoria.toLowerCase().includes(q)
      );
    }
    return [...filtrado].sort((a, b) => {
      const va = valorOrden(a, sortCol);
      const vb = valorOrden(b, sortCol);
      const cmp = typeof va === 'string' ? va.localeCompare(vb as string) : (va as number) - (vb as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [trabajadores, search, categoriaFiltro, sortCol, sortDir, mostrarInactivos]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-burn-orange/10">
            <HardHat className="h-5 w-5 text-burn-orange" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-charcoal">Mano de Obra</h1>
            <p className="text-sm text-steel-mid">
              Referencia salarial Colombia 2026 · Gestiona tu propio catálogo
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full">
          <button
            onClick={() => setMostrarInactivos((v) => !v)}
            className={cn(
              'w-full sm:w-auto flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
              mostrarInactivos
                ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                : 'bg-sand text-steel-mid border-concrete hover:bg-concrete/60'
            )}
          >
            {mostrarInactivos ? 'Ocultar inactivos' : 'Mostrar inactivos'}
          </button>
          <Button
            variant="secondary"
            size="sm"
            className="w-full sm:w-auto"
            icon={<Download className="h-4 w-4" />}
            onClick={() => exportarCSV(filas)}
            disabled={filas.length === 0}
          >
            Exportar CSV
          </Button>
          <Button
            size="sm"
            className="w-full sm:w-auto"
            icon={<UserPlus className="h-4 w-4" />}
            onClick={() => setModalTrabajador({ open: true })}
          >
            Agregar trabajador
          </Button>
        </div>
      </div>

      <Card>
        {/* Toolbar */}
        <div className="p-4 border-b border-concrete space-y-3">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-steel-mid pointer-events-none" />
            <Input
              placeholder="Buscar por especialidad o categoría…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-steel-mid font-medium shrink-0">Filtrar:</span>
            <button
              onClick={() => setCategoriaFiltro(null)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer',
                categoriaFiltro === null
                  ? 'bg-burn-orange text-white'
                  : 'bg-sand text-steel-mid hover:bg-concrete/60 hover:text-charcoal'
              )}
            >
              Todas
            </button>
            {CATEGORIAS.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategoriaFiltro((prev) => (prev === cat.key ? null : cat.key))}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer',
                  categoriaFiltro === cat.key
                    ? 'bg-burn-orange text-white'
                    : 'bg-sand text-steel-mid hover:bg-concrete/60 hover:text-charcoal'
                )}
              >
                {cat.label}
              </button>
            ))}
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
            description={
              search || categoriaFiltro
                ? 'No hay trabajadores que coincidan con los filtros aplicados.'
                : 'No hay trabajadores registrados.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1A2535] border-b border-[#2A3B50]">
                  {COLS.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => toggleSort(col.key)}
                      className={cn(
                        'px-4 py-3 font-medium text-white/60 cursor-pointer select-none',
                        'hover:text-white transition-colors whitespace-nowrap',
                        col.align === 'right' ? 'text-right' : 'text-left',
                      )}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {col.align === 'right' && (
                          <SortIcon col={col.key} sortCol={sortCol} sortDir={sortDir} />
                        )}
                        {col.label}
                        {col.align === 'left' && (
                          <SortIcon col={col.key} sortCol={sortCol} sortDir={sortDir} />
                        )}
                      </span>
                    </th>
                  ))}
                  <th className="px-4 py-3 w-28 bg-[#1A2535]" />
                </tr>
              </thead>
              <tbody className="divide-y divide-concrete/50">
                {filas.map((t) => {
                  const costoHora = t.jornal_con_prestaciones / 8;
                  const isToggling = toggling === t.id;
                  const esPropio = !!t.user_id;

                  return (
                    <tr
                      key={t.id}
                      className={cn(
                        'hover:bg-sand/20 transition-colors group',
                        !t.activo && 'opacity-50'
                      )}
                    >
                      <td className="px-4 py-3 font-medium text-charcoal">
                        <span className="flex items-center gap-2 flex-wrap">
                          {t.especialidad}
                          {esPropio ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 uppercase tracking-wide">
                              Propio
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#F3F4F6] text-[#6B7280] uppercase tracking-wide">
                              Referencia
                            </span>
                          )}
                          {!t.activo && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700 uppercase tracking-wide">
                              Inactivo
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-sand text-steel-mid capitalize">
                          {t.categoria}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-charcoal" style={{ fontFamily: 'var(--font-mono)' }}>
                        {formatearCOP(t.jornal_base)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span className="inline-flex items-center justify-end gap-1">
                          <span className="text-charcoal">
                            {(t.factor_prestacional * 100).toFixed(2)}
                          </span>
                          <span className="text-steel-mid text-xs">%</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span className="font-semibold text-burn-orange" style={{ fontFamily: 'var(--font-mono)' }}>
                          {formatearCOP(costoHora)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Toggle activo/inactivo — todos */}
                          <button
                            onClick={() => handleToggle(t)}
                            disabled={isToggling}
                            title={t.activo ? 'Inactivar' : 'Activar'}
                            className={cn(
                              'inline-flex items-center justify-center h-7 w-7 rounded-md transition-colors cursor-pointer',
                              t.activo
                                ? 'text-steel-mid hover:text-red-600 hover:bg-red-50'
                                : 'text-red-500 hover:text-green-600 hover:bg-green-50'
                            )}
                          >
                            {isToggling
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : t.activo
                                ? <PowerOff className="h-4 w-4" />
                                : <Power className="h-4 w-4" />
                            }
                          </button>
                          {/* Editar — todos los trabajadores */}
                          <button
                            onClick={() => handleEditar(t)}
                            disabled={preparandoEdicion === t.id}
                            title="Editar"
                            className="inline-flex items-center justify-center h-7 w-7 rounded-md text-steel-mid hover:text-charcoal hover:bg-sand transition-colors cursor-pointer disabled:opacity-40"
                          >
                            {preparandoEdicion === t.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <Edit2 className="h-4 w-4" />
                            }
                          </button>
                          {/* Agregar a cuadrilla — trabajadores activos */}
                          {t.activo && (
                            <button
                              onClick={() => abrirModalCuadrilla(t)}
                              title="Agregar a cuadrilla"
                              className="inline-flex items-center justify-center h-7 w-7 rounded-md text-steel-mid hover:text-burn-orange hover:bg-burn-orange/10 transition-colors cursor-pointer"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          )}
                          {/* Eliminar — solo propios */}
                          {esPropio && (
                            <button
                              onClick={() => handleEliminar(t)}
                              disabled={eliminando === t.id}
                              title="Eliminar"
                              className="inline-flex items-center justify-center h-7 w-7 rounded-md text-steel-mid hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-40"
                            >
                              {eliminando === t.id
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <Trash2 className="h-4 w-4" />
                              }
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-concrete bg-sand/20 text-xs text-steel-mid flex items-center justify-between">
              <span>
                {filas.length === trabajadores.filter((t) => mostrarInactivos || t.activo).length
                  ? `${filas.length} trabajadores`
                  : `${filas.length} de ${trabajadores.filter((t) => mostrarInactivos || t.activo).length} trabajadores`}
              </span>
              <span>
                {trabajadores.filter((t) => !!t.user_id).length} propios ·{' '}
                {trabajadores.filter((t) => !t.user_id).length} referencia
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Modal: Crear / Editar trabajador propio */}
      {modalTrabajador.open && (
        <ModalTrabajador
          trabajador={modalTrabajador.trabajador}
          onClose={() => setModalTrabajador({ open: false })}
          onSaved={handleSaved}
        />
      )}

      {/* Modal: Agregar a cuadrilla */}
      <Modal open={!!trabajadorModal} onOpenChange={(open) => !open && cerrarModalCuadrilla()}>
        <ModalContent className="max-w-md">
          <ModalHeader>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-burn-orange/10">
                <Layers className="h-4 w-4 text-burn-orange" />
              </div>
              <ModalTitle>Agregar a cuadrilla</ModalTitle>
            </div>
            {trabajadorModal && (
              <p className="text-sm text-steel-mid mt-1">
                <span className="font-medium text-charcoal">{trabajadorModal.especialidad}</span>
                {' · '}
                {formatearCOP(trabajadorModal.jornal_con_prestaciones / 8)}/hora
              </p>
            )}
          </ModalHeader>

          {resultadoModal && (
            <div
              className={cn(
                'flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm',
                resultadoModal.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'
              )}
            >
              {resultadoModal.ok
                ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
              <span>{resultadoModal.msg}</span>
            </div>
          )}

          {!resultadoModal && (
            <div className="space-y-4">
              {loadingCuadrillas ? (
                <div className="py-6 text-center text-sm text-steel-mid animate-pulse">
                  Cargando cuadrillas…
                </div>
              ) : cuadrillas.length === 0 ? (
                <div className="rounded-lg border border-concrete bg-sand/30 p-4 space-y-2">
                  <p className="text-sm text-steel-mid">
                    No tienes cuadrillas propias. Crea una primero en el módulo de Insumos.
                  </p>
                  <Link
                    href="/insumos"
                    className="inline-flex items-center gap-1.5 text-sm text-burn-orange hover:underline font-medium"
                    onClick={cerrarModalCuadrilla}
                  >
                    Ir a Insumos
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-steel-mid uppercase tracking-wide">
                      Cuadrilla
                    </label>
                    <select
                      value={cuadrillaId}
                      onChange={(e) => setCuadrillaId(e.target.value)}
                      className={cn(
                        'w-full rounded-lg border border-concrete bg-[#F8F7F5]',
                        'px-3 py-2 text-sm text-charcoal',
                        'focus:outline-none focus:ring-2 focus:ring-burn-orange/40 focus:border-burn-orange',
                        'transition-colors'
                      )}
                    >
                      <option value="">Seleccionar cuadrilla…</option>
                      {cuadrillas.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                          {c.categoria_actividad ? ` · ${c.categoria_actividad}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-steel-mid uppercase tracking-wide">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min={0.25}
                      max={10}
                      step={0.25}
                      value={cantidad}
                      onChange={(e) => setCantidad(Math.max(0.25, Number(e.target.value)))}
                      className={cn(
                        'w-full rounded-lg border border-concrete bg-[#F8F7F5]',
                        'px-3 py-2 text-sm text-charcoal',
                        'focus:outline-none focus:ring-2 focus:ring-burn-orange/40 focus:border-burn-orange',
                        'transition-colors'
                      )}
                    />
                    <p className="text-xs text-steel-mid">
                      Número de trabajadores de esta especialidad en la cuadrilla
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          <ModalFooter className="gap-2">
            {resultadoModal?.ok ? (
              <Button variant="secondary" onClick={cerrarModalCuadrilla}>
                Cerrar
              </Button>
            ) : (
              <>
                <Button variant="secondary" onClick={cerrarModalCuadrilla}>
                  Cancelar
                </Button>
                {cuadrillas.length > 0 && (
                  <Button
                    onClick={handleAgregar}
                    loading={guardando}
                    disabled={!cuadrillaId || guardando}
                    icon={<Plus className="h-4 w-4" />}
                  >
                    Agregar
                  </Button>
                )}
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
