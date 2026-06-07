'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookmarkCheck, Layers, MoreVertical, Trash2, FileText, Plus, Pencil, Eye, Search, X, Tag,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/shared/DropdownMenu';
import { eliminarPlantilla, actualizarTipoObraPlantilla } from '@/actions/plantillas';
import { toast } from 'sonner';
import { ModalRenombrarPlantilla } from './ModalRenombrarPlantilla';
import { DrawerDetallePlantilla } from './DrawerDetallePlantilla';
import { ModalNuevoPresupuesto } from '@/components/presupuestos/ModalNuevoPresupuesto';
import type { UserPlantilla } from '@/types';

interface PlantillasClientProps {
  initialPlantillas: UserPlantilla[];
}

const TIPO_CONFIG: Record<string, {
  headerBg: string;
  iconBg: string;
  iconColor: string;
  pillBg: string;
  pillText: string;
  pillBorder: string;
  label: string;
}> = {
  residencial:    { headerBg: 'bg-orange-50',  iconBg: 'bg-orange-100',  iconColor: 'text-orange-600',  pillBg: 'bg-orange-50',  pillText: 'text-orange-700',  pillBorder: 'border-orange-200',  label: 'Residencial'    },
  comercial:      { headerBg: 'bg-blue-50',    iconBg: 'bg-blue-100',    iconColor: 'text-[#1E6FB8]',   pillBg: 'bg-blue-50',    pillText: 'text-blue-700',    pillBorder: 'border-blue-200',    label: 'Comercial'      },
  institucional:  { headerBg: 'bg-green-50',   iconBg: 'bg-green-100',   iconColor: 'text-green-700',   pillBg: 'bg-green-50',   pillText: 'text-green-700',   pillBorder: 'border-green-200',   label: 'Institucional'  },
  industrial:     { headerBg: 'bg-gray-100',   iconBg: 'bg-gray-200',    iconColor: 'text-gray-600',    pillBg: 'bg-gray-100',   pillText: 'text-gray-700',    pillBorder: 'border-gray-300',    label: 'Industrial'     },
  hotelero:       { headerBg: 'bg-purple-50',  iconBg: 'bg-purple-100',  iconColor: 'text-purple-700',  pillBg: 'bg-purple-50',  pillText: 'text-purple-700',  pillBorder: 'border-purple-200',  label: 'Hotelero'       },
  infraestructura:{ headerBg: 'bg-yellow-50',  iconBg: 'bg-yellow-100',  iconColor: 'text-yellow-700',  pillBg: 'bg-amber-50',   pillText: 'text-amber-700',   pillBorder: 'border-amber-200',   label: 'Infraestructura'},
  otro:           { headerBg: 'bg-[#F5F4F0]', iconBg: 'bg-[#ECEAE5]',  iconColor: 'text-[#78716C]',   pillBg: 'bg-[#F5F4F0]', pillText: 'text-[#78716C]',   pillBorder: 'border-[#E5E1D8]',   label: 'Otro'           },
};

const TIPO_DEFAULT = {
  headerBg:   'bg-[#F5F4F0]',
  iconBg:     'bg-[#ECEAE5]',
  iconColor:  'text-[#78716C]',
  pillBg:     'bg-[#F5F4F0]',
  pillText:   'text-[#78716C]',
  pillBorder: 'border-[#E5E1D8]',
  label:      'Sin clasificar',
};

const FILTER_OPTIONS = [
  { value: 'todas',           label: 'Todas'          },
  { value: 'residencial',     label: 'Residencial'    },
  { value: 'comercial',       label: 'Comercial'      },
  { value: 'institucional',   label: 'Institucional'  },
  { value: 'industrial',      label: 'Industrial'     },
  { value: 'hotelero',        label: 'Hotelero'       },
  { value: 'infraestructura', label: 'Infraestructura'},
  { value: 'sin_clasificar',  label: 'Sin clasificar' },
];

