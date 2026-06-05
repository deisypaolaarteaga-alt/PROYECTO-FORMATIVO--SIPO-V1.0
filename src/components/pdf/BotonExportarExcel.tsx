'use client';

import { useState } from 'react';
import { FileSpreadsheet, Settings2, LayoutList, Hammer, Package, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/shared/Button';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '@/components/shared/Modal';
import type { PresupuestoPDFData, ConfigPDFProfesional } from '@/types/pdf';
import type { ExportarExcelOptions } from '@/lib/excel/exportarPresupuestoExcel';

interface Props {
  budget: PresupuestoPDFData;
  profile: ConfigPDFProfesional;
}

interface HojaConfig {
  key: keyof ExportarExcelOptions;
  label: string;
  descripcion: string;
  icon: React.ReactNode;
}

const HOJAS: HojaConfig[] = [
  {
    key: 'incluirResumen',
    label: 'Resumen Financiero',
    descripcion: 'Costo directo, AIU, IVA, Total Oferta y retenciones informativas.',
    icon: <LayoutList className="h-4 w-4 text-[#2E4A63]" />,
  },
  {
    key: 'incluirPresupuesto',
    label: 'Presupuesto de Obra',
    descripcion: 'Capítulos, actividades, cantidades, precios unitarios y totales.',
    icon: <FileSpreadsheet className="h-4 w-4 text-[#2D7A45]" />,
  },
  {
    key: 'incluirAPUs',
    label: 'APUs Detallados',
    descripcion: 'Análisis de Precio Unitario con materiales, mano de obra y equipos por actividad.',
    icon: <Hammer className="h-4 w-4 text-[#E8571A]" />,
  },
  {
    key: 'incluirInsumos',
    label: 'Explosión de Insumos',
    descripcion: 'Consolidado de insumos para toda la obra agrupado por tipo y nombre.',
    icon: <Package className="h-4 w-4 text-[#7A5800]" />,
  },
  {
    key: 'incluirProgramaObra',
    label: 'Programa de Obra',
    descripcion: 'Cronograma semanal por actividad para que el constructor registre el avance.',
    icon: <CalendarDays className="h-4 w-4 text-[#2E4A63]" />,
  },
];

export function BotonExportarExcel({ budget, profile }: Props) {
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [opciones, setOpciones] = useState<ExportarExcelOptions>({
    incluirResumen: true,
    incluirPresupuesto: true,
    incluirAPUs: true,
    incluirInsumos: true,
    incluirProgramaObra: true,
  });

  const todasMarcadas = Object.values(opciones).every(Boolean);
  const ningunaMarcada = Object.values(opciones).every(v => !v);

  const toggleTodas = () => {
    const nuevoValor = !todasMarcadas;
    setOpciones({
      incluirResumen: nuevoValor,
      incluirPresupuesto: nuevoValor,
      incluirAPUs: nuevoValor,
      incluirInsumos: nuevoValor,
      incluirProgramaObra: nuevoValor,
    });
  };

  const handleExportar = async () => {
    if (ningunaMarcada) {
      toast.error('Debe seleccionar al menos una hoja para exportar.');
      return;
    }
    setModalOpen(false);
    setLoading(true);
    try {
      const { exportarPresupuestoExcel } = await import('@/lib/excel/exportarPresupuestoExcel');
      await exportarPresupuestoExcel(budget, profile, opciones);
      const hojasSeleccionadas = HOJAS.filter(h => opciones[h.key]).length;
      toast.success(`Excel generado con ${hojasSeleccionadas} hoja${hojasSeleccionadas !== 1 ? 's' : ''}`);
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo generar el Excel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setModalOpen(true)}
        variant="ghost"
        size="sm"
        loading={loading}
        icon={<FileSpreadsheet className="h-4 w-4" />}
      >
        {loading ? 'Generando…' : 'Exportar Excel'}
      </Button>

      <Modal open={modalOpen} onOpenChange={setModalOpen}>
        <ModalContent className="max-w-md">
          <ModalHeader>
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-[#E8571A]" />
              <ModalTitle>Configurar exportación Excel</ModalTitle>
            </div>
            <ModalDescription className="mt-1">
              Selecciona las hojas que deseas incluir en el archivo <span className="font-medium text-[#1C1814]">.xlsx</span>.
            </ModalDescription>
          </ModalHeader>

          {/* Selector de hojas */}
          <div className="space-y-2 py-1">
            {/* Toggle todas */}
            <button
              type="button"
              onClick={toggleTodas}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg border border-dashed border-[#D0CCC6] text-sm text-[#5A5248] hover:bg-[#F4F2EE] transition-colors"
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${todasMarcadas ? 'bg-[#E8571A] border-[#E8571A]' : 'border-[#C8C0B5] bg-white'}`}>
                {todasMarcadas && (
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className="font-medium">{todasMarcadas ? 'Deseleccionar todas' : 'Seleccionar todas'}</span>
            </button>

            <div className="border-t border-[#E2DDD6] my-2" />

            {HOJAS.map(hoja => {
              const checked = opciones[hoja.key];
              return (
                <button
                  key={hoja.key}
                  type="button"
                  onClick={() => setOpciones(prev => ({ ...prev, [hoja.key]: !prev[hoja.key] }))}
                  className={`w-full flex items-start gap-3 px-3 py-3 rounded-xl border text-left transition-all ${
                    checked
                      ? 'bg-[#FFF0E8] border-[#F07848]'
                      : 'bg-white border-[#E2DDD6] hover:border-[#C8C0B5] hover:bg-[#F4F2EE]'
                  }`}
                >
                  <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${checked ? 'bg-[#E8571A] border-[#E8571A]' : 'border-[#C8C0B5] bg-white'}`}>
                    {checked && (
                      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {hoja.icon}
                      <span className="text-sm font-semibold text-[#1C1814]">{hoja.label}</span>
                    </div>
                    <p className="text-xs text-[#7A7265] mt-0.5 leading-relaxed">{hoja.descripcion}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <ModalFooter className="gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleExportar}
              disabled={ningunaMarcada}
              icon={<FileSpreadsheet className="h-4 w-4" />}
            >
              Generar Excel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
