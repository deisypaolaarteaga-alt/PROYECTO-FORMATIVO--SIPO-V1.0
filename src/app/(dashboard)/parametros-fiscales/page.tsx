'use client';

import { useState } from 'react';
import {
  Save, Calculator, Percent, Shield, Info,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ParametrosFiscalesPage() {
  const [loading, setLoading] = useState(false);

  const [adminPct, setAdminPct] = useState(10);
  const [imprevPct, setImprevPct] = useState(5);
  const [utilPct, setUtilPct] = useState(10);
  const aiuTotal = adminPct + imprevPct + utilPct;

  const [aplicarIva, setAplicarIva] = useState(true);
  const [ivaPct, setIvaPct] = useState(19);

  const [mostrarRetenciones, setMostrarRetenciones] = useState(true);
  const [reteFuentePct, setReteFuentePct] = useState(2);
  const [ciudadIca, setCiudadIca] = useState('Bogotá');
  const [icaPct, setIcaPct] = useState(0.414);
  const [reteIvaPct, setReteIvaPct] = useState(15);

  const [arlDefault, setArlDefault] = useState(4);

  const handleCiudadChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const ciudad = e.target.value;
    setCiudadIca(ciudad);
    switch (ciudad) {
      case 'Bogotá':       setIcaPct(0.414); break;
      case 'Medellín':     setIcaPct(0.7);   break;
      case 'Cali':         setIcaPct(0.6);   break;
      case 'Barranquilla': setIcaPct(0.6);   break;
      case 'Bucaramanga':  setIcaPct(0.5);   break;
      default:             setIcaPct(0);     break;
    }
  };

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Configuración fiscal guardada correctamente');
    }, 800);
  };

  const arlTable = [
    { nivel: 1, pct: 0.522, color: 'bg-[#EBFAF0] text-[#166534] border-[#B8D9B8]', ej: 'Administrativos, gerencia, ventas' },
    { nivel: 2, pct: 1.044, color: 'bg-[#EBFAF0] text-[#166534] border-[#B8D9B8]', ej: 'Algunas manufacturas y procesos menores' },
    { nivel: 3, pct: 2.436, color: 'bg-[#FEF3E2] text-[#7A4B00] border-[#F0D080]',  ej: 'Plomería, pintura básica, construcción liviana' },
    { nivel: 4, pct: 4.350, color: 'bg-[#FAF0EB] text-[#B8440C] border-[#F0A882]',  ej: 'Construcción estándar, mampostería, obra negra' },
    { nivel: 5, pct: 6.960, color: 'bg-[#FEF0F0] text-[#991B1B] border-[#F5C2C2]', ej: 'Excavaciones, alturas, explosivos, demolición' },
  ];

  const inputClass = "w-full h-10 px-3 border border-[#C8CDD6] rounded-lg focus:border-[#D95510] focus:ring-2 focus:ring-[#D95510]/20 outline-none text-[#1F2937] font-semibold transition-all";
  const toggleClass = "w-11 h-6 bg-[#D0D4DB] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#C8CDD6] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D95510]";

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight">Parámetros Fiscales</h1>
          <p className="text-[#6B7A8D] mt-1 text-sm">
            Define los valores por defecto para AIU, Impuestos y Retenciones de tus nuevos presupuestos.
          </p>
        </div>
        <Button
          onClick={handleSave}
          loading={loading}
          icon={<Save className="h-4 w-4" />}
        >
          Guardar Preferencias
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* COLUMNA IZQUIERDA */}
        <div className="space-y-8">

          {/* AIU */}
          <Card padding="none" className="overflow-hidden border-[#D0D4DB]">
            <div className="bg-[#ECEEF2] px-6 py-4 border-b border-[#D0D4DB] flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-[#FAF0EB] flex items-center justify-center text-[#D95510]">
                <Calculator className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-[#1F2937]">Cálculo AIU Base</h2>
            </div>
            <div className="p-6 space-y-6 bg-white">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#6B7A8D] uppercase">Administración</label>
                  <div className="relative">
                    <input type="number" value={adminPct} onChange={e => setAdminPct(Number(e.target.value))} className={cn(inputClass, "pr-8")} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7A8D] font-bold">%</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#6B7A8D] uppercase">Imprevistos</label>
                  <div className="relative">
                    <input type="number" value={imprevPct} onChange={e => setImprevPct(Number(e.target.value))} className={cn(inputClass, "pr-8")} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7A8D] font-bold">%</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#6B7A8D] uppercase">Utilidad</label>
                  <div className="relative">
                    <input type="number" value={utilPct} onChange={e => setUtilPct(Number(e.target.value))} className={cn(inputClass, "pr-8")} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7A8D] font-bold">%</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-[#ECEEF2] rounded-lg border border-[#D0D4DB]">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-[#D95510]" />
                  <span className="text-xs text-[#4B5563] font-medium">Se aplica sobre el costo directo total</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#6B7A8D] uppercase">Total AIU</span>
                  <span className="text-2xl font-bold text-[#D95510]">{aiuTotal}%</span>
                </div>
              </div>
            </div>
          </Card>

          {/* IVA */}
          <Card padding="none" className="overflow-hidden border-[#D0D4DB]">
            <div className="bg-[#ECEEF2] px-6 py-4 border-b border-[#D0D4DB] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-[#EBF2FA] flex items-center justify-center text-[#1E4D8C]">
                  <Percent className="h-4 w-4" />
                </div>
                <h2 className="text-base font-bold text-[#1F2937]">Configuración de IVA</h2>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={aplicarIva} onChange={e => setAplicarIva(e.target.checked)} />
                <div className={toggleClass} />
              </label>
            </div>
            <div className={cn("p-6 space-y-4 bg-white transition-opacity", !aplicarIva && "opacity-50 pointer-events-none")}>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#6B7A8D] uppercase">Porcentaje de IVA</label>
                <select value={ivaPct} onChange={e => setIvaPct(Number(e.target.value))} className={inputClass}>
                  <option value={0}>0% — Sin IVA</option>
                  <option value={5}>5% — IVA Reducido</option>
                  <option value={19}>19% — IVA General</option>
                </select>
              </div>
              <div className="p-4 bg-[#EBF2FA] rounded-lg border border-[#A8C4DC] space-y-2">
                <p className="text-sm font-bold text-[#1E4D8C]">Base de Aplicación</p>
                <p className="text-xs text-[#1E4D8C]/80">
                  Según la <strong>Ley 1819 de 2016</strong> en contratos de construcción, el IVA se calcula
                  <span className="font-bold"> únicamente sobre la Utilidad</span> declarada en el AIU, no sobre el costo total de la obra.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="space-y-8">

          {/* RETENCIONES */}
          <Card padding="none" className="overflow-hidden border-[#D0D4DB]">
            <div className="bg-[#ECEEF2] px-6 py-4 border-b border-[#D0D4DB] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-[#FAF0EB] flex items-center justify-center text-[#D95510]">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <h2 className="text-base font-bold text-[#1F2937]">Retenciones (Informativo)</h2>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={mostrarRetenciones} onChange={e => setMostrarRetenciones(e.target.checked)} />
                <div className={toggleClass} />
              </label>
            </div>
            <div className={cn("p-6 space-y-5 bg-white transition-opacity", !mostrarRetenciones && "opacity-50 pointer-events-none")}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#6B7A8D] uppercase">ReteFuente</label>
                  <div className="relative">
                    <input type="number" step="0.1" value={reteFuentePct} onChange={e => setReteFuentePct(Number(e.target.value))} className={cn(inputClass, "pr-8")} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7A8D] font-bold">%</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#6B7A8D] uppercase">ReteIVA</label>
                  <div className="relative">
                    <input type="number" step="1" value={reteIvaPct} onChange={e => setReteIvaPct(Number(e.target.value))} className={cn(inputClass, "pr-8")} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7A8D] font-bold">%</span>
                  </div>
                  <p className="text-[10px] text-[#6B7A8D]">Sobre valor del IVA</p>
                </div>
              </div>
              <div className="space-y-1.5 border-t border-[#D0D4DB] pt-4">
                <label className="text-xs font-bold text-[#6B7A8D] uppercase">ReteICA Municipal</label>
                <div className="flex gap-3">
                  <select value={ciudadIca} onChange={handleCiudadChange} className={cn(inputClass, "flex-1")}>
                    <option value="Bogotá">Bogotá (0.414%)</option>
                    <option value="Medellín">Medellín (0.7%)</option>
                    <option value="Cali">Cali (0.6%)</option>
                    <option value="Barranquilla">Barranquilla (0.6%)</option>
                    <option value="Bucaramanga">Bucaramanga (0.5%)</option>
                    <option value="Otra">Otra ciudad...</option>
                  </select>
                  <div className="relative w-28">
                    <input
                      type="number" step="0.001" value={icaPct}
                      onChange={e => setIcaPct(Number(e.target.value))}
                      disabled={ciudadIca !== 'Otra'}
                      className={cn(inputClass, "pr-8 disabled:bg-[#ECEEF2] disabled:text-[#6B7A8D]")}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7A8D] font-bold">%</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-[#FEF3E2] rounded-lg border border-[#F0D080]">
                <Info className="h-5 w-5 text-[#7A4B00] shrink-0 mt-0.5" />
                <p className="text-xs text-[#7A4B00] leading-relaxed">
                  <strong>Las retenciones son informativas.</strong> No aumentan el valor del presupuesto para tu cliente;
                  son descuentos que la empresa o entidad contratante aplica al momento de pagarte para reportar a la DIAN/Municipio.
                </p>
              </div>
            </div>
          </Card>

          {/* ARL */}
          <Card padding="none" className="overflow-hidden border-[#D0D4DB]">
            <div className="bg-[#ECEEF2] px-6 py-4 border-b border-[#D0D4DB] flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-[#EBFAF0] flex items-center justify-center text-[#166534]">
                <Shield className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-[#1F2937]">Riesgo Laboral (ARL)</h2>
            </div>
            <div className="p-6 space-y-4 bg-white">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#6B7A8D] uppercase">Nivel de Riesgo Default para Cuadrillas</label>
                <select value={arlDefault} onChange={e => setArlDefault(Number(e.target.value))} className={inputClass}>
                  <option value={1}>Riesgo I (0.522%)</option>
                  <option value={2}>Riesgo II (1.044%)</option>
                  <option value={3}>Riesgo III (2.436%)</option>
                  <option value={4}>Riesgo IV (4.350%) — Construcción Mampostería</option>
                  <option value={5}>Riesgo V (6.960%) — Construcción Alturas/Excavación</option>
                </select>
              </div>
              <div className="border border-[#D0D4DB] rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#DDE0E6] border-b border-[#D0D4DB]">
                    <tr>
                      <th className="px-3 py-2 font-bold text-[#6B7A8D] uppercase tracking-wide">Nivel</th>
                      <th className="px-3 py-2 font-bold text-[#6B7A8D] uppercase tracking-wide text-right">Tarifa</th>
                      <th className="px-3 py-2 font-bold text-[#6B7A8D] uppercase tracking-wide">Ejemplo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E7EC]">
                    {arlTable.map(r => (
                      <tr key={r.nivel} className={cn("transition-colors", arlDefault === r.nivel ? "bg-[#DDE0E6]" : "bg-[#E4E7EC] hover:bg-[#DDE0E6]")}>
                        <td className="px-3 py-2">
                          <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border", r.color)}>
                            Riesgo {r.nivel}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-bold text-[#1F2937] text-right tabular-nums">{r.pct.toFixed(3)}%</td>
                        <td className="px-3 py-2 text-[#6B7A8D]">{r.ej}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
