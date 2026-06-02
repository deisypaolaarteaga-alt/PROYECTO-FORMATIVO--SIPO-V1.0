'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown, ChevronRight, Plus, Trash2,
  Loader2, FileText, Settings, BookOpen, Package,
  Calendar, Check, Copy, GripVertical, MoreHorizontal, TrendingUp,
  CheckCircle2, LockOpen, Eye, BookmarkPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/shared/Button';
import { InputPrecio } from '@/components/shared/InputPrecio';
import { InputEditable } from '@/components/shared/InputEditable';
import { InputCantidad } from '@/components/shared/InputCantidad';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/shared/DropdownMenu';
import {
  agregarCapitulo, agregarActividad,
  actualizarActividad, actualizarPresupuesto, actualizarCapitulo,
  eliminarActividad, eliminarCapitulo,
  aprobarPresupuesto, reabrirPresupuesto,
} from '@/actions/presupuestos';
import { formatearCOP } from '@/lib/utils/formato-cop';
import dynamic from 'next/dynamic';
const PanelAPU = dynamic(() => import('./PanelAPU').then(m => ({ default: m.PanelAPU })), { ssr: false });
const ModalVistaPrevia = dynamic(
  () => import('./ModalVistaPrevia').then(m => ({ default: m.ModalVistaPrevia })),
  { ssr: false }
);
import { ResumenFinanciero } from './ResumenFinanciero';
import { ResumenFinancieroTab } from './ResumenFinancieroTab';
import { ModalCatalogo } from './ModalCatalogo';
import { BotonEnviarRevision } from './BotonEnviarRevision';
import { EstadoBadge } from './EstadoBadge';
import { ExplosionInsumosView } from './ExplosionInsumosView';
import { ModalGuardarPlantilla } from './ModalGuardarPlantilla';
import type { BudgetCompleto, ActivityWithAPU, Profile } from '@/types';

interface EditorPresupuestoProps {
  budget: BudgetCompleto;
  profile: Profile;
}

function formatRelativeTime(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 10) return 'ahora mismo';
  if (s < 60) return `hace ${s}s`;
  return `hace ${Math.floor(s / 60)}m`;
}

