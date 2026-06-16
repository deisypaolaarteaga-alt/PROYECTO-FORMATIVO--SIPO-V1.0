'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Folder,
  FileText,
  ChevronRight,
  ArrowLeft,
  Layout,
  X,
  Loader2,
  Building2,
  Trash2,
  Home,
  Store,
  Hammer,
  School,
  Factory,
  BedDouble,
  BookmarkCheck,
  Layers,
  Tag,
  CopyCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { cn } from '@/lib/utils';
import { MunicipioCombobox } from '@/components/clientes/MunicipioCombobox';
import { crearPresupuesto } from '@/actions/presupuestos';
import { crearPresupuestoConPlantilla } from '@/actions/catalogo';
import { aplicarPlantilla, getMisPlantillas } from '@/actions/plantillas';
import { getProjects } from '@/actions/proyectos';
import { toast } from 'sonner';
import { PLANTILLAS_CAPITULOS } from '@/types';
import type { Project, UserPlantilla, ModoAplicarPlantilla } from '@/types';

type TipoObraCatalogo = 'residencial' | 'comercial' | 'industrial' | 'infraestructura' | 'institucional' | 'hotelero';

const TIPOS_OBRA: { id: TipoObraCatalogo; label: string; desc: string; icon: React.ElementType }[] = [
  { id: 'residencial',    label: 'Residencial',    desc: 'Vivienda, apartamentos, casas',      icon: Home     },
  { id: 'comercial',      label: 'Comercial',      desc: 'Locales, oficinas, bodegas',          icon: Store    },
  { id: 'industrial',     label: 'Industrial',     desc: 'Bodegas, plantas, fábricas',          icon: Factory  },
  { id: 'infraestructura',label: 'Infraestructura',desc: 'Vías, urbanismo, redes',              icon: Hammer   },
  { id: 'institucional',  label: 'Institucional',  desc: 'Colegios, hospitales, oficinas públicas', icon: School   },
  { id: 'hotelero',       label: 'Hotelero',       desc: 'Hoteles, hostales, zonas húmedas',    icon: BedDouble},
];

function normalizarTipo(tipoObra?: string | null): TipoObraCatalogo {
  if (!tipoObra) return 'residencial';
  const t = tipoObra.toLowerCase().trim();
  const conocidos: TipoObraCatalogo[] = ['residencial', 'comercial', 'industrial', 'infraestructura', 'institucional', 'hotelero'];
  if (conocidos.includes(t as TipoObraCatalogo)) return t as TipoObraCatalogo;
  if (t.includes('hotel')) return 'hotelero';
  if (t.includes('institucional')) return 'institucional';
  if (t.includes('industrial')) return 'industrial';
  if (t.includes('comercial')) return 'comercial';
  if (t.includes('infraestructura') || t.includes('vial')) return 'infraestructura';
  return 'residencial';
}

interface ModalNuevoPresupuestoProps {
  isOpen: boolean;
  onClose: () => void;
  proyectoId?: string;
  proyectoNombre?: string;
  proyectoTipoObra?: string;
  proyectoUbicacion?: string | null;
  initialPlantillaId?: string;
}