function formatFecha(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export function PlantillasClient({ initialPlantillas }: PlantillasClientProps) {
  const [plantillas, setPlantillas] = useState(initialPlantillas);
  useEffect(() => setPlantillas(initialPlantillas), [initialPlantillas]);

  const router = useRouter();

  const [search, setSearch]         = useState('');
  const [tipoFilter, setTipoFilter] = useState('todas');
  const [plantillaRenombrar, setPlantillaRenombrar] = useState<UserPlantilla | null>(null);
  const [plantillaDetalle, setPlantillaDetalle]     = useState<UserPlantilla | null>(null);
  const [plantillaEditarTipo, setPlantillaEditarTipo] = useState<UserPlantilla | null>(null);
  const [guardandoTipo, setGuardandoTipo] = useState(false);
  const [plantillaParaUsar, setPlantillaParaUsar] = useState<UserPlantilla | null>(null);

  const filtered = useMemo(() => {
    return plantillas.filter(pt => {
      const matchSearch = search === '' || pt.nombre.toLowerCase().includes(search.toLowerCase());
      let matchTipo = true;
      if (tipoFilter !== 'todas') {
        if (tipoFilter === 'sin_clasificar') {
          matchTipo = !pt.tipo_obra || !TIPO_CONFIG[pt.tipo_obra];
        } else {
          matchTipo = pt.tipo_obra === tipoFilter;
        }
      }
      return matchSearch && matchTipo;
    });
  }, [plantillas, search, tipoFilter]);

  async function handleGuardarTipo(tipo: string | null) {
    if (!plantillaEditarTipo) return;
    setGuardandoTipo(true);
    const res = await actualizarTipoObraPlantilla(plantillaEditarTipo.id, tipo);
    setGuardandoTipo(false);
    if (res.success) {
      toast.success('Tipo de obra actualizado');
      setPlantillas(prev => prev.map(p =>
        p.id === plantillaEditarTipo.id ? { ...p, tipo_obra: tipo ?? undefined } : p
      ));
      setPlantillaEditarTipo(null);
      router.refresh();
    } else {
      toast.error(res.error ?? 'No se pudo actualizar el tipo de obra');
    }
  }

  async function handleEliminar(id: string, nombre: string) {
    if (!confirm(`¿Eliminar la plantilla "${nombre}"? Esta acción no se puede deshacer.`)) return;
    const res = await eliminarPlantilla(id);
    if (res.success) {
      toast.success('Plantilla eliminada');
      setPlantillas(prev => prev.filter(p => p.id !== id));
      router.refresh();
    } else {
      toast.error(res.error || 'Error al eliminar la plantilla');
    }
  }

  // ── Sin plantillas en absoluto ────────────────────────────────────────────────
  if (plantillas.length === 0) {
    return (
      <div className="bg-white border border-[#E8E4DE] rounded-2xl shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
          <div className="bg-[#F3F4F6] p-4 rounded-full mb-4">
            <BookmarkCheck className="h-8 w-8 text-[#9CA3AF]" />
          </div>
          <h3 className="font-semibold text-[#111827] mb-1">Aún no tienes plantillas guardadas</h3>
          <p className="text-[13px] text-[#6B7280] max-w-xs mb-5">
            Crea un presupuesto y guárdalo como plantilla para reutilizarlo en obras futuras.
          </p>
          <Link
            href="/presupuestos"
            className="h-9 px-4 flex items-center gap-2 bg-[#C84B1A] text-white rounded-lg text-[13px] font-semibold hover:bg-[#A83A14] active:bg-[#8E2E0E] transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Ir a Presupuestos
          </Link>
        </div>
      </div>
    );
  }

  // ── Buscador + filtros + grid ─────────────────────────────────────────────────
  return (
    <>
      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          {/* Input de búsqueda */}
          <div className="relative w-full sm:max-w-[260px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A89F96] pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar plantilla..."
              className="w-full pl-8 pr-7 h-8 rounded-lg border border-[#E8E4DE] bg-white text-[13px] text-[#1C1917] placeholder:text-[#A89F96] focus:outline-none focus:ring-1 focus:ring-[#C84B1A] focus:border-[#C84B1A] transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#A89F96] hover:text-[#78716C] transition-colors"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Pills de tipo de obra */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {FILTER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setTipoFilter(opt.value)}
                className={`h-7 px-2.5 rounded-md text-[11px] font-medium transition-colors border ${
                  tipoFilter === opt.value
                    ? 'bg-[#C84B1A] text-white border-[#C84B1A]'
                    : 'bg-white text-[#78716C] border-[#E8E4DE] hover:bg-[#F5F4F0] hover:border-[#D4CFC8]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contador dinámico */}
        <p className="text-[10px] font-bold text-[#A89F96] uppercase tracking-[0.12em]">
          {filtered.length} plantilla{filtered.length !== 1 ? 's' : ''}
          {(search !== '' || tipoFilter !== 'todas') && ' · filtradas'}
        </p>
      </div>

      {/* Sin resultados para el filtro activo */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-[#E8E4DE] rounded-2xl shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
          <div className="flex flex-col items-center justify-center py-14 text-center px-6">
            <div className="bg-[#F5F4F0] p-3 rounded-full mb-3">
              <Search className="h-5 w-5 text-[#A89F96]" />
            </div>
            <p className="text-[14px] font-semibold text-[#1C1917] mb-1">Sin resultados</p>
            <p className="text-[12px] text-[#78716C] mb-4">
              No hay plantillas que coincidan con el filtro activo.
            </p>
            <button
              onClick={() => { setSearch(''); setTipoFilter('todas'); }}
              className="h-8 px-3 rounded-lg border border-[#E8E4DE] bg-white text-[12px] text-[#78716C] hover:bg-[#F5F4F0] transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(pt => {
            const caps = pt._count?.capitulos ?? 0;
            const tipo = pt.tipo_obra ?? null;
            const cfg  = (tipo && TIPO_CONFIG[tipo]) ? TIPO_CONFIG[tipo] : TIPO_DEFAULT;

            return (
              <div
                key={pt.id}
                className="group relative flex flex-col bg-white border border-[#E8E4DE] rounded-xl shadow-[0_1px_2px_0_rgba(28,24,20,0.04)] hover:shadow-md hover:border-[#D4CFC8] transition-all duration-200 overflow-hidden"
              >
                {/* Header: color por tipo + ícono + pill */}
                <div className={`${cfg.headerBg} px-4 pt-4 pb-3 border-b border-[#E8E4DE] flex items-start gap-3`}>
                  <div className={`w-8 h-8 rounded-lg ${cfg.iconBg} flex items-center justify-center shrink-0 ring-1 ring-black/5`}>
                    <BookmarkCheck className={`h-4 w-4 ${cfg.iconColor}`} />
                  </div>
                  <span className={`mt-0.5 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${cfg.pillBg} ${cfg.pillText} ${cfg.pillBorder}`}>
                    {cfg.label}
                  </span>
                </div>

                {/* Body: nombre */}
                <div className="flex-1 px-4 pt-3.5 pb-3">
                  <p className="text-[14px] font-semibold text-[#1C1917] leading-snug">{pt.nombre}</p>
                </div>

                {/* Footer: meta + menú */}
                <div className="px-4 py-2.5 border-t border-[#F3F4F6] bg-[#FAFAF8] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 text-[11px] text-[#78716C]">
                    <span className="flex items-center gap-1.5">
                      <Layers className="h-3 w-3 shrink-0" />
                      {caps} capítulo{caps !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-3 w-3 shrink-0" />
                      {formatFecha(pt.created_at)}
                    </span>
                  </div>

                  <div className="z-10 shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded-lg hover:bg-[#F0EDE8] text-[#9CA3AF] hover:text-[#374151] opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setPlantillaRenombrar(pt)}>
                          <Pencil className="h-4 w-4 mr-2 text-[#6B7280]" />
                          Renombrar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setPlantillaDetalle(pt)}>
                          <Eye className="h-4 w-4 mr-2 text-[#6B7280]" />
                          Ver / Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setPlantillaEditarTipo(pt)}>
                          <Tag className="h-4 w-4 mr-2 text-[#6B7280]" />
                          Cambiar tipo de obra
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleEliminar(pt.id, pt.nombre)}
                          className="text-red-600 focus:bg-red-50 focus:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Usar plantilla → abre ModalNuevoPresupuesto */}
                <div className="relative z-10 px-3 pb-3 bg-[#FAFAF8]">
                  <button
                    onClick={(e) => { e.stopPropagation(); setPlantillaParaUsar(pt); }}
                    className="w-full h-8 rounded-lg bg-[#C84B1A] text-white text-[12px] font-semibold hover:bg-[#A83A14] active:bg-[#8E2E0E] transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Usar plantilla
                  </button>
                </div>

                {/* Clic invisible → abre drawer */}
                <button
                  onClick={() => setPlantillaDetalle(pt)}
                  className="absolute inset-0 w-full h-full rounded-xl opacity-0"
                  aria-label={`Ver plantilla ${pt.nombre}`}
                  tabIndex={-1}
                />
              </div>
            );
          })}
        </div>
      )}

      <ModalRenombrarPlantilla
        plantilla={plantillaRenombrar}
        isOpen={!!plantillaRenombrar}
        onClose={() => setPlantillaRenombrar(null)}
      />
      <DrawerDetallePlantilla
        plantillaId={plantillaDetalle?.id ?? null}
        nombreInicial={plantillaDetalle?.nombre ?? ''}
        isOpen={!!plantillaDetalle}
        onClose={() => setPlantillaDetalle(null)}
      />
      <ModalNuevoPresupuesto
        isOpen={!!plantillaParaUsar}
        onClose={() => setPlantillaParaUsar(null)}
        initialPlantillaId={plantillaParaUsar?.id}
      />

      {/* Modal cambiar tipo de obra */}
      {plantillaEditarTipo && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#1C1917]/60 backdrop-blur-sm"
            onClick={() => setPlantillaEditarTipo(null)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E8E4DE] flex items-center justify-between bg-[#F5F4F0]/50">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#C84B1A]/10 flex items-center justify-center">
                  <Tag className="h-4 w-4 text-[#C84B1A]" />
                </div>
                <h3 className="text-[15px] font-bold text-[#1C1917]">Tipo de obra</h3>
              </div>
              <button
                onClick={() => setPlantillaEditarTipo(null)}
                className="p-1.5 hover:bg-[#E8E4DE] rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-[#78716C]" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-[12px] text-[#78716C]">
                Plantilla: <span className="font-semibold text-[#1C1917]">{plantillaEditarTipo.nombre}</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'residencial',     label: 'Residencial'     },
                  { value: 'comercial',       label: 'Comercial'       },
                  { value: 'institucional',   label: 'Institucional'   },
                  { value: 'industrial',      label: 'Industrial'      },
                  { value: 'hotelero',        label: 'Hotelero'        },
                  { value: 'infraestructura', label: 'Infraestructura' },
                ] as const).map(opt => {
                  const activo = plantillaEditarTipo.tipo_obra === opt.value;
                  return (
                    <button
                      key={opt.value}
                      disabled={guardandoTipo}
                      onClick={() => handleGuardarTipo(opt.value)}
                      className={`h-10 px-3 rounded-xl border text-[12px] font-semibold transition-all disabled:opacity-50 ${
                        activo
                          ? 'border-[#C84B1A] bg-[#C84B1A]/5 text-[#C84B1A] ring-1 ring-[#C84B1A]'
                          : 'border-[#E8E4DE] bg-white text-[#374151] hover:border-[#C84B1A]/40 hover:bg-[#FFF7F4]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              {plantillaEditarTipo.tipo_obra && (
                <button
                  disabled={guardandoTipo}
                  onClick={() => handleGuardarTipo(null)}
                  className="w-full h-9 text-[12px] text-[#78716C] border border-dashed border-[#D4CFC8] rounded-xl hover:bg-[#F5F4F0] transition-colors disabled:opacity-50"
                >
                  Quitar clasificación
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
