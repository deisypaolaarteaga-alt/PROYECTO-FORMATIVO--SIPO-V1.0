'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency, cn } from '@/lib/utils';
import {
  Calculator, ChevronRight, ChevronLeft,
  MoreVertical, ExternalLink, Archive, Trash2, Copy,
} from 'lucide-react';
import { PresupuestosNewButton } from '@/components/presupuestos/PresupuestosNewButton';
import { ESTADO_PRESUPUESTO_CONFIG } from '@/types';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/shared/DropdownMenu';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { archivarPresupuesto, eliminarPresupuesto } from '@/actions/proyectos';
import { duplicarPresupuesto } from '@/actions/presupuesto-estados';
import { toast } from 'sonner';

const PAGE_SIZE = 10;

const TIPO_OBRA_LABEL: Record<string, string> = {
  residencial:     'Residencial',
  comercial:       'Comercial',
  infraestructura: 'Infraestructura',
  hotelero:        'Hotelero',
  industrial:      'Industrial',
  institucional:   'Institucional',
  otro:            'Otro',
};

function StatusBadge({ estado }: { estado: string }) {
  const cfg = ESTADO_PRESUPUESTO_CONFIG[estado as keyof typeof ESTADO_PRESUPUESTO_CONFIG]
    ?? ESTADO_PRESUPUESTO_CONFIG.borrador;
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border whitespace-nowrap',
        cfg.badge
      )}
    >
      {cfg.label}
    </span>
  );
}

