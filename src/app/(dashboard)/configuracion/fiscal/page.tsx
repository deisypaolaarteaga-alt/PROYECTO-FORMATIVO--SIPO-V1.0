import { Metadata } from 'next';
import { 
  getConfigFiscalUsuario, 
  getMunicipiosDisponibles 
} from '@/actions/configuracion-fiscal';
import { getParametrosFiscalesVigentes } from '@/lib/fiscal/parametros';
import { FiscalForm } from '@/components/configuracion/FiscalForm';
import { formatearCOP } from '@/lib/utils/formato-cop';
import { ShieldCheck, Scale, FileText, Landmark } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Configuración Fiscal | SIPO',
  description: 'Gestiona tus parámetros tributarios, NIT y configuración de AIU estándar.',
};

export default async function ConfiguracionFiscalPage() {
  const [config, municipios, legales] = await Promise.all([
    getConfigFiscalUsuario(),
    getMunicipiosDisponibles(),
    getParametrosFiscalesVigentes(),
  ]);

  return (
    <div className="max-w-5xl mx-auto py-10 px-6 space-y-10">
      {/* HEADER DE PÁGINA */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#E2DDD6]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#E8571A] font-black text-[10px] uppercase tracking-[0.2em]">
            <ShieldCheck className="h-4 w-4" />
            Configuración Segura
          </div>
          <h1 className="text-3xl font-black text-[#1C2B3A] tracking-tight">Parámetros Fiscales</h1>
          <p className="text-sm text-slate-500 max-w-xl">
            Define tu perfil tributario y los porcentajes de AIU que se aplicarán por defecto a todos tus nuevos presupuestos.
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-[#F4F2EE] px-4 py-3 rounded-[12px] border border-[#E2DDD6]">
          <Scale className="h-5 w-5 text-[#1C2B3A]" />
          <div>
            <p className="text-[10px] font-black text-[#1C2B3A] uppercase tracking-wider">Metodología SIPO</p>
            <p className="text-xs text-slate-500">IVA sobre Utilidad (Ley 1819)</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* COLUMNA IZQUIERDA: FORMULARIO (2/3) */}
        <div className="lg:col-span-2">
          <FiscalForm initialData={config} municipios={municipios} />
        </div>

        {/* COLUMNA DERECHA: INFORMACIÓN LEGAL (1/3) */}
        <div className="space-y-6">
          <div className="bg-[#1C2B3A] text-white p-6 rounded-[12px] space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <Landmark className="h-5 w-5 text-[#E8571A]" />
              <h3 className="text-sm font-black uppercase tracking-wider">Valores Legales {legales.año}</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-white/5 pb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase">SMMLV Vigente</span>
                <span className="text-sm font-black">{formatearCOP(legales.smmlv)}</span>
              </div>
              <div className="flex justify-between items-end border-b border-white/5 pb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Auxilio Transporte</span>
                <span className="text-sm font-black">{formatearCOP(legales.aux_transporte)}</span>
              </div>
              <div className="flex justify-between items-end border-b border-white/5 pb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Divisor APU</span>
                <span className="text-sm font-black">{legales.divisor_apu} horas/mes</span>
              </div>
              <div className="flex justify-between items-end border-b border-white/5 pb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase">IVA Estándar</span>
                <span className="text-sm font-black">{legales.iva_porcentaje}%</span>
              </div>
            </div>

            <div className="p-4 bg-white/5 rounded-[8px] space-y-2">
              <div className="flex items-center gap-2 text-[#E8571A]">
                <FileText className="h-3.5 w-3.5" />
                <span className="text-[9px] font-black uppercase tracking-widest">Nota Normativa</span>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed italic">
                Estos valores son de solo lectura y se actualizan automáticamente según la normativa nacional colombiana cada año.
              </p>
            </div>
          </div>

          {/* CARD DE AYUDA ReteICA */}
          <div className="bg-white border border-[#E2DDD6] p-6 rounded-[12px] space-y-4">
            <h4 className="text-[11px] font-black text-[#1C2B3A] uppercase tracking-widest">ReteICA por Ciudad</h4>
            <div className="space-y-2">
              {municipios.slice(0, 5).map(m => (
                <div key={m.id} className="flex justify-between text-xs">
                  <span className="text-slate-500">{m.nombre}</span>
                  <span className="font-bold text-[#1C2B3A]">{m.reteica_pct}%</span>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-slate-400 pt-2 border-t border-[#E2DDD6]">
              El ReteICA se aplica sobre el subtotal con AIU de tus presupuestos según la ciudad seleccionada.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