export function EditorPresupuesto({ budget: initialBudget, profile }: EditorPresupuestoProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [budget, setBudget] = useState<any>(initialBudget);
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(initialBudget.chapters?.map((c) => c.id) || [])
  );

  useEffect(() => {
    setBudget(initialBudget);
    setExpanded(new Set(initialBudget.chapters?.map((c) => c.id) || []));
  }, [initialBudget]);

  const [activeTab, setActiveTab] = useState<'estructura' | 'insumos' | 'resumen'>('estructura');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [, forceRefreshTime] = useState(0);
  const [activeApuActivity, setActiveApuActivity] = useState<ActivityWithAPU | null>(null);
  const [confirmState, setConfirmState] = useState<{
    title: string; description?: string; onConfirm: () => void;
    confirmLabel?: string; variant?: 'danger' | 'warning';
  } | null>(null);
  const [catalogoOpen, setCatalogoOpen] = useState(false);
  const [vistaPreviaOpen, setVistaPreviaOpen] = useState(false);
  const [guardarPlantillaOpen, setGuardarPlantillaOpen] = useState(false);
  const [bannerCiudadIgnorado, setBannerCiudadIgnorado] = useState(false);
  const [isChangingEstado, setIsChangingEstado] = useState(false);
  const [newChapterId, setNewChapterId] = useState<string | null>(null);

  // Drag & drop (local reorder solo — sin persistir en BD)
  const [dragSrcActId, setDragSrcActId] = useState<string | null>(null);
  const [dragSrcChId, setDragSrcChId] = useState<string | null>(null);
  const [dragOverActId, setDragOverActId] = useState<string | null>(null);

  const router = useRouter();

  // Ref para debounce de guardado — evita un server round-trip por cada keystroke
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Actualizar "hace Xs" cada 10s mientras hay lastSaved
  useEffect(() => {
    if (!lastSaved) return;
    const id = setInterval(() => forceRefreshTime(n => n + 1), 10_000);
    return () => clearInterval(id);
  }, [lastSaved]);

  // Limpiar timer pendiente al desmontar
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const ciudadPerfil = (profile?.ciudad || '').trim().toLowerCase();
  const ciudadObra   = (budget.ciudad_ica || '').trim().toLowerCase();
  const mostrarBannerCiudad =
    !bannerCiudadIgnorado &&
    ciudadPerfil !== '' &&
    ciudadObra   !== '' &&
    ciudadPerfil !== ciudadObra;

  const estaAprobado   = budget.estado === 'aprobado';
  const estaEnRevision = budget.estado === 'en_revision';
  const bloqueado      = estaAprobado;

  const fechaAprobada = budget.aprobado_en
    ? new Intl.DateTimeFormat('es-CO', {
        day: '2-digit', month: 'long', year: 'numeric',
        timeZone: 'America/Bogota',
      }).format(new Date(budget.aprobado_en))
    : null;

  const askConfirm = (title: string, description: string, onConfirm: () => void) =>
    setConfirmState({ title, description, onConfirm });

  // ── CÁLCULOS (memoizados — solo recalculan cuando cambian los capítulos o config AIU/IVA) ──
  const subtotalDirecto = useMemo(() =>
    (budget.chapters || []).reduce((acc: number, ch: any) => {
      const chTotal = (ch.activities || []).reduce((s: number, a: any) =>
        s + (Number(a.cantidad) * Number(a.precio_unitario) || 0), 0);
      return acc + chTotal;
    }, 0),
    [budget.chapters]
  );

  const { valorAIU, valorIVA, totalGeneral } = useMemo(() => {
    const aiuTotalPct = Number(budget.administracion_pct ?? 10)
      + Number(budget.imprevistos_pct ?? 5)
      + Number(budget.utilidad_pct ?? 10);
    const vAIU            = subtotalDirecto * (aiuTotalPct / 100);
    const utilidadEstimada = subtotalDirecto * (Number(budget.utilidad_pct ?? 10) / 100);
    const subConAIU       = subtotalDirecto + vAIU;
    const ivaPct          = budget.iva_porcentaje != null ? Number(budget.iva_porcentaje) : 0;
    let vIVA = 0;
    switch (budget.metodo_iva) {
      case 'sobre_utilidad': vIVA = utilidadEstimada * ivaPct / 100; break;
      case 'sobre_aiu':      vIVA = vAIU             * ivaPct / 100; break;
      case 'sobre_total':    vIVA = subConAIU         * ivaPct / 100; break;
    }
    return { valorAIU: vAIU, valorIVA: vIVA, totalGeneral: subConAIU + vIVA };
  }, [subtotalDirecto, budget.administracion_pct, budget.imprevistos_pct, budget.utilidad_pct, budget.metodo_iva, budget.iva_porcentaje]);

  const vigenciaDias = Number(budget.vigencia_dias ?? 0);
  const fechaValidez = budget.created_at && vigenciaDias > 0 ? (() => {
    const d = new Date(budget.created_at);
    d.setDate(d.getDate() + vigenciaDias);
    return d;
  })() : null;
  const fechaValidezFormateada = fechaValidez ? new Intl.DateTimeFormat('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Bogota',
  }).format(fechaValidez) : null;

  const fechaElaboracion = budget.created_at
    ? new Intl.DateTimeFormat('es-CO', {
        day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Bogota',
      }).format(new Date(budget.created_at))
    : null;

  const TIPO_OBRA_LABELS: Record<string, string> = {
    residencial: 'Residencial', comercial: 'Comercial', infraestructura: 'Infraestructura',
    hotelero: 'Hotelero', industrial: 'Industrial', institucional: 'Institucional', otro: 'Otro',
  };
  const tipoObraLabel = budget.projects?.tipo_obra
    ? (TIPO_OBRA_LABELS[budget.projects.tipo_obra as string] ?? budget.projects.tipo_obra)
    : null;

  const toggleChapter = useCallback((id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // ── ACCIONES ──────────────────────────────────────────────────────────────
  const handleAddChapter = async () => {
    const res = await agregarCapitulo(budget.id, 'Nuevo capítulo');
    if (res.data) {
      setBudget((prev: any) => ({
        ...prev,
        chapters: [...(prev.chapters || []), { ...(res.data as Record<string, unknown>), activities: [] }],
      }));
      const chId = (res.data as any).id;
      setExpanded(prev => new Set(prev).add(chId));
      setNewChapterId(chId);
    }
  };

  const handleAddActivity = async (chId: string) => {
    const res = await agregarActividad(chId, budget.id);
    if (res.data) {
      setBudget((prev: any) => ({
        ...prev,
        chapters: prev.chapters.map((c: any) =>
          c.id === chId ? { ...c, activities: [...(c.activities || []), res.data] } : c
        ),
      }));
    }
  };

  const handleUpdateAct = useCallback((actId: string, chId: string, fields: any) => {
    // Actualización optimista inmediata
    setBudget((prev: any) => ({
      ...prev,
      chapters: prev.chapters.map((c: any) =>
        c.id === chId ? {
          ...c,
          activities: c.activities.map((a: any) => a.id === actId ? { ...a, ...fields } : a),
        } : c
      ),
    }));
    // Debounce: guarda en servidor 600ms después del último cambio
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setIsSaving(true);
    saveTimerRef.current = setTimeout(async () => {
      await actualizarActividad(actId, budget.id, fields);
      setIsSaving(false);
      setLastSaved(new Date());
    }, 600);
  }, [budget.id]);

  const handleUpdateBudget = async (fields: any) => {
    setBudget((prev: any) => ({ ...prev, ...fields }));
    setIsSaving(true);
    await actualizarPresupuesto(budget.id, fields);
    setIsSaving(false);
    setLastSaved(new Date());
  };

  const handleUpdateChapter = useCallback(async (chId: string, nombre: string) => {
    const nombreFinal = nombre.trim() || 'Sin nombre';
    setBudget((prev: any) => ({
      ...prev,
      chapters: prev.chapters.map((c: any) => c.id === chId ? { ...c, nombre: nombreFinal } : c),
    }));
    setNewChapterId(null);
    await actualizarCapitulo(chId, budget.id, nombreFinal);
  }, [budget.id]);

  const handleAprobar = async () => {
    setIsChangingEstado(true);
    const res = await aprobarPresupuesto(budget.id);
    setIsChangingEstado(false);
    if (res.success) router.refresh();
  };

  const handleDeleteActivity = (actId: string, chId: string) => {
    askConfirm('¿Eliminar actividad?', 'Esta acción no se puede deshacer.', async () => {
      setConfirmState(null);
      await eliminarActividad(actId, budget.id);
      setBudget((prev: any) => ({
        ...prev,
        chapters: prev.chapters.map((c: any) =>
          c.id === chId ? { ...c, activities: c.activities.filter((a: any) => a.id !== actId) } : c
        ),
      }));
    });
  };

  const handleDeleteChapter = (chId: string) => {
    askConfirm('¿Eliminar capítulo?', 'Se eliminarán también todas sus actividades.', async () => {
      setConfirmState(null);
      await eliminarCapitulo(chId, budget.id);
      setBudget((prev: any) => ({
        ...prev,
        chapters: prev.chapters.filter((c: any) => c.id !== chId),
      }));
    });
  };

  const handleDuplicateActivity = async (act: any, chId: string) => {
    const res = await agregarActividad(chId, budget.id);
    if (!res.data) return;
    const newAct = res.data as any;
    const fields = {
      nombre: `${act.nombre || act.descripcion || 'Actividad'} (copia)`,
      unidad: act.unidad,
      cantidad: act.cantidad,
      precio_unitario: act.precio_unitario,
    };
    await actualizarActividad(newAct.id, budget.id, fields);
    setBudget((prev: any) => ({
      ...prev,
      chapters: prev.chapters.map((c: any) =>
        c.id === chId
          ? { ...c, activities: [...c.activities, { ...newAct, ...fields }] }
          : c
      ),
    }));
  };

  const handleMoveActivity = async (actId: string, fromChId: string, toChId: string) => {
    if (fromChId === toChId) return;
    const act = (budget.chapters ?? [])
      .find((c: any) => c.id === fromChId)
      ?.activities?.find((a: any) => a.id === actId);
    if (!act) return;
    setBudget((prev: any) => ({
      ...prev,
      chapters: prev.chapters.map((c: any) => {
        if (c.id === fromChId) return { ...c, activities: c.activities.filter((a: any) => a.id !== actId) };
        if (c.id === toChId)   return { ...c, activities: [...c.activities, { ...act, chapter_id: toChId }] };
        return c;
      }),
    }));
    await actualizarActividad(actId, budget.id, { chapter_id: toChId });
  };

  // ── DRAG & DROP (reorden local, mismo capítulo) ────────────────────────────
  // dragSrcActId/dragSrcChId en ref — evita re-render en cada dragOver
  const dragSrcRef = useRef<{ actId: string; chId: string } | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, actId: string, chId: string) => {
    dragSrcRef.current = { actId, chId };
    setDragSrcActId(actId);
    setDragSrcChId(chId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, actId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverActId(prev => prev === actId ? prev : actId);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetActId: string, targetChId: string) => {
    e.preventDefault();
    const src = dragSrcRef.current;
    if (!src || src.chId !== targetChId || src.actId === targetActId) {
      setDragOverActId(null);
      return;
    }
    const { actId: srcActId } = src;
    setBudget((prev: any) => ({
      ...prev,
      chapters: prev.chapters.map((c: any) => {
        if (c.id !== targetChId) return c;
        const acts = [...c.activities];
        const srcIdx = acts.findIndex((a: any) => a.id === srcActId);
        const tgtIdx = acts.findIndex((a: any) => a.id === targetActId);
        if (srcIdx === -1 || tgtIdx === -1) return c;
        const [moved] = acts.splice(srcIdx, 1);
        acts.splice(tgtIdx, 0, moved);
        return { ...c, activities: acts };
      }),
    }));
    dragSrcRef.current = null;
    setDragSrcActId(null);
    setDragSrcChId(null);
    setDragOverActId(null);
  }, []);

  const handleDragEnd = useCallback(() => {
    dragSrcRef.current = null;
    setDragSrcActId(null);
    setDragSrcChId(null);
    setDragOverActId(null);
  }, []);

  const tabs = [
    { key: 'estructura', label: '1. Estructura y Costos',     icon: FileText    },
    { key: 'insumos',    label: '2. Explosión de Insumos',    icon: Package     },
    { key: 'resumen',    label: '3. Resumen y Exportación',   icon: TrendingUp  },
  ] as const;

  return (
    <div className="flex flex-col h-full bg-[#F5F2EE] font-sans">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E8E4DE] px-6 py-4 sticky top-0 z-20 shadow-sm">
        <div className="flex flex-col md:flex-row items-start gap-3 md:justify-between md:gap-6">

          {/* Izquierda: título + estado + fecha */}
          <div className="flex items-start gap-3 min-w-0">
            <div className="mt-0.5 h-9 w-9 rounded-lg bg-[#FAF0EB] flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-[#C84B1A]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {estaAprobado ? (
                  <span className="text-xl font-bold text-[#1C1814] max-w-sm truncate">{budget.titulo}</span>
                ) : (
                  <InputEditable
                    value={budget.titulo}
                    onChange={(val) => handleUpdateBudget({ titulo: val })}
                    className="text-xl font-bold text-[#1C1814] max-w-xs md:max-w-sm truncate"
                  />
                )}
                <EstadoBadge
                  estado={budget.estado ?? 'borrador'}
                  fechaActualizacion={budget.updated_at}
                />
              </div>
              {(tipoObraLabel || (budget as any).projects?.area_m2 || fechaElaboracion || fechaValidezFormateada) && (
                <div className="flex items-center gap-4 text-[11px] text-[#6B7A8D] mt-1 flex-wrap">
                  {tipoObraLabel && (
                    <span className="font-medium text-[#5A5248]">{tipoObraLabel}</span>
                  )}
                  {(budget as any).projects?.area_m2 && (
                    <span className="px-1.5 py-0.5 rounded bg-[#EBF2FA] text-[#1E4D8C] font-semibold text-[10px]">
                      {(budget as any).projects.area_m2} m²
                    </span>
                  )}
                  {fechaElaboracion && (
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <Calendar className="h-3 w-3" />
                      Elaborado: <span className="font-semibold text-[#1F2937] ml-1">{fechaElaboracion}</span>
                    </span>
                  )}
                  {fechaValidezFormateada && (
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <Calendar className="h-3 w-3" />
                      Válido hasta: <span className="font-semibold text-[#1F2937] ml-1">{fechaValidezFormateada}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Derecha: indicadores + acciones + total */}
          <div className="flex flex-col items-start md:items-end gap-2 w-full md:w-auto md:shrink-0">
            {/* Fila superior: guardado + PDF + acciones de estado */}
            <div className="flex items-center flex-wrap gap-2">
              {/* Indicador guardado — solo mientras el editor es editable */}
              {!bloqueado && (
                <div className="h-7 flex items-center">
                  {isSaving ? (
                    <span className="flex items-center gap-1.5 text-[11px] text-stone">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Guardando…
                    </span>
                  ) : lastSaved ? (
                    <span className="flex items-center gap-1.5 text-[11px] text-stone">
                      <Check className="h-3.5 w-3.5 text-[#2D7A45]" />
                      Guardado {formatRelativeTime(lastSaved)}
                    </span>
                  ) : null}
                </div>
              )}

              <Button
                onClick={() => setVistaPreviaOpen(true)}
                variant="ghost"
                size="sm"
                icon={<Eye className="h-4 w-4" />}
              >
                Vista previa
              </Button>

              {/* Guardar como plantilla — solo si no está aprobado */}
              {!estaAprobado && (
                <Button
                  onClick={() => setGuardarPlantillaOpen(true)}
                  variant="ghost"
                  size="sm"
                  icon={<BookmarkPlus className="h-4 w-4" />}
                >
                  Guardar como plantilla
                </Button>
              )}

              {/* Marcar como aprobado — solo cuando en revisión */}
              {estaEnRevision && (
                <button
                  onClick={handleAprobar}
                  disabled={isChangingEstado}
                  className="inline-flex items-center gap-1.5 h-8 px-3 text-[13px] font-semibold rounded-lg bg-[#C84B1A] hover:bg-[#A83A14] text-white disabled:opacity-60 transition-colors"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isChangingEstado ? 'Aprobando…' : 'Marcar como aprobado'}
                </button>
              )}

              {/* Reabrir para edición — solo cuando aprobado */}
              {estaAprobado && (
                <button
                  onClick={() => setConfirmState({
                    title: '¿Reabrir para edición?',
                    description: 'El presupuesto volverá a borrador y podrá editarse nuevamente. La fecha de aprobación se borrará.',
                    confirmLabel: 'Sí, reabrir',
                    variant: 'warning',
                    onConfirm: async () => {
                      setConfirmState(null);
                      setIsChangingEstado(true);
                      await reabrirPresupuesto(budget.id);
                      setIsChangingEstado(false);
                      router.refresh();
                    },
                  })}
                  disabled={isChangingEstado}
                  className="inline-flex items-center gap-1.5 h-8 px-3 text-[13px] font-semibold rounded-lg border border-[#E8E4DE] text-stone hover:text-[#1C1814] hover:border-[#1C1814] disabled:opacity-60 transition-colors"
                >
                  <LockOpen className="h-4 w-4" />
                  Reabrir para edición
                </button>
              )}

              {/* Enviar a revisión — solo cuando borrador */}
              <BotonEnviarRevision
                budgetId={budget.id}
                proyectoId={budget.project_id}
                estado={budget.estado ?? 'borrador'}
              />
            </div>

            {/* Fila inferior: total */}
            <div className="text-left md:text-right">
              <p className="text-[10px] text-stone uppercase font-bold tracking-widest">Total Presupuesto</p>
              <p className="text-3xl font-black text-[#1C1814] leading-none" style={{ fontFamily: 'var(--font-mono)' }}>{formatearCOP(totalGeneral)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS ──────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E8E4DE] px-6 flex items-center gap-0">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'px-4 py-3.5 text-sm font-medium transition-colors duration-150 border-b-2 -mb-px flex items-center gap-2 whitespace-nowrap',
              activeTab === key
                ? 'border-[#C84B1A] text-[#1C1814]'
                : 'border-transparent text-stone hover:text-[#1C1814]'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── BANNER CIUDAD ─────────────────────────────────────────────────── */}
      {mostrarBannerCiudad && (
        <div className="bg-warning-bg border-b border-warning-border px-6 py-3 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="text-warning-text mt-0.5 shrink-0">⚠</span>
            <p className="text-sm text-warning-text">
              La ciudad de tu empresa (<strong>{profile.ciudad}</strong>) es diferente a la
              ubicación de la obra (<strong>{budget.ciudad_ica}</strong>).
              Verifica cuál aplicará para las retenciones (ICA).
            </p>
          </div>
          <button
            onClick={() => setBannerCiudadIgnorado(true)}
            className="text-xs text-warning-text hover:text-[#1F2937] font-medium whitespace-nowrap shrink-0 transition-colors duration-150"
          >
            Ignorar
          </button>
        </div>
      )}

      {/* ── BANNER APROBADO ───────────────────────────────────────────────── */}
      {estaAprobado && (
        <div className="bg-success-bg border-b border-success-border px-6 py-3 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-success-text shrink-0" />
          <p className="text-sm text-success-text font-medium">
            Presupuesto aprobado
            {fechaAprobada && <> el <strong>{fechaAprobada}</strong></>}
          </p>
        </div>
      )}

      {/* ── TAB: EXPLOSIÓN DE INSUMOS ──────────────────────────────────────── */}
      {activeTab === 'insumos' && (
        <div className="flex-1 overflow-y-auto p-8">
          <ExplosionInsumosView budgetId={budget.id} />
        </div>
      )}

      {/* ── TAB: RESUMEN FINANCIERO ────────────────────────────────────────── */}
      {activeTab === 'resumen' && (
        <div className="flex-1 overflow-y-auto p-8">
          <ResumenFinancieroTab budget={budget} subtotalDirecto={subtotalDirecto} />
        </div>
      )}

      {/* ── TAB: ESTRUCTURA ───────────────────────────────────────────────── */}
      {activeTab === 'estructura' && (
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <fieldset
          disabled={bloqueado}
          className={cn('border-0 p-0 m-0 min-w-0 flex flex-col lg:flex-row items-start gap-8', bloqueado && 'opacity-70')}
        >

          {/* Columna Izquierda: Capítulos (70%) */}
          <div className="flex-1 w-full space-y-5 min-w-0">

          {/* Capítulos */}
          {(budget.chapters || []).map((ch: any, idx: number) => {
            const isExpanded = expanded.has(ch.id);
            const chTotal = (ch.activities || []).reduce(
              (s: number, a: any) => s + (Number(a.cantidad) * Number(a.precio_unitario) || 0), 0
            );
            const pctCD = subtotalDirecto > 0
              ? ((chTotal / subtotalDirecto) * 100).toFixed(1)
              : null;
            const otrosCapitulos = (budget.chapters || []).filter((c: any) => c.id !== ch.id);

            return (
              <div key={ch.id || `ch-${idx}`} className="bg-white rounded-xl border border-[#E8E4DE] border-l-[3px] border-l-[#C84B1A] overflow-hidden shadow-sm">

                {/* Header capítulo */}
                <div
                  className="bg-[#F5F0EA] px-5 py-3.5 flex items-center justify-between cursor-pointer hover:bg-[#EDE6DC] transition-colors duration-150"
                  onClick={() => toggleChapter(ch.id)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded
                      ? <ChevronDown className="h-4 w-4 text-[#6B7A8D] shrink-0" />
                      : <ChevronRight className="h-4 w-4 text-[#6B7A8D] shrink-0" />}
                    <span className="h-6 w-6 rounded bg-[#FAF0EB] flex items-center justify-center shrink-0 text-[10px] font-bold text-[#C84B1A]">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div
                      className="font-semibold text-[#1C1814] text-[11px] uppercase min-w-[120px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <InputEditable
                        value={(ch.nombre ?? '').replace(/^\d{2,3}\.\s*/, '')}
                        onChange={(val) => setBudget((prev: any) => ({
                          ...prev,
                          chapters: prev.chapters.map((c: any) => c.id === ch.id ? { ...c, nombre: val } : c),
                        }))}
                        onBlur={(val) => handleUpdateChapter(ch.id, val)}
                        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                        placeholder="Sin nombre"
                        autoFocus={newChapterId === ch.id}
                        className="font-semibold text-[#1C1814] text-[11px] uppercase"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <span className="font-semibold text-[#1C1814] text-sm tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>{formatearCOP(chTotal)}</span>
                    {pctCD && (
                      <span className="text-[11px] font-bold text-[#C84B1A] bg-[#FAF0EB] px-2 py-0.5 rounded-full border border-[#C84B1A]/20">
                        {pctCD}% CD
                      </span>
                    )}
                    <button
                      onClick={() => handleDeleteChapter(ch.id)}
                      className="text-stone hover:text-[#991B1B] transition-colors duration-150 p-1 rounded"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Tabla de actividades */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-[9px] text-stone uppercase tracking-wide bg-[#F0EDE8] border-b border-[#E8E4DE]">
                        <tr>
                          <th className="hidden md:table-cell w-8 px-2 py-2.5" />
                          <th className="px-4 py-2.5 font-medium">Descripción</th>
                          <th className="hidden md:table-cell px-3 py-2.5 font-medium w-20">Unid.</th>
                          <th className="hidden md:table-cell px-3 py-2.5 font-medium w-28 text-right">Cantidad</th>
                          <th className="hidden md:table-cell px-3 py-2.5 font-medium w-36 text-right">Precio Unit.</th>
                          <th className="px-3 py-2.5 font-medium w-36 text-right">Total</th>
                          <th className="px-3 py-2.5 w-28 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0EDE8]">
                        {(ch.activities || []).map((act: any, aIdx: number) => (
                          <tr
                            key={act.id || `act-${aIdx}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, act.id, ch.id)}
                            onDragOver={(e) => handleDragOver(e, act.id)}
                            onDrop={(e) => handleDrop(e, act.id, ch.id)}
                            onDragEnd={handleDragEnd}
                            className={cn(
                              'group transition-colors duration-100',
                              dragOverActId === act.id && dragSrcChId === ch.id
                                ? 'border-t-2 border-[#C84B1A] bg-[#FAF0EB]/30'
                                : 'hover:bg-[#F5F0EA]',
                              dragSrcActId === act.id && 'opacity-40'
                            )}
                          >
                            {/* Drag handle */}
                            <td className="hidden md:table-cell px-2 py-2.5 text-center">
                              <GripVertical className="h-4 w-4 text-[#E0DAD4] group-hover:text-stone cursor-grab active:cursor-grabbing mx-auto transition-colors" />
                            </td>

                            {/* Descripción */}
                            <td className="px-4 py-2.5">
                              <div className="rounded hover:bg-[#EDE6DC] focus-within:ring-1 focus-within:ring-[#C84B1A]/20 transition-colors px-1 -mx-1 cursor-text">
                                <InputEditable
                                  value={act.nombre || act.descripcion || ''}
                                  onChange={(val) => handleUpdateAct(act.id, ch.id, { nombre: val })}
                                  className="text-[#1C1814] w-full"
                                />
                              </div>
                            </td>

                            {/* Unidad */}
                            <td className="hidden md:table-cell px-3 py-2.5">
                              <select
                                value={act.unidad ?? 'un'}
                                onChange={(e) => handleUpdateAct(act.id, ch.id, { unidad: e.target.value })}
                                className="bg-transparent border-none focus:ring-0 p-0 text-stone text-xs font-medium cursor-pointer hover:text-[#1C1814] transition-colors"
                                suppressHydrationWarning
                              >
                                {['m²', 'ml', 'm³', 'kg', 'gl', 'un', 'pza', 'glb'].map(u => (
                                  <option key={u} value={u}>{u}</option>
                                ))}
                              </select>
                            </td>

                            {/* Cantidad */}
                            <td className="hidden md:table-cell px-3 py-2.5">
                              <div className="rounded hover:bg-[#EDE6DC] focus-within:ring-1 focus-within:ring-[#C84B1A]/20 transition-colors px-1 -mx-1 cursor-text">
                                <InputCantidad
                                  value={Number(act.cantidad) || 0}
                                  onChange={(val) => handleUpdateAct(act.id, ch.id, { cantidad: val })}
                                />
                              </div>
                            </td>

                            {/* Precio unitario */}
                            <td className="hidden md:table-cell px-3 py-2.5">
                              <div className="rounded hover:bg-[#EDE6DC] focus-within:ring-1 focus-within:ring-[#C84B1A]/20 transition-colors px-1 -mx-1 cursor-text">
                                <InputPrecio
                                  value={act.precio_unitario}
                                  onChange={(val) => handleUpdateAct(act.id, ch.id, { precio_unitario: val })}
                                  className="text-right text-stone font-medium text-sm"
                                />
                              </div>
                            </td>

                            {/* Total */}
                            <td className="px-3 py-2.5 text-right font-semibold text-[#1C1814] tabular-nums text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
                              {formatearCOP(Number(act.cantidad) * Number(act.precio_unitario))}
                            </td>

                            {/* Acciones */}
                            <td className="px-3 py-2.5">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Botón APU — acción principal */}
                                <button
                                  onClick={() => setActiveApuActivity(act)}
                                  title="Análisis de Precios Unitarios"
                                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-[#6B7A8D] bg-[#E4E7EC] hover:bg-[#1A2535] hover:text-white rounded-md transition-all duration-150 border border-[#E4E7EC] hover:border-[#1A2535]"
                                >
                                  <Settings className="h-3 w-3" />
                                  APU
                                </button>

                                {/* Menú secundario */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      className="p-1 rounded text-stone hover:text-[#1C1814] hover:bg-[#EDE6DC] transition-colors duration-150"
                                      title="Más acciones"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="min-w-[180px]">
                                    <DropdownMenuItem
                                      onClick={() => handleDuplicateActivity(act, ch.id)}
                                      className="gap-2 cursor-pointer"
                                    >
                                      <Copy className="h-4 w-4 text-[#6B7A8D]" />
                                      Duplicar actividad
                                    </DropdownMenuItem>

                                    {otrosCapitulos.length > 0 && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuLabel className="text-[10px] text-stone uppercase tracking-widest font-bold px-2 py-1">
                                          Mover a capítulo
                                        </DropdownMenuLabel>
                                        {otrosCapitulos.map((oc: any, ocIdx: number) => (
                                          <DropdownMenuItem
                                            key={oc.id || `oc-${ocIdx}`}
                                            onClick={() => handleMoveActivity(act.id, ch.id, oc.id)}
                                            className="gap-2 cursor-pointer text-xs"
                                          >
                                            <span className="h-4 w-4 rounded bg-[#F0EDE8] text-stone flex items-center justify-center text-[9px] font-bold shrink-0">
                                              {String((budget.chapters || []).findIndex((c: any) => c.id === oc.id) + 1).padStart(2, '0')}
                                            </span>
                                            <span className="truncate">{oc.nombre.replace(/^\d{2,3}\.\s*/, '')}</span>
                                          </DropdownMenuItem>
                                        ))}
                                      </>
                                    )}

                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteActivity(act.id, ch.id)}
                                      className="gap-2 cursor-pointer text-[#991B1B] focus:text-[#991B1B] focus:bg-[#FEF0F0]"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Eliminar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Agregar actividad */}
                    <div className="px-5 py-3 bg-white border-t border-[#E4E7EC]">
                      <button
                        onClick={() => handleAddActivity(ch.id)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#FAF0EB] text-[#C84B1A] hover:bg-[#C84B1A] hover:text-white rounded-lg text-xs font-semibold border border-[#C84B1A]/20 hover:border-[#C84B1A] transition-all duration-150"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Agregar actividad
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Botones agregar capítulo / catálogo */}
          <div className="flex gap-3">
            <Button
              onClick={handleAddChapter}
              variant="secondary"
              className="flex-1 border-dashed border-2 py-7 bg-[#F5F2EE] hover:bg-[#EDE6DC] transition-colors duration-150"
            >
              <Plus className="mr-2 h-5 w-5" /> Agregar nuevo capítulo
            </Button>
            <Button
              onClick={() => setCatalogoOpen(true)}
              variant="outline"
              className="border-dashed border-2 py-7 px-6"
            >
              <BookOpen className="mr-2 h-5 w-5" /> Importar del catálogo
            </Button>
          </div>
          </div> {/* Fin Columna Izquierda */}

          {/* Columna Derecha: Sticky Sidebar (30%) */}
          <div className="w-full lg:w-[340px] xl:w-[380px] shrink-0 sticky top-0 space-y-6">
              {/* Configuración AIU / IVA */}
              <div className="bg-white p-6 rounded-xl border border-[#E8E4DE] space-y-5">
                <h3 className="text-sm font-semibold text-[#1C1814] flex items-center gap-2">
                  <Settings className="text-stone h-4 w-4" /> Configuración de Cascada
                </h3>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-stone uppercase tracking-widest">
                      AIU Total (%)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={budget.aiu_porcentaje ?? 0}
                        onChange={(e) => handleUpdateBudget({ aiu_porcentaje: parseFloat(e.target.value) || 0 })}
                        className="w-full h-11 bg-[#F5F2EE] border border-[#E8E4DE] rounded-lg px-3 focus:ring-1 focus:ring-[#C84B1A]/40 font-semibold text-lg text-[#1C1814]"
                      />
                      <span className="text-lg font-semibold text-[#6B7A8D]">%</span>
                    </div>
                    <p className="text-[10px] text-stone italic">Se aplica sobre el costo directo total.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-stone uppercase tracking-widest">
                      IVA sobre Utilidad
                    </label>
                    <button
                      onClick={() => handleUpdateBudget({ iva_porcentaje: budget.iva_porcentaje > 0 ? 0 : 19 })}
                      className={cn(
                        'w-full h-11 rounded-lg font-semibold text-sm transition-all duration-150 border-2',
                        budget.iva_porcentaje > 0
                          ? 'bg-[#C84B1A] border-[#C84B1A] text-white'
                          : 'bg-white border-[#E8E4DE] text-stone hover:border-[#C84B1A] hover:text-[#1C1814]'
                      )}
                    >
                      {budget.iva_porcentaje > 0 ? '19% Activado' : 'Sin IVA (0%)'}
                    </button>
                    <p className="text-[10px] text-stone italic">Aplica 19% sobre la utilidad calculada.</p>
                  </div>
                </div>

                {/* ReteICA según ciudad de la obra */}
                <div className="space-y-2 border-t border-[#E8E4DE] pt-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-stone uppercase tracking-widest">
                      ReteICA Municipal
                    </label>
                    {budget.ciudad_ica && (
                      <span className="text-[10px] text-[#166534] bg-[#EBFAF0] px-1.5 py-0.5 rounded font-medium truncate max-w-[140px]">
                        {budget.ciudad_ica}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={budget.ica_pct ?? 0}
                      onChange={(e) => handleUpdateBudget({ ica_pct: parseFloat(e.target.value) || 0 })}
                      className="w-full h-9 bg-[#F5F2EE] border border-[#E8E4DE] rounded-lg px-3 focus:ring-1 focus:ring-[#C84B1A]/40 font-semibold text-sm text-[#1C1814]"
                    />
                    <span className="text-sm font-semibold text-[#6B7A8D]">%</span>
                  </div>
                  <p className="text-[10px] text-stone italic">
                    {budget.ciudad_ica
                      ? `${budget.ciudad_ica} — ${budget.ica_pct ?? 0}% (automático). Editable para ajustar.`
                      : 'Edita para ajustar manualmente.'}
                  </p>
                </div>

                {/* Vigencia del presupuesto */}
                <div className="space-y-2 border-t border-[#E8E4DE] pt-4">
                  <label className="text-[10px] font-bold text-stone uppercase tracking-widest">
                    Vigencia (días)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={vigenciaDias || ''}
                      onChange={e => handleUpdateBudget({ vigencia_dias: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-full h-9 bg-[#F5F2EE] border border-[#E8E4DE] rounded-lg px-3 focus:ring-1 focus:ring-[#C84B1A]/40 font-semibold text-sm text-[#1C1814]"
                      placeholder="30"
                    />
                    <span className="text-sm font-semibold text-[#6B7A8D] shrink-0">días</span>
                  </div>
                  <p className="text-[10px] text-stone italic">
                    {fechaValidezFormateada
                      ? `Válido hasta el ${fechaValidezFormateada}.`
                      : 'Sin vigencia definida — el presupuesto no vence.'}
                  </p>
                </div>
              </div>

              {/* Resumen rápido */}
              <div className="bg-white p-5 rounded-xl border border-[#E8E4DE]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-stone font-semibold">Resumen rápido</p>
                    <p className="text-2xl font-bold text-[#1C1814]" style={{ fontFamily: 'var(--font-mono)' }}>{formatearCOP(totalGeneral)}</p>
                  </div>
                  <div className="text-right text-stone text-xs">
                    <p>Costo Directo</p>
                    <p className="font-semibold text-[#1C1814]">{formatearCOP(subtotalDirecto)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-stone">
                  <div className="rounded-lg bg-[#F5F2EE] p-3 border border-[#E8E4DE]">
                    <p className="font-semibold text-[#1C1814] text-xs uppercase tracking-wide">AIU</p>
                    <p className="mt-1 font-semibold tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>{formatearCOP(valorAIU)}</p>
                  </div>
                  <div className="rounded-lg bg-[#F5F2EE] p-3 border border-[#E8E4DE]">
                    <p className="font-semibold text-[#1C1814] text-xs uppercase tracking-wide">IVA</p>
                    <p className="mt-1 font-semibold tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>{formatearCOP(valorIVA)}</p>
                  </div>
                </div>
              </div>

              {/* Resumen Financiero Sticky */}
              <ResumenFinanciero budget={budget} />
          </div> {/* Fin Columna Derecha */}
        </fieldset>
        </div>
      )}

      {/* ── MODALES / PANELES ─────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!confirmState}
        title={confirmState?.title ?? ''}
        description={confirmState?.description}
        confirmLabel={confirmState?.confirmLabel ?? 'Eliminar'}
        variant={confirmState?.variant ?? 'danger'}
        onConfirm={confirmState?.onConfirm ?? (() => {})}
        onCancel={() => setConfirmState(null)}
      />

      <ModalCatalogo
        isOpen={catalogoOpen}
        onClose={() => setCatalogoOpen(false)}
        budgetId={budget.id}
        tipoObraInicial={(budget as any).projects?.tipo_obra ?? undefined}
        onImported={() => router.refresh()}
      />

      <PanelAPU
        isOpen={!!activeApuActivity}
        onClose={() => {
          setActiveApuActivity(null);
          router.refresh();
        }}
        activity={activeApuActivity!}
        budgetId={budget.id}
      />

      <ModalVistaPrevia
        open={vistaPreviaOpen}
        onClose={() => setVistaPreviaOpen(false)}
        budget={budget}
        chapters={budget.chapters}
        profile={profile}
      />

      <ModalGuardarPlantilla
        budgetId={budget.id}
        budgetNombre={budget.titulo ?? ''}
        tipoObra={budget.projects?.tipo_obra ?? null}
        isOpen={guardarPlantillaOpen}
        onClose={() => setGuardarPlantillaOpen(false)}
      />
    </div>
  );
}
