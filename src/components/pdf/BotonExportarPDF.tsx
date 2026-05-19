'use client';

import React, { useState } from 'react';
import { Button } from '@/components/shared/Button';
import { FileDown, X, FileText, Settings, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { generarPresupuestoPDF } from '@/actions/pdf';
import { validarAntesDeExportar, type ValidacionExportacion } from '@/lib/presupuestos/validarAntesDeExportar';
import { ModalValidacionExport } from '@/components/presupuestos/ModalValidacionExport';
import type { PDFExportOptions } from '@/types/pdf';

interface BotonExportarPDFProps {
  budget: any;
  profile: any;
}

export function BotonExportarPDF({ budget, profile }: BotonExportarPDFProps) {
  const [showModal, setShowModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidacionExportacion | null>(null);
  const [loading, setLoading] = useState(false);

  const [incluirAPUs, setIncluirAPUs] = useState(false);
  const [incluirRetenciones, setIncluirRetenciones] = useState(true);
  const [incluirGrafico, setIncluirGrafico] = useState(true);
  const [clienteNombre, setClienteNombre] = useState(budget?.projects?.cliente_nombre || '');
  const [vigencia, setVigencia] = useState(budget?.vigencia_dias || 30);

  const doExport = async () => {
    try {
      if (incluirAPUs) {
        let count = 0;
        budget?.chapters?.forEach((ch: any) => {
          count += ch.activities?.filter((a: any) => a.apu || (Array.isArray(a.apus) && a.apus.length > 0))?.length || 0;
        });

        if (count > 20) {
          const confirmar = window.confirm(
            `Has seleccionado incluir APUs detallados.\nEl PDF tendrá aproximadamente ${count + 2} páginas y su generación podría tomar varios segundos.\n\n¿Deseas continuar?`
          );
          if (!confirmar) return;
        }
      }

      setLoading(true);

      const options: PDFExportOptions = {
        incluirAPUs,
        incluirRetenciones,
        incluirGrafico,
        clienteNombre,
        vigencia,
      };

      const result = await generarPresupuestoPDF(budget.id, options);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'No se pudo generar el documento');
      }

      const byteCharacters = atob(result.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      const fileName = `SIPO-${budget?.projects?.nombre || 'Presupuesto'}-${new Date().toISOString().split('T')[0]}${incluirAPUs ? '-Tecnico' : ''}.pdf`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Documento generado exitosamente');
      setShowModal(false);
      setShowValidationModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Ocurrió un error al generar el PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleExportar = () => {
    const validation = validarAntesDeExportar(budget, profile);
    setValidationResult(validation);

    if (!validation.valido) {
      setShowModal(false);
      setShowValidationModal(true);
      return;
    }

    doExport();
  };

  const handleExportarDeTodasFormas = () => {
    setShowValidationModal(false);
    doExport();
  };

  const handleIrACorregir = () => {
    setShowValidationModal(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  /* Toggle switch reutilizable */
  const toggleClass = "w-9 h-5 bg-[#D0D4DB] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-[#C8CDD6] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#D95510]";

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        variant="secondary"
        size="sm"
        icon={<FileDown className="h-4 w-4" />}
      >
        Exportar PDF
      </Button>

      <ModalValidacionExport
        open={showValidationModal}
        validation={validationResult}
        onClose={() => setShowValidationModal(false)}
        onConfirm={handleExportarDeTodasFormas}
        onFix={handleIrACorregir}
      />

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !loading && setShowModal(false)}
              className="absolute inset-0 bg-[#1A2535]/50 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="px-6 py-4 border-b border-[#D0D4DB] flex items-center justify-between bg-[#ECEEF2]">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-[#D95510]" />
                  <h3 className="text-sm font-bold text-[#1F2937] uppercase tracking-tight">Configuración del PDF</h3>
                </div>
                <button
                  onClick={() => !loading && setShowModal(false)}
                  disabled={loading}
                  className="p-2 hover:bg-[#DDE0E6] rounded-full transition-colors disabled:opacity-50"
                >
                  <X className="h-4 w-4 text-[#6B7A8D]" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="space-y-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-[#1F2937]">Incluir APUs detallados</span>
                      <span className="text-[11px] text-[#6B7A8D]">Genera el PDF Técnico completo</span>
                    </div>
                    <div className="relative inline-flex items-center">
                      <input type="checkbox" className="sr-only peer" checked={incluirAPUs} onChange={e => setIncluirAPUs(e.target.checked)} disabled={loading} />
                      <div className={toggleClass} />
                    </div>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-[#1F2937]">Mostrar Retenciones</span>
                      <span className="text-[11px] text-[#6B7A8D]">En el resumen financiero</span>
                    </div>
                    <div className="relative inline-flex items-center">
                      <input type="checkbox" className="sr-only peer" checked={incluirRetenciones} onChange={e => setIncluirRetenciones(e.target.checked)} disabled={loading} />
                      <div className={toggleClass} />
                    </div>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-[#1F2937]">Gráfico de Distribución</span>
                      <span className="text-[11px] text-[#6B7A8D]">Gráfico circular por capítulos</span>
                    </div>
                    <div className="relative inline-flex items-center">
                      <input type="checkbox" className="sr-only peer" checked={incluirGrafico} onChange={e => setIncluirGrafico(e.target.checked)} disabled={loading} />
                      <div className={toggleClass} />
                    </div>
                  </label>
                </div>

                <div className="pt-4 border-t border-[#D0D4DB] space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#6B7A8D] uppercase">Nombre en Portada (Cliente)</label>
                    <input
                      value={clienteNombre}
                      onChange={e => setClienteNombre(e.target.value)}
                      disabled={loading}
                      className="w-full h-10 px-3 border border-[#C8CDD6] rounded-lg focus:border-[#D95510] focus:ring-2 focus:ring-[#D95510]/20 outline-none text-sm text-[#1F2937] transition-colors disabled:opacity-50"
                      placeholder="Nombre o empresa del cliente"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#6B7A8D] uppercase">Vigencia del Presupuesto (Días)</label>
                    <input
                      type="number"
                      value={vigencia}
                      onChange={e => setVigencia(Number(e.target.value))}
                      disabled={loading}
                      className="w-full h-10 px-3 border border-[#C8CDD6] rounded-lg focus:border-[#D95510] focus:ring-2 focus:ring-[#D95510]/20 outline-none text-sm text-[#1F2937] transition-colors disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-[#ECEEF2] border-t border-[#D0D4DB] flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setShowModal(false)} disabled={loading}>Cancelar</Button>
                <Button
                  loading={loading}
                  icon={incluirAPUs ? <Settings className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                  className="flex-1 bg-[#D95510] hover:bg-[#C04A0D] text-white"
                  onClick={handleExportar}
                >
                  {loading ? 'Generando Documento...' : `Descargar PDF ${incluirAPUs ? 'Técnico' : 'Ejecutivo'}`}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
