'use client';

import { useState, useMemo, useEffect } from 'react';
import { BlobProvider } from '@react-pdf/renderer';
import {
  X, Download, FileSpreadsheet, Send, Loader2,
  Building2, Calendar, Clock, FileText, Settings, ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/shared/Button';
import { PresupuestoPDF } from '@/components/pdf/PresupuestoPDF';
import { generarPresupuestoPDF } from '@/actions/pdf';
import { actualizarVigencia } from '@/actions/presupuestos';
import { getAIUComponentes } from '@/actions/aiu-componentes';
import { formatearCOP } from '@/lib/utils/formato-cop';
import type { AIUComponente } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  budget: any;
  chapters?: any[];
  profile: any;
  onEnviarCliente?: () => void;
  onEnviado?: () => void;
}

const toggleClass =
  'w-9 h-5 rounded-full bg-[#D0D4DB] peer-checked:bg-[#D95510] ' +
  "after:content-[''] after:absolute after:top-0.5 after:left-0.5 " +
  'after:bg-white after:border after:border-[#C8CDD6] after:rounded-full ' +
  'after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full ' +
  'peer-checked:after:border-white';

export default function ModalVistaPreviaInner({ open, onClose, budget, chapters, profile, onEnviarCliente }: Props) {
  // Cargar aiuComponentes igual que lo hace el server action pdf.ts
  const [aiuComponentes, setAiuComponentes] = useState<AIUComponente[]>([]);
  useEffect(() => {
    if (!budget?.id) return;
    if (budget?.metodo_aiu === 'detallado') {
      getAIUComponentes(budget.id).then(setAiuComponentes).catch(() => {});
    } else {
      setAiuComponentes([]);
    }
  }, [budget?.id, budget?.metodo_aiu]);

  // Normalizar APU data igual que en pdf.ts: apus[] → apu + apu_items flat
  const budgetCompleto = useMemo(() => {
    const raw = { ...budget, chapters: chapters ?? budget?.chapters ?? [] };
    return {
      ...raw,
      chapters: (raw.chapters as any[]).map((ch: any) => ({
        ...ch,
        activities: (ch.activities || []).map((act: any) => {
          const apuRecord = Array.isArray(act.apus) ? act.apus[0] : (act.apus ?? null);
          return {
            ...act,
            apu: apuRecord ?? act.apu ?? null,
            apu_items: apuRecord?.apu_items ?? act.apu_items ?? [],
          };
        }),
      })),
    };
  }, [budget, chapters]);

  const [opcionesOpen, setOpcionesOpen] = useState(false);
  const [incluirRetenciones, setIncluirRetenciones] = useState(true);
  const [clienteNombre, setClienteNombre] = useState('');
  const [vigencia, setVigencia] = useState<number | ''>(Number(budget?.vigencia_dias) || '');
  const [hojasExcel, setHojasExcel] = useState({
    incluirResumen:      true,
    incluirPresupuesto:  true,
    incluirAPUs:         true,
    incluirInsumos:      true,
    incluirProgramaObra: true,
  });
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [loadingPDFTecnico, setLoadingPDFTecnico] = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);

  // pdfDocument usa los mismos datos que el server action generarPresupuestoPDF:
  // aiuComponentes + duracionMeses + normalización APU en budgetCompleto
  const pdfDocument = useMemo(() => (
    <PresupuestoPDF
      budget={budgetCompleto}
      profile={profile}
      options={{
        incluirAPUs: false,
        incluirRetenciones,
        ...(clienteNombre.trim() && { clienteNombre: clienteNombre.trim() }),
        ...(vigencia !== '' && Number(vigencia) > 0 && { vigencia: Number(vigencia) }),
      }}
      aiuComponentes={aiuComponentes.length > 0 ? aiuComponentes : undefined}
      duracionMeses={Number(budget?.duracion_meses) || undefined}
    />
  ), [budgetCompleto, profile, incluirRetenciones, clienteNombre, vigencia, aiuComponentes]);

  const { subtotalDirecto, totalGeneral } = useMemo(() => {
    const cd = (budgetCompleto.chapters || []).reduce((acc: number, ch: any) =>
      acc + (ch.activities || []).reduce((s: number, a: any) =>
        s + (Number(a.cantidad) * Number(a.precio_unitario) || 0), 0), 0);
    const aiuTotalPct = Number(budgetCompleto.administracion_pct ?? 10)
      + Number(budgetCompleto.imprevistos_pct ?? 5)
      + Number(budgetCompleto.utilidad_pct ?? 10);
    const vAIU = cd * (aiuTotalPct / 100);
    const utilidad = cd * (Number(budgetCompleto.utilidad_pct ?? 10) / 100);
    const subConAIU = cd + vAIU;
    const ivaPct = budgetCompleto.iva_porcentaje != null ? Number(budgetCompleto.iva_porcentaje) : 0;
    let vIVA = 0;
    switch (budgetCompleto.metodo_iva) {
      case 'sobre_utilidad': vIVA = utilidad * ivaPct / 100; break;
      case 'sobre_aiu':      vIVA = vAIU * ivaPct / 100; break;
      case 'sobre_total':    vIVA = subConAIU * ivaPct / 100; break;
    }
    return { subtotalDirecto: cd, totalGeneral: subConAIU + vIVA };
  }, [budgetCompleto]);

  const fechaElaboracion = budget?.created_at
    ? new Intl.DateTimeFormat('es-CO', {
        day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Bogota',
      }).format(new Date(budget.created_at))
    : '—';

  const vigenciaDias = vigencia !== '' && Number(vigencia) > 0
    ? Number(vigencia)
    : Number(budget?.vigencia_dias ?? 0);
  const fechaVigencia = budget?.created_at && vigenciaDias > 0
    ? (() => {
        const d = new Date(budget.created_at);
        d.setDate(d.getDate() + vigenciaDias);
        return new Intl.DateTimeFormat('es-CO', {
          day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Bogota',
        }).format(d);
      })()
    : '—';

  const vigenciaOriginal = Number(budget?.vigencia_dias ?? 0);

  const resolverOpciones = (incluirAPUs: boolean) => ({
    incluirAPUs,
    incluirRetenciones,
    ...(clienteNombre.trim() && { clienteNombre: clienteNombre.trim() }),
    ...(vigencia !== '' && Number(vigencia) > 0 && { vigencia: Number(vigencia) }),
  });

  const guardarVigenciaSiCambio = () => {
    const dias = vigencia !== '' && Number(vigencia) > 0 ? Number(vigencia) : 0;
    if (dias > 0 && dias !== vigenciaOriginal) {
      actualizarVigencia(budget.id, dias).catch(() => {});
    }
  };

  const descargarBlob = (base64: string, fileName: string) => {
    const byteChars = atob(base64);
    const byteArr = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
    const blob = new Blob([byteArr], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDescargarPDF = async () => {
    setLoadingPDF(true);
    try {
      guardarVigenciaSiCambio();
      const result = await generarPresupuestoPDF(budget.id, resolverOpciones(false));
      if (!result.success || !result.data) throw new Error(result.error || 'Error al generar PDF');
      const nombre = budget?.projects?.nombre || 'Presupuesto';
      descargarBlob(result.data, `SIPO-${nombre}-${new Date().toISOString().split('T')[0]}-Ejecutivo.pdf`);
      toast.success('PDF Ejecutivo descargado');
    } catch (err: any) {
      toast.error(err.message || 'No se pudo generar el PDF');
    } finally {
      setLoadingPDF(false);
    }
  };

  const handleDescargarPDFTecnico = async () => {
    setLoadingPDFTecnico(true);
    try {
      guardarVigenciaSiCambio();
      const result = await generarPresupuestoPDF(budget.id, resolverOpciones(true));
      if (!result.success || !result.data) throw new Error(result.error || 'Error al generar PDF');
      const nombre = budget?.projects?.nombre || 'Presupuesto';
      descargarBlob(result.data, `SIPO-${nombre}-${new Date().toISOString().split('T')[0]}-Tecnico.pdf`);
      toast.success('PDF Técnico descargado');
    } catch (err: any) {
      toast.error(err.message || 'No se pudo generar el PDF');
    } finally {
      setLoadingPDFTecnico(false);
    }
  };

  const handleDescargarExcel = async () => {
    setLoadingExcel(true);
    try {
      const { exportarPresupuestoExcel } = await import('@/lib/excel/exportarPresupuestoExcel');
      await exportarPresupuestoExcel(budgetCompleto, profile, hojasExcel, aiuComponentes.length > 0 ? aiuComponentes : undefined);
      toast.success('Excel generado correctamente');
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo generar el Excel');
    } finally {
      setLoadingExcel(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#1A2535]/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2 }}
            className="relative w-[90vw] h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-5 py-3 border-b border-[#D0D4DB] flex items-center justify-between bg-[#ECEEF2] shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#D95510]" />
                <h2 className="text-sm font-bold text-[#1F2937] uppercase tracking-tight">
                  Vista previa — {budget?.titulo || 'Presupuesto'}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-[#DDE0E6] rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-[#6B7A8D]" />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-1 min-h-0">
              {/* PDF Preview — izquierda */}
              <div className="flex-1 min-w-0 bg-[#F4F2EE] border-r border-[#D0D4DB] flex items-center justify-center">
                <BlobProvider
                  key={`${incluirRetenciones}-${clienteNombre}-${vigencia}-${aiuComponentes.length}`}
                  document={pdfDocument}
                >
                  {({ url, loading, error }) => {
                    if (loading) return (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-[#D95510]" />
                        <p className="text-sm text-[#6B7A8D]">Generando vista previa…</p>
                      </div>
                    );
                    if (error || !url) return (
                      <p className="text-sm text-[#6B7A8D]">No se pudo generar la vista previa.</p>
                    );
                    return (
                      <object
                        data={url}
                        type="application/pdf"
                        width="100%"
                        height="100%"
                        style={{ border: 'none' }}
                      >
                        <p className="text-sm text-[#6B7A8D] p-4">
                          Tu navegador no soporta la vista previa de PDF.{' '}
                          <a href={url} download className="text-[#D95510] underline">Descargar PDF</a>
                        </p>
                      </object>
                    );
                  }}
                </BlobProvider>
              </div>

              {/* Panel derecho — sin scroll, height fijo */}
              <div className="w-[360px] shrink-0 flex flex-col overflow-hidden">

                {/* KPIs + fechas */}
                <div className="p-5 border-b border-[#D0D4DB] space-y-3 shrink-0">
                  <h3 className="text-sm font-bold text-[#1F2937] line-clamp-2 leading-snug">
                    {budget?.titulo || 'Sin título'}
                  </h3>

                  {budget?.projects?.nombre && (
                    <div className="flex items-center gap-1.5 text-xs text-[#6B7A8D]">
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{budget.projects.nombre}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#FFF5F0] rounded-xl p-3">
                      <p className="text-[10px] font-bold text-[#D95510] uppercase tracking-wide mb-0.5">
                        Total Oferta
                      </p>
                      <p className="text-base font-bold text-[#1F2937] truncate">
                        {formatearCOP(totalGeneral)}
                      </p>
                    </div>
                    <div className="bg-[#F4F2EE] rounded-xl p-3">
                      <p className="text-[10px] font-bold text-[#6B7A8D] uppercase tracking-wide mb-0.5">
                        Costo Directo
                      </p>
                      <p className="text-sm font-semibold text-[#1F2937] truncate">
                        {formatearCOP(subtotalDirecto)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-[#6B7A8D]">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>Elaborado: {fechaElaboracion}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#6B7A8D]">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>Vigente hasta: {fechaVigencia}</span>
                    </div>
                  </div>
                </div>

                {/* Acciones — siempre visibles, sin scroll */}
                <div className="p-4 border-b border-[#D0D4DB] space-y-2 shrink-0">
                  <Button
                    onClick={handleDescargarPDF}
                    loading={loadingPDF}
                    icon={<Download className="h-4 w-4" />}
                    className="w-full justify-center bg-[#D95510] hover:bg-[#C04A0D] text-white"
                  >
                    {loadingPDF ? 'Generando…' : 'PDF Ejecutivo'}
                  </Button>

                  <Button
                    onClick={handleDescargarPDFTecnico}
                    loading={loadingPDFTecnico}
                    variant="secondary"
                    icon={<FileText className="h-4 w-4" />}
                    className="w-full justify-center"
                  >
                    {loadingPDFTecnico ? 'Generando…' : 'PDF Técnico (con APUs)'}
                  </Button>

                  <Button
                    onClick={handleDescargarExcel}
                    loading={loadingExcel}
                    variant="secondary"
                    icon={<FileSpreadsheet className="h-4 w-4 text-[#2E7D32]" />}
                    className="w-full justify-center"
                  >
                    {loadingExcel ? 'Generando…' : 'Descargar Excel'}
                  </Button>

                  {onEnviarCliente && (
                    <Button
                      onClick={onEnviarCliente}
                      variant="secondary"
                      icon={<Send className="h-4 w-4" />}
                      className="w-full justify-center border-[#2563EB] text-[#2563EB] hover:bg-[#EFF6FF] hover:border-[#2563EB]"
                    >
                      Enviar al cliente
                    </Button>
                  )}
                </div>

                {/* Opciones colapsable — zona scrolleable si el contenido no cabe */}
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <button
                    onClick={() => setOpcionesOpen(prev => !prev)}
                    className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-[#F4F2EE] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-[#6B7A8D]" />
                      <span className="text-sm font-semibold text-[#1F2937]">Opciones</span>
                    </div>
                    <motion.div
                      animate={{ rotate: opcionesOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="h-4 w-4 text-[#6B7A8D]" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {opcionesOpen && (
                      <motion.div
                        key="opciones"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-4 space-y-3">
                          {/* Toggle retenciones */}
                          <label className="flex items-center justify-between gap-3 cursor-pointer pt-1">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[#1F2937]">Mostrar retenciones</p>
                              <p className="text-[11px] text-[#6B7A8D]">En el resumen financiero</p>
                            </div>
                            <div className="relative inline-flex items-center shrink-0">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={incluirRetenciones}
                                onChange={e => setIncluirRetenciones(e.target.checked)}
                              />
                              <div className={toggleClass} />
                            </div>
                          </label>

                          {/* Nombre en portada */}
                          <div>
                            <label className="block text-[11px] font-semibold text-[#1F2937] mb-1">
                              Nombre en portada (cliente)
                            </label>
                            <input
                              type="text"
                              value={clienteNombre}
                              onChange={e => setClienteNombre(e.target.value)}
                              placeholder={
                                (budget as any)?.projects?.clientes?.nombre_razon_social ||
                                'Nombre del cliente o contratante'
                              }
                              className="w-full h-8 px-2.5 text-xs rounded-lg border border-[#D0D4DB] bg-[#F8F7F5] focus:outline-none focus:ring-1 focus:ring-[#D95510]/40 text-[#1F2937] placeholder:text-[#B0B8C4]"
                            />
                          </div>

                          {/* Vigencia */}
                          <div>
                            <label className="block text-[11px] font-semibold text-[#1F2937] mb-1">
                              Vigencia (días)
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={365}
                              value={vigencia}
                              onChange={e => setVigencia(e.target.value === '' ? '' : Math.min(365, Math.max(1, parseInt(e.target.value) || 1)))}
                              placeholder="30"
                              className="w-full h-8 px-2.5 text-xs rounded-lg border border-[#D0D4DB] bg-[#F8F7F5] focus:outline-none focus:ring-1 focus:ring-[#D95510]/40 text-[#1F2937] placeholder:text-[#B0B8C4]"
                            />
                          </div>

                          {/* Hojas Excel */}
                          <div className="pt-1 border-t border-[#E8E4DE]">
                            <p className="text-[11px] font-semibold text-[#6B7A8D] uppercase tracking-wide mb-2">
                              Hojas Excel a incluir
                            </p>
                            {([
                              { key: 'incluirResumen',     label: 'Resumen Financiero'   },
                              { key: 'incluirPresupuesto',  label: 'Presupuesto de Obra'  },
                              { key: 'incluirAPUs',         label: 'APUs Detallados'      },
                              { key: 'incluirInsumos',      label: 'Explosión de Insumos' },
                              { key: 'incluirProgramaObra', label: 'Programa de Obra'     },
                            ] as { key: keyof typeof hojasExcel; label: string }[]).map(({ key, label }) => (
                              <label key={key} className="flex items-center gap-2.5 cursor-pointer py-0.5">
                                <input
                                  type="checkbox"
                                  className="h-3.5 w-3.5 rounded border-[#D0D4DB] accent-[#D95510] cursor-pointer"
                                  checked={hojasExcel[key]}
                                  onChange={e => setHojasExcel(prev => ({ ...prev, [key]: e.target.checked }))}
                                />
                                <span className="text-sm text-[#1F2937]">{label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Botón Cerrar — ghost, al fondo, siempre visible */}
                <div className="p-4 border-t border-[#D0D4DB] shrink-0">
                  <Button
                    onClick={onClose}
                    variant="ghost"
                    className="w-full justify-center text-[#6B7A8D] hover:text-[#1F2937]"
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