export function ModalNuevoPresupuesto({
  isOpen,
  onClose,
  proyectoId,
  proyectoNombre,
  proyectoTipoObra,
  proyectoUbicacion,
  initialPlantillaId,
}: ModalNuevoPresupuestoProps) {
  const proyectoFijo = !!proyectoId;

  const [step, setStep] = useState(proyectoFijo ? 2 : 1);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [fetchingProjects, setFetchingProjects] = useState(!proyectoFijo);

  // Form state
  const [selectedProjectId, setSelectedProjectId] = useState<string>(proyectoId ?? '');
  const [budgetName, setBudgetName] = useState('');
  const [startingPoint, setStartingPoint] = useState<'blank' | 'template' | 'ai' | 'plantilla_propia'>('blank');
  const [selectedTipoObra, setSelectedTipoObra] = useState<TipoObraCatalogo>(
    normalizarTipo(proyectoTipoObra)
  );
  const [customChapters, setCustomChapters] = useState<string[]>([]);
  const [ciudadObra, setCiudadObra] = useState('');

  // Plantillas personales
  const [misPlantillas, setMisPlantillas] = useState<UserPlantilla[]>([]);
  const [loadingPlantillas, setLoadingPlantillas] = useState(false);
  const [selectedPlantillaId, setSelectedPlantillaId] = useState<string>('');
  const [modoPlantilla, setModoPlantilla] = useState<ModoAplicarPlantilla>('estructura');
  const [mostrarTodasPlantillas, setMostrarTodasPlantillas] = useState(false);

  const router = useRouter();

  const selectedProject = proyectoFijo
    ? { id: proyectoId!, nombre: proyectoNombre ?? '', tipo_obra: proyectoTipoObra ?? '' } as any
    : projects.find(p => p.id === selectedProjectId);

  // Resetear estado cuando el modal se abre/cierra
  useEffect(() => {
    if (isOpen) {
      setStep(proyectoFijo ? 2 : 1);
      setSelectedProjectId(proyectoId ?? '');
      setBudgetName('');
      setStartingPoint(initialPlantillaId ? 'plantilla_propia' : 'blank');
      setSelectedTipoObra(normalizarTipo(proyectoTipoObra));
      setCustomChapters([]);
      setCiudadObra(proyectoUbicacion || '');
      setSelectedPlantillaId(initialPlantillaId ?? '');
      setModoPlantilla('estructura');
      setMostrarTodasPlantillas(false);
      if (!proyectoFijo) loadProjects();
      loadMisPlantillas();
    }
  }, [isOpen]);

  // Cuando el proyecto seleccionado cambia (paso 1→2), pre-llenar tipo y ciudad
  useEffect(() => {
    if (selectedProject?.tipo_obra) {
      setSelectedTipoObra(normalizarTipo(selectedProject.tipo_obra));
    }
    if (selectedProject?.ubicacion) {
      setCiudadObra(selectedProject.ubicacion);
    }
  }, [selectedProjectId]);

  // Cuando cambia el tipo de obra o se activa la plantilla, actualizar los capítulos
  useEffect(() => {
    if (startingPoint === 'template') {
      const capitulos = PLANTILLAS_CAPITULOS[selectedTipoObra] ?? PLANTILLAS_CAPITULOS.residencial;
      setCustomChapters(capitulos);
    }
  }, [selectedTipoObra, startingPoint]);

  async function loadProjects() {
    setFetchingProjects(true);
    try {
      const res = await getProjects();
      if (res) setProjects(res as Project[]);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setFetchingProjects(false);
    }
  }

  async function loadMisPlantillas() {
    setLoadingPlantillas(true);
    try {
      const res = await getMisPlantillas();
      setMisPlantillas(res);
    } catch {
      // Silencioso — no bloquear el flujo si falla
    } finally {
      setLoadingPlantillas(false);
    }
  }

  function handleVolverPaso2() {
    if (proyectoFijo) onClose();
    else setStep(1);
  }

  const handleCreate = async () => {
    if (!selectedProjectId) return toast.error('Selecciona un proyecto');
    if (!budgetName.trim()) return toast.error('Asigna un nombre al presupuesto');

    setLoading(true);
    try {
      let res;

      if (startingPoint === 'template') {
        res = await crearPresupuestoConPlantilla(
          selectedProjectId,
          budgetName,
          customChapters,
          selectedTipoObra,
          ciudadObra || undefined
        );
      } else {
        res = await crearPresupuesto(selectedProjectId, budgetName, ciudadObra || undefined);
      }

      if (res.data) {
        // Si se seleccionó una plantilla propia, aplicarla al presupuesto recién creado
        if (selectedPlantillaId && (res.data as any).id) {
          const applyRes = await aplicarPlantilla(
            selectedPlantillaId,
            (res.data as any).id,
            modoPlantilla
          );
          if (!applyRes.success) {
            toast.warning('Presupuesto creado pero no se pudo aplicar la plantilla propia');
          }
        }
        toast.success('Presupuesto creado con éxito');
        onClose();
        router.push(`/presupuestos/${(res.data as any).id}`);
      } else {
        toast.error(res.error || 'Error al crear');
      }
    } catch (error) {
      toast.error('Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const addChapter = () => setCustomChapters([...customChapters, 'Nuevo Capítulo']);
  const removeChapter = (index: number) => setCustomChapters(customChapters.filter((_, i) => i !== index));
  const updateChapter = (index: number, val: string) => {
    const next = [...customChapters];
    next[index] = val;
    setCustomChapters(next);
  };

  const tipoLabel = TIPOS_OBRA.find(t => t.id === selectedTipoObra)?.label ?? 'Residencial';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-steel-dark/60 backdrop-blur-sm animate-fade-in" onClick={() => { if (!loading) onClose(); }} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-scale-in">

        {/* Header */}
        <div className="px-6 py-4 border-b border-concrete flex items-center justify-between bg-sand rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-burn-orange/10 flex items-center justify-center">
              <Plus className="h-4 w-4 text-burn-orange" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-ink">Nuevo Presupuesto</h3>
              <p className="text-[11px] text-stone font-medium uppercase tracking-wider">
                {proyectoFijo
                  ? `Paso ${step - 1} de ${startingPoint === 'template' ? 2 : 1}`
                  : `Paso ${step} de ${startingPoint === 'template' ? 3 : 2}`}
              </p>
            </div>
          </div>
          <button
            onClick={() => { if (!loading) onClose(); }}
            disabled={loading}
            className="p-2 hover:bg-concrete rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X className="h-4 w-4 text-stone" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">

          {step === 1 && (
            <div className="space-y-6 animate-slide-right">
              <div className="space-y-2">
                <label className="text-[14px] font-bold text-ink flex items-center gap-2">
                  <Folder className="h-4 w-4 text-steel-mid" />
                  ¿A qué proyecto pertenece?
                </label>
                <p className="text-[12px] text-stone">Selecciona un proyecto existente para organizar tu presupuesto.</p>
              </div>

              {fetchingProjects ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 text-burn-orange animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                      {projects.map((p, idx) => (
                        <button
                          key={p.id || `p-${idx}`}
                          onClick={() => setSelectedProjectId(p.id)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                            selectedProjectId === p.id
                              ? "border-burn-orange bg-burn-orange/5 ring-1 ring-burn-orange"
                              : "border-concrete hover:border-[#E8571A]/20 hover:bg-[#FFF4EF]"
                          )}
                        >
                          <Building2 className={cn("h-4 w-4", selectedProjectId === p.id ? "text-burn-orange" : "text-stone")} />
                          <div>
                            <p className={cn("text-[13px] font-bold", selectedProjectId === p.id ? "text-ink" : "text-charcoal")}>{p.nombre}</p>
                            <p className="text-[10px] text-stone uppercase tracking-wider">{p.tipo_obra || 'Sin tipo'}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 border-2 border-dashed border-concrete rounded-2xl">
                      <p className="text-[12px] text-stone mb-3">No tienes proyectos creados aún.</p>
                    </div>
                  )}

                  <button
                    onClick={() => window.location.href = '/proyectos/nuevo'}
                    className="w-full py-3 flex items-center justify-center gap-2 text-[13px] font-bold text-burn-orange hover:bg-burn-orange/5 rounded-xl border border-dashed border-burn-orange/30 transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    Crear nuevo proyecto
                  </button>
                </div>
              )}

            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-slide-left">
              <button
                onClick={handleVolverPaso2}
                className="flex items-center gap-1.5 text-[12px] text-stone hover:text-ink font-medium transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {proyectoFijo ? 'Cancelar' : 'Volver al proyecto'}
              </button>

              <div className="space-y-4">
                {/* Proyecto prellenado (no editable) cuando viene desde la página del proyecto */}
                {proyectoFijo && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sand border border-concrete">
                    <Building2 className="h-4 w-4 text-burn-orange shrink-0" />
                    <div>
                      <p className="text-[12px] text-stone uppercase tracking-wider font-medium">Proyecto</p>
                      <p className="text-[14px] font-bold text-ink">{proyectoNombre}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[14px] font-bold text-ink">Nombre del presupuesto</label>
                  <input
                    autoFocus
                    placeholder="Ej: Presupuesto Inicial de Obra"
                    value={budgetName}
                    onChange={e => setBudgetName(e.target.value)}
                    className="w-full h-12 px-4 text-[14px] border border-concrete rounded-xl focus:border-burn-orange outline-none shadow-sm transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <MunicipioCombobox
                    value={ciudadObra}
                    onChange={setCiudadObra}
                    label="Ciudad de la obra"
                    placeholder="Buscar municipio..."
                  />
                  <p className="text-[11px] text-stone">Determina la tarifa ICA aplicable al presupuesto.</p>
                </div>

                <div className="space-y-3">
                  <label className="text-[13px] font-bold text-ink">¿Cómo quieres empezar?</label>

                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { id: 'blank',    label: 'Presupuesto en blanco', desc: 'Creación manual desde cero',               icon: FileText, disabled: false },
                      { id: 'template', label: 'Plantilla sugerida',    desc: 'Capítulos predefinidos por tipo de obra',  icon: Layout,   disabled: false },
                    ].map(opt => (
                      <button
                        key={opt.id}
                        disabled={opt.disabled}
                        onClick={() => { setStartingPoint(opt.id as any); setSelectedPlantillaId(''); }}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-2xl border text-left transition-all",
                          startingPoint === opt.id
                            ? "border-burn-orange bg-burn-orange/5 ring-1 ring-burn-orange shadow-md"
                            : "border-concrete hover:border-[#E8571A]/20 hover:bg-[#FFF4EF]",
                          opt.disabled && "opacity-50 cursor-not-allowed grayscale"
                        )}
                      >
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                          startingPoint === opt.id ? "bg-burn-orange text-white" : "bg-sand text-stone"
                        )}>
                          <opt.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-ink">{opt.label}</p>
                          <p className="text-[11px] text-stone">{opt.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mis plantillas personales */}
                {(misPlantillas.length > 0 || loadingPlantillas) && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <BookmarkCheck className="h-4 w-4 text-burn-orange" />
                      <label className="text-[13px] font-bold text-ink">Mis plantillas</label>
                    </div>

                    {loadingPlantillas ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 text-burn-orange animate-spin" />
                      </div>
                    ) : (() => {
                      const tipoCtx = selectedProject?.tipo_obra as string | undefined | null;
                      const recomendadas = tipoCtx
                        ? misPlantillas.filter(p => p.tipo_obra === tipoCtx)
                        : [];
                      const otras = tipoCtx
                        ? misPlantillas.filter(p => p.tipo_obra !== tipoCtx)
                        : misPlantillas;

                      const renderPlantillaBtn = (pt: UserPlantilla) => (
                        <button
                          key={pt.id}
                          onClick={() => {
                            setSelectedPlantillaId(pt.id);
                            setStartingPoint('plantilla_propia');
                          }}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                            selectedPlantillaId === pt.id
                              ? "border-burn-orange bg-burn-orange/5 ring-1 ring-burn-orange shadow-md"
                              : "border-concrete hover:border-[#E8571A]/20 hover:bg-[#FFF4EF]"
                          )}
                        >
                          <div className={cn(
                            "h-9 w-9 rounded-xl flex items-center justify-center shrink-0",
                            selectedPlantillaId === pt.id ? "bg-burn-orange text-white" : "bg-sand text-stone"
                          )}>
                            <BookmarkCheck className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-ink truncate">{pt.nombre}</p>
                            <p className="text-[11px] text-stone">
                              {pt._count?.capitulos ?? 0} capítulos
                              {pt.tipo_obra ? ` · ${pt.tipo_obra}` : ''}
                            </p>
                          </div>
                        </button>
                      );

                      if (recomendadas.length > 0) {
                        const otrasVisible = mostrarTodasPlantillas ? otras : otras.slice(0, 2);
                        return (
                          <div className="space-y-3">
                            {/* Recomendadas */}
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-bold text-burn-orange uppercase tracking-wider flex items-center gap-1">
                                <Tag className="h-3 w-3" /> Recomendadas
                              </p>
                              <div className="grid grid-cols-1 gap-2">
                                {recomendadas.map(renderPlantillaBtn)}
                              </div>
                            </div>
                            {/* Otras */}
                            {otras.length > 0 && (
                              <div className="space-y-1.5">
                                <p className="text-[10px] font-bold text-stone uppercase tracking-wider">
                                  Otras plantillas
                                </p>
                                <div className="grid grid-cols-1 gap-2">
                                  {otrasVisible.map(renderPlantillaBtn)}
                                </div>
                                {otras.length > 2 && (
                                  <button
                                    onClick={() => setMostrarTodasPlantillas(prev => !prev)}
                                    className="flex items-center justify-center gap-1.5 text-[12px] font-semibold text-burn-orange hover:bg-burn-orange/5 py-2 rounded-xl border border-dashed border-burn-orange/30 transition-all w-full"
                                  >
                                    {mostrarTodasPlantillas ? (
                                      <><ChevronUp className="h-3.5 w-3.5" /> Ver menos</>
                                    ) : (
                                      <><ChevronDown className="h-3.5 w-3.5" /> Ver todas ({otras.length - 2} más)</>
                                    )}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      }

                      // Sin agrupación (sin contexto de tipo_obra o sin recomendadas)
                      const visible = mostrarTodasPlantillas ? otras : otras.slice(0, 3);
                      return (
                        <div className="grid grid-cols-1 gap-2">
                          {visible.map(renderPlantillaBtn)}
                          {otras.length > 3 && (
                            <button
                              onClick={() => setMostrarTodasPlantillas(prev => !prev)}
                              className="flex items-center justify-center gap-1.5 text-[12px] font-semibold text-burn-orange hover:bg-burn-orange/5 py-2 rounded-xl border border-dashed border-burn-orange/30 transition-all"
                            >
                              {mostrarTodasPlantillas ? (
                                <><ChevronUp className="h-3.5 w-3.5" /> Ver menos</>
                              ) : (
                                <><ChevronDown className="h-3.5 w-3.5" /> Ver todas ({otras.length - 3} más)</>
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })()}

                    {/* Selector de modo — aparece al seleccionar una plantilla propia */}
                    {selectedPlantillaId && (
                      <div className="mt-3 space-y-2 border border-concrete rounded-xl p-3 bg-sand/40">
                        <p className="text-[12px] font-bold text-ink">Modo de copia</p>
                        <div className="grid grid-cols-1 gap-2">
                          {([
                            { id: 'estructura' as ModoAplicarPlantilla, icon: Layers,    label: 'Solo estructura', desc: 'Capítulos y actividades en cero' },
                            { id: 'todo' as ModoAplicarPlantilla,       icon: CopyCheck, label: 'Todo igual',      desc: 'Copia exacta para obra similar' },
                          ] as { id: ModoAplicarPlantilla; icon: React.ElementType; label: string; desc: string }[]).map(m => {
                            const MIcon = m.icon;
                            return (
                              <button
                                key={m.id}
                                onClick={() => setModoPlantilla(m.id)}
                                className={cn(
                                  "flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all",
                                  modoPlantilla === m.id
                                    ? "border-burn-orange bg-burn-orange/5 ring-1 ring-burn-orange"
                                    : "border-concrete hover:border-steel-light hover:bg-white"
                                )}
                              >
                                <MIcon className={cn("h-4 w-4 shrink-0", modoPlantilla === m.id ? "text-burn-orange" : "text-stone")} />
                                <div>
                                  <p className="text-[12px] font-bold text-ink">{m.label}</p>
                                  <p className="text-[10px] text-stone">{m.desc}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-slide-left">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 text-[12px] text-stone hover:text-ink font-medium transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Volver
              </button>

              {/* Selector tipo de obra */}
              <div className="space-y-2">
                <label className="text-[14px] font-bold text-ink block">Tipo de obra</label>
                {proyectoFijo && proyectoTipoObra && proyectoTipoObra !== 'otro' ? (
                  <p className="text-[11px] text-burn-orange font-medium">
                    Tipo heredado del proyecto — puedes cambiarlo si lo necesitas.
                  </p>
                ) : (
                  <p className="text-[11px] text-stone">Selecciona el tipo para cargar la plantilla correspondiente.</p>
                )}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {TIPOS_OBRA.map(tipo => {
                    const Icon = tipo.icon;
                    const active = selectedTipoObra === tipo.id;
                    return (
                      <button
                        key={tipo.id}
                        onClick={() => setSelectedTipoObra(tipo.id)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all",
                          active
                            ? "border-burn-orange bg-burn-orange/5 ring-1 ring-burn-orange"
                            : "border-concrete hover:border-[#E8571A]/20 hover:bg-[#FFF4EF]"
                        )}
                      >
                        <Icon className={cn("h-5 w-5", active ? "text-burn-orange" : "text-stone")} />
                        <span className={cn("text-[11px] font-bold leading-tight", active ? "text-ink" : "text-charcoal")}>
                          {tipo.label}
                        </span>
                        <span className="text-[9px] text-stone leading-tight">{tipo.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lista de capítulos */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-bold text-ink">
                    Capítulos — {tipoLabel}
                  </label>
                  <button
                    onClick={addChapter}
                    className="text-[12px] font-bold text-burn-orange hover:bg-burn-orange/5 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    + Agregar
                  </button>
                </div>

                {customChapters.length === 0 ? (
                  <div className="text-center py-6 border-2 border-dashed border-concrete rounded-2xl">
                    <p className="text-[12px] text-stone">No hay plantilla disponible para este tipo de obra.</p>
                    <button
                      onClick={addChapter}
                      className="mt-2 text-[12px] font-bold text-burn-orange hover:underline"
                    >
                      Agregar capítulo manualmente
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[260px] overflow-y-auto pr-2 custom-scrollbar">
                    {customChapters.map((ch, idx) => (
                      <div key={idx} className="flex items-center gap-2 group">
                        <div className="h-8 w-8 rounded bg-sand flex items-center justify-center shrink-0 text-[11px] font-bold text-stone">
                          {String(idx + 1).padStart(2, '0')}
                        </div>
                        <input
                          value={ch}
                          onChange={e => updateChapter(idx, e.target.value)}
                          className="flex-1 h-9 px-3 text-[13px] border border-concrete rounded-lg focus:border-burn-orange outline-none bg-white transition-all"
                        />
                        <button
                          onClick={() => removeChapter(idx)}
                          className="p-2 text-stone hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Footer fijo — siempre visible independientemente del scroll del contenido */}
        <div className="shrink-0 px-6 py-4 border-t border-concrete bg-white">
          {step === 1 && (
            <Button
              fullWidth
              disabled={!selectedProjectId}
              onClick={() => setStep(2)}
              icon={<ChevronRight className="h-4 w-4" />}
              className="h-12"
            >
              Continuar
            </Button>
          )}
          {step === 2 && (
            <Button
              fullWidth
              onClick={() => {
                if (startingPoint === 'plantilla_propia') return handleCreate();
                if (startingPoint === 'template') return setStep(3);
                handleCreate();
              }}
              className="h-12 text-[15px]"
              loading={loading}
            >
              {startingPoint === 'plantilla_propia'
                ? 'Crear presupuesto'
                : startingPoint === 'template'
                  ? 'Seleccionar tipo de obra'
                  : 'Crear Presupuesto'}
            </Button>
          )}
          {step === 3 && (
            <Button
              fullWidth
              loading={loading}
              onClick={handleCreate}
              className="h-12 text-[15px]"
            >
              {loading
                ? 'Creando presupuesto con plantilla…'
                : customChapters.length > 0
                  ? `Crear con ${customChapters.length} capítulos`
                  : 'Crear presupuesto en blanco'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