export function PresupuestosTable({ rows, filtro, mostrarColumnaProyecto = true }: { rows: any[]; filtro: string | null; mostrarColumnaProyecto?: boolean }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pagina, setPagina] = useState(1);

  const [confirmArchivar, setConfirmArchivar] = useState<string | null>(null);
  const [confirmEliminar, setConfirmEliminar] = useState<string | null>(null);
  const [procesando, setProcesando]           = useState(false);

  const totalPaginas = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * PAGE_SIZE;
  const paginaItems = rows.slice(inicio, inicio + PAGE_SIZE);

  const paginasVisibles = Math.min(totalPaginas, 5);

  async function handleConfirmarArchivar() {
    if (!confirmArchivar) return;
    setProcesando(true);
    const res = await archivarPresupuesto(confirmArchivar);
    setProcesando(false);
    setConfirmArchivar(null);
    if (res.success) { toast.success('Presupuesto archivado'); startTransition(() => router.refresh()); }
    else toast.error(res.error ?? 'No se pudo archivar el presupuesto');
  }

  async function handleConfirmarEliminar() {
    if (!confirmEliminar) return;
    setProcesando(true);
    const res = await eliminarPresupuesto(confirmEliminar);
    setProcesando(false);
    setConfirmEliminar(null);
    if (res.success) { toast.success('Presupuesto eliminado'); startTransition(() => router.refresh()); }
    else toast.error(res.error ?? 'No se pudo eliminar el presupuesto');
  }

  async function handleDuplicar(budgetId: string) {
    const res = await duplicarPresupuesto(budgetId);
    if (res.success) {
      toast.success('Presupuesto duplicado');
      startTransition(() => router.refresh());
    } else {
      toast.error(res.error ?? 'No se pudo duplicar el presupuesto');
    }
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3F4F6] mb-3">
            <Calculator className="h-5 w-5 text-[#D1D5DB]" />
          </div>
          <p className="text-[13px] font-semibold text-[#374151] mb-1">
            Sin presupuestos
          </p>
          <p className="text-[12px] text-[#9CA3AF] mb-5 max-w-xs">
            {filtro
              ? 'No hay presupuestos asociados a este estado.'
              : 'Crea tu primer presupuesto para empezar a calcular y gestionar costos.'}
          </p>
          {!filtro && (
            <div className="inline-flex">
              <PresupuestosNewButton />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] overflow-hidden">
        {/* Header de Columnas */}
        <div className="hidden md:flex items-center gap-4 px-5 py-2.5 bg-[#F8F9FA] border-b border-[#F3F4F6]">
          <p className="flex-1 min-w-0 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] leading-none">
            Presupuesto
          </p>
          {mostrarColumnaProyecto && (
            <p className="w-[150px] shrink-0 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] leading-none">
              Proyecto
            </p>
          )}
          <p className="w-[110px] shrink-0 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] leading-none">
            Estado
          </p>
          <p className="w-[80px] shrink-0 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] leading-none">
            Vigencia
          </p>
          <p className="w-[130px] shrink-0 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] leading-none">
            Costo directo
          </p>
          <p className="w-[140px] shrink-0 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] leading-none">
            Total Oferta
          </p>
          <div className="w-8 shrink-0" />
        </div>

        {/* Filas */}
        <div className="divide-y divide-[#F3F4F6]">
          {paginaItems.map((r) => {
            const fechaStr = new Date(r.created_at).toLocaleDateString('es-CO', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              timeZone: 'America/Bogota',
            });
            const tipoLabel = r.tipo_obra ? (TIPO_OBRA_LABEL[r.tipo_obra] ?? r.tipo_obra) : null;

            const diasColor =
              r.diasRestantes === null
                ? 'text-[#9CA3AF]'
                : r.diasRestantes <= 0
                ? 'text-[#DC2626] font-bold'
                : r.diasRestantes <= 7
                ? 'text-[#DC2626]'
                : r.diasRestantes <= 15
                ? 'text-[#D95510]'
                : 'text-[#6B7280]';

            const diasText =
              r.diasRestantes === null
                ? '—'
                : r.diasRestantes <= 0
                ? 'Vencido'
                : `${r.diasRestantes} días`;

            const puedeArchivar = !['aprobado', 'archivado'].includes(r.estado);
            const puedeEliminar = ['borrador', 'rechazado', 'archivado'].includes(r.estado);
            const puedeDuplicar = r.estado === 'borrador';

            return (
              <div
                key={r.id}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#FAFAFA] transition-colors duration-100 group"
              >
                {/* Nombre y metadatos — clickable */}
                <Link
                  href={`/presupuestos/${r.id}`}
                  className="flex-1 min-w-0"
                >
                  <p className="text-[13px] font-semibold text-[#111827] truncate leading-snug hover:text-[#D95510] transition-colors">
                    {r.titulo}
                  </p>
                  <p className="text-[11px] text-[#9CA3AF] mt-0.5 leading-none">
                    {[tipoLabel, `Creado el ${fechaStr}`].filter(Boolean).join(' · ')}
                  </p>
                </Link>

                {/* Proyecto */}
                {mostrarColumnaProyecto && (
                  <div className="hidden md:block w-[150px] shrink-0">
                    {r.project_id ? (
                      <Link
                        href={`/proyectos/${r.project_id}`}
                        className="text-[12px] text-[#6B7280] truncate leading-tight hover:text-[#D95510] transition-colors block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {r.proyecto_nombre ?? '—'}
                      </Link>
                    ) : (
                      <p className="text-[12px] text-[#6B7280] truncate leading-tight">
                        {r.proyecto_nombre ?? '—'}
                      </p>
                    )}
                  </div>
                )}

                {/* Estado */}
                <div className="hidden md:flex w-[110px] shrink-0">
                  <StatusBadge estado={r.estado} />
                </div>

                {/* Vigencia */}
                <div className="hidden md:block w-[80px] shrink-0 text-right">
                  <p className={cn('text-[12px] tabular-nums leading-tight', diasColor)}>
                    {diasText}
                  </p>
                </div>

                {/* Costo Directo */}
                <div className="hidden md:block w-[130px] shrink-0 text-right">
                  <p className="text-[13px] font-medium text-[#6B7280] tabular-nums leading-tight">
                    {formatCurrency(r.costo_directo)}
                  </p>
                </div>

                {/* Total Oferta */}
                <div className="w-[140px] shrink-0 text-right">
                  <p className="text-[14px] font-bold text-[#111827] tabular-nums leading-tight">
                    {formatCurrency(r.total_oferta)}
                  </p>
                </div>

                {/* Menú ⋯ */}
                <div className="w-8 shrink-0 flex items-center justify-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="h-7 w-7 inline-flex items-center justify-center rounded-lg text-[#C8C0B5] hover:bg-[#EAE6E0] hover:text-[#3D3530] transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/presupuestos/${r.id}`} className="flex items-center gap-2">
                          <ExternalLink className="h-4 w-4" />
                          Abrir
                        </Link>
                      </DropdownMenuItem>
                      {puedeDuplicar && (
                        <DropdownMenuItem onClick={() => handleDuplicar(r.id)}>
                          <Copy className="h-4 w-4" />
                          Duplicar
                        </DropdownMenuItem>
                      )}
                      {(puedeArchivar || puedeEliminar) && <DropdownMenuSeparator />}
                      {puedeArchivar && (
                        <DropdownMenuItem
                          onClick={() => setConfirmArchivar(r.id)}
                          className="text-neutral-500"
                        >
                          <Archive className="h-4 w-4" />
                          Archivar
                        </DropdownMenuItem>
                      )}
                      {puedeEliminar && (
                        <DropdownMenuItem
                          onClick={() => setConfirmEliminar(r.id)}
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>

        {/* Paginación */}
        <div className="px-5 py-3 border-t border-[#F3F4F6] flex items-center justify-between flex-wrap gap-y-2 bg-[#FAFAFA]">
          <p className="text-xs text-neutral-400">
            Mostrando {inicio + 1} a {Math.min(inicio + PAGE_SIZE, rows.length)} de{' '}
            {rows.length} resultado{rows.length !== 1 ? 's' : ''}
          </p>
          {totalPaginas > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPagina((prev) => Math.max(1, prev - 1))}
                disabled={paginaActual === 1}
                className="h-7 w-7 inline-flex items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-neutral-500 hover:border-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {Array.from({ length: paginasVisibles }, (_, i) => {
                const pg = i + 1;
                return (
                  <button
                    key={pg}
                    onClick={() => setPagina(pg)}
                    className={cn(
                      'h-7 w-7 inline-flex items-center justify-center rounded-lg text-xs font-semibold transition-colors',
                      paginaActual === pg
                        ? 'bg-[#D95510] text-white border border-[#D95510]'
                        : 'border border-[#E5E7EB] bg-white text-neutral-500 hover:border-neutral-300'
                    )}
                  >
                    {pg}
                  </button>
                );
              })}
              <button
                onClick={() => setPagina((prev) => Math.min(totalPaginas, prev + 1))}
                disabled={paginaActual === totalPaginas}
                className="h-7 w-7 inline-flex items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-neutral-500 hover:border-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Diálogos de confirmación ── */}
      <ConfirmDialog
        open={confirmArchivar !== null}
        title="¿Archivar este presupuesto?"
        description="No podrás editarlo mientras esté archivado. Podrás desarchivarlo desde la pestaña Archivados."
        confirmLabel={procesando ? 'Archivando…' : 'Sí, archivar'}
        cancelLabel="Cancelar"
        variant="warning"
        onConfirm={handleConfirmarArchivar}
        onCancel={() => setConfirmArchivar(null)}
      />

      <ConfirmDialog
        open={confirmEliminar !== null}
        title="¿Eliminar este presupuesto?"
        description="Esta acción es permanente y no se puede deshacer. El presupuesto será eliminado junto con todos sus capítulos, actividades y APUs."
        confirmLabel={procesando ? 'Eliminando…' : 'Sí, eliminar'}
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleConfirmarEliminar}
        onCancel={() => setConfirmEliminar(null)}
      />
    </>
  );
}
