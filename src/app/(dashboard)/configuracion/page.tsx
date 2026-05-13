'use client';

import { useState } from 'react';
import { 
  Save, Calculator, Percent, Shield, Info,
  Building2, AlertTriangle, CheckCircle2, Loader2 
} from 'lucide-react';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ConfiguracionFiscalPage() {
  const [loading, setLoading] = useState(false);
  
  // AIU State
  const [adminPct, setAdminPct] = useState(10);
  const [imprevPct, setImprevPct] = useState(5);
  const [utilPct, setUtilPct] = useState(10);
  const aiuTotal = adminPct + imprevPct + utilPct;

  // IVA State
  const [aplicarIva, setAplicarIva] = useState(true);
  const [ivaPct, setIvaPct] = useState(19);

  // Retenciones State
  const [mostrarRetenciones, setMostrarRetenciones] = useState(true);
  const [reteFuentePct, setReteFuentePct] = useState(2);
  const [ciudadIca, setCiudadIca] = useState('Bogotá');
  const [icaPct, setIcaPct] = useState(0.414);
  const [reteIvaPct, setReteIvaPct] = useState(15);

  // ARL State
  const [arlDefault, setArlDefault] = useState(4);

  const handleCiudadChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const ciudad = e.target.value;
    setCiudadIca(ciudad);
    
    // Asignar tarifas por defecto según ciudad
    switch(ciudad) {
      case 'Bogotá': setIcaPct(0.414); break;
      case 'Medellín': setIcaPct(0.7); break;
      case 'Cali': setIcaPct(0.6); break;
      case 'Barranquilla': setIcaPct(0.6); break;
      case 'Bucaramanga': setIcaPct(0.5); break;
      default: setIcaPct(0); break; // Otra
    }
  };

  const handleSave = () => {
    setLoading(true);
    // Simular guardado de preferencias en base de datos
    setTimeout(() => {
      setLoading(false);
      toast.success('Configuración fiscal guardada correctamente');
    }, 800);
  };

  const arlTable = [
    { nivel: 1, pct: 0.522, color: 'bg-emerald-100 text-emerald-700 border-emerald-200', ej: 'Administrativos, gerencia, ventas' },
    { nivel: 2, pct: 1.044, color: 'bg-lime-100 text-lime-700 border-lime-200', ej: 'Algunas manufacturas y procesos menores' },
    { nivel: 3, pct: 2.436, color: 'bg-yellow-100 text-yellow-700 border-yellow-200', ej: 'Plomería, pintura básica, construcción liviana' },
    { nivel: 4, pct: 4.350, color: 'bg-orange-100 text-orange-700 border-orange-200', ej: 'Construcción estándar, mampostería, obra negra' },
    { nivel: 5, pct: 6.960, color: 'bg-red-100 text-red-700 border-red-200', ej: 'Excavaciones, alturas, explosivos, demolición' },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Configuración Fiscal</h1>
          <p className="text-slate-500 mt-1">
            Define los valores por defecto (Defaults) para AIU, Impuestos y Retenciones de tus nuevos presupuestos.
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          loading={loading}
          icon={<Save className="h-4 w-4" />}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"
        >
          Guardar Preferencias
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* COLUMNA IZQUIERDA */}
        <div className="space-y-8">
          
          {/* SECCIÓN AIU */}
          <Card padding="none" className="overflow-hidden border-slate-200 shadow-sm">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <Calculator className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Cálculo AIU Base</h2>
            </div>
            
            <div className="p-6 space-y-6 bg-white">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Administración</label>
                  <div className="relative">
                    <input 
                      type="number" value={adminPct} onChange={e => setAdminPct(Number(e.target.value))}
                      className="w-full h-10 px-3 pr-8 border border-slate-200 rounded-lg focus:border-blue-500 outline-none text-slate-700 font-bold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Imprevistos</label>
                  <div className="relative">
                    <input 
                      type="number" value={imprevPct} onChange={e => setImprevPct(Number(e.target.value))}
                      className="w-full h-10 px-3 pr-8 border border-slate-200 rounded-lg focus:border-blue-500 outline-none text-slate-700 font-bold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Utilidad</label>
                  <div className="relative">
                    <input 
                      type="number" value={utilPct} onChange={e => setUtilPct(Number(e.target.value))}
                      className="w-full h-10 px-3 pr-8 border border-slate-200 rounded-lg focus:border-blue-500 outline-none text-slate-700 font-bold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span className="text-xs text-slate-600 font-medium">Se aplica sobre el costo directo total</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-500 uppercase">Total AIU</span>
                  <span className="text-2xl font-black text-blue-600">{aiuTotal}%</span>
                </div>
              </div>
            </div>
          </Card>

          {/* SECCIÓN IVA */}
          <Card padding="none" className="overflow-hidden border-slate-200 shadow-sm">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                  <Percent className="h-4 w-4" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Configuración de IVA</h2>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={aplicarIva} onChange={e => setAplicarIva(e.target.checked)} />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
            
            <div className={cn("p-6 space-y-4 bg-white transition-opacity", !aplicarIva && "opacity-50 pointer-events-none")}>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Porcentaje de IVA</label>
                <select 
                  value={ivaPct} 
                  onChange={e => setIvaPct(Number(e.target.value))}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg focus:border-purple-500 outline-none text-slate-700 font-bold bg-white"
                >
                  <option value={0}>0% - Sin IVA</option>
                  <option value={5}>5% - IVA Reducido</option>
                  <option value={19}>19% - IVA General</option>
                </select>
              </div>

              <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 space-y-2">
                <p className="text-sm font-bold text-purple-900">Base de Aplicación</p>
                <p className="text-xs text-purple-700">
                  Según la <strong>Ley 1819 de 2016</strong> en contratos de construcción, el IVA se calcula 
                  <span className="font-bold"> únicamente sobre la Utilidad</span> declarada en el AIU, no sobre el costo total de la obra.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="space-y-8">
          
          {/* SECCIÓN RETENCIONES */}
          <Card padding="none" className="overflow-hidden border-slate-200 shadow-sm">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Retenciones (Informativo)</h2>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={mostrarRetenciones} onChange={e => setMostrarRetenciones(e.target.checked)} />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>
            
            <div className={cn("p-6 space-y-5 bg-white transition-opacity", !mostrarRetenciones && "opacity-50 pointer-events-none")}>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">ReteFuente</label>
                  <div className="relative">
                    <input 
                      type="number" step="0.1" value={reteFuentePct} onChange={e => setReteFuentePct(Number(e.target.value))}
                      className="w-full h-10 px-3 pr-8 border border-slate-200 rounded-lg focus:border-orange-500 outline-none text-slate-700 font-bold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">ReteIVA</label>
                  <div className="relative">
                    <input 
                      type="number" step="1" value={reteIvaPct} onChange={e => setReteIvaPct(Number(e.target.value))}
                      className="w-full h-10 px-3 pr-8 border border-slate-200 rounded-lg focus:border-orange-500 outline-none text-slate-700 font-bold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Sobre valor del IVA</p>
                </div>
              </div>

              <div className="space-y-1.5 border-t border-slate-100 pt-4">
                <label className="text-xs font-bold text-slate-500 uppercase">ReteICA Municipal</label>
                <div className="flex gap-3">
                  <select 
                    value={ciudadIca} 
                    onChange={handleCiudadChange}
                    className="flex-1 h-10 px-3 border border-slate-200 rounded-lg focus:border-orange-500 outline-none text-slate-700 font-bold bg-white"
                  >
                    <option value="Bogotá">Bogotá (0.414%)</option>
                    <option value="Medellín">Medellín (0.7%)</option>
                    <option value="Cali">Cali (0.6%)</option>
                    <option value="Barranquilla">Barranquilla (0.6%)</option>
                    <option value="Bucaramanga">Bucaramanga (0.5%)</option>
                    <option value="Otra">Otra ciudad...</option>
                  </select>
                  <div className="relative w-28">
                    <input 
                      type="number" step="0.001" value={icaPct} onChange={e => setIcaPct(Number(e.target.value))}
                      disabled={ciudadIca !== 'Otra'}
                      className="w-full h-10 px-3 pr-8 border border-slate-200 rounded-lg focus:border-orange-500 outline-none text-slate-700 font-bold disabled:bg-slate-50 disabled:text-slate-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-xl border border-orange-100">
                <Info className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                <p className="text-xs text-orange-800 leading-relaxed">
                  <strong>Las retenciones son informativas.</strong> No aumentan el valor del presupuesto para tu cliente, 
                  son descuentos que la empresa o entidad contratante aplica al momento de pagarte para reportar a la DIAN/Municipio.
                </p>
              </div>
            </div>
          </Card>

          {/* SECCIÓN ARL */}
          <Card padding="none" className="overflow-hidden border-slate-200 shadow-sm">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Shield className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Riesgo Laboral (ARL)</h2>
            </div>
            
            <div className="p-6 space-y-4 bg-white">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Nivel de Riesgo Default para Cuadrillas</label>
                <select 
                  value={arlDefault} 
                  onChange={e => setArlDefault(Number(e.target.value))}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg focus:border-emerald-500 outline-none text-slate-700 font-bold bg-white"
                >
                  <option value={1}>Riesgo I (0.522%)</option>
                  <option value={2}>Riesgo II (1.044%)</option>
                  <option value={3}>Riesgo III (2.436%)</option>
                  <option value={4}>Riesgo IV (4.350%) - Construcción Mampostería</option>
                  <option value={5}>Riesgo V (6.960%) - Construcción Alturas/Excavación</option>
                </select>
              </div>

              <div className="mt-4 border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-3 py-2 font-bold text-slate-500 uppercase">Nivel</th>
                      <th className="px-3 py-2 font-bold text-slate-500 uppercase text-right">Tarifa</th>
                      <th className="px-3 py-2 font-bold text-slate-500 uppercase">Ejemplo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {arlTable.map(r => (
                      <tr key={r.nivel} className={cn("transition-colors", arlDefault === r.nivel ? "bg-slate-50/80" : "hover:bg-slate-50")}>
                        <td className="px-3 py-2">
                          <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border", r.color)}>
                            Riesgo {r.nivel}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-black text-slate-700 text-right">{r.pct.toFixed(3)}%</td>
                        <td className="px-3 py-2 text-slate-500">{r.ej}</td>
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
