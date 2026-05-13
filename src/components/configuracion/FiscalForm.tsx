'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Save, Info, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import { updateConfigFiscalUsuario, type ConfigFiscal } from '@/actions/configuracion-fiscal';
import { Button } from '@/components/shared/Button';
import { cn } from '@/lib/utils';

interface FiscalFormProps {
  initialData: any;
  municipios: any[];
}

export function FiscalForm({ initialData, municipios }: FiscalFormProps) {
  const [formData, setFormData] = useState<ConfigFiscal>({
    nit: initialData?.nit || '',
    razon_social: initialData?.razon_social || '',
    regimen_tributario: initialData?.regimen_tributario || 'no_responsable',
    municipio: initialData?.municipio || 'Bogotá D.C.',
    nivel_riesgo_arl: initialData?.nivel_riesgo_arl || 4,
    aiu_admin_default: Number(initialData?.aiu_admin_default || 10),
    aiu_imprev_default: Number(initialData?.aiu_imprev_default || 5),
    aiu_utilidad_default: Number(initialData?.aiu_utilidad_default || 10),
    fecha_validez_presupuesto_dias: Number(initialData?.fecha_validez_presupuesto_dias || 30),
  });

  const [saving, setSaving] = useState(false);

  // Calcular total AIU en tiempo real
  const totalAIU = useMemo(() => {
    return formData.aiu_admin_default + formData.aiu_imprev_default + formData.aiu_utilidad_default;
  }, [formData.aiu_admin_default, formData.aiu_imprev_default, formData.aiu_utilidad_default]);

  const isAIUOverLimit = totalAIU > 40;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAIUOverLimit) {
      toast.error('El AIU total no puede superar el 40%');
      return;
    }

    setSaving(true);
    const res = await updateConfigFiscalUsuario(formData);
    setSaving(false);

    if (res.success) {
      toast.success('Configuración fiscal actualizada correctamente');
    } else {
      toast.error(res.error);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* SECCIÓN 1: DATOS FISCALES */}
      <div className="bg-white border border-[#E2DDD6] rounded-[12px] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2DDD6] bg-[#F4F2EE]">
          <h3 className="text-sm font-black text-[#1C2B3A] uppercase tracking-wider flex items-center gap-2">
            <span className="w-1 h-4 bg-[#E8571A] rounded-full" />
            Datos Fiscales del Profesional
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#1C2B3A] uppercase tracking-widest">NIT / RUT</label>
            <input
              value={formData.nit}
              onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
              onFocus={handleFocus}
              placeholder="000.000.000-0"
              className="w-full h-11 px-4 border border-[#E2DDD6] rounded-[8px] text-sm focus:border-[#E8571A] focus:ring-0 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#1C2B3A] uppercase tracking-widest">Razón Social</label>
            <input
              value={formData.razon_social}
              onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
              onFocus={handleFocus}
              placeholder="Nombre comercial o legal"
              className="w-full h-11 px-4 border border-[#E2DDD6] rounded-[8px] text-sm focus:border-[#E8571A] focus:ring-0 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#1C2B3A] uppercase tracking-widest">Régimen Tributario</label>
            <select
              value={formData.regimen_tributario}
              onChange={(e) => setFormData({ ...formData, regimen_tributario: e.target.value as any })}
              className="w-full h-11 px-4 border border-[#E2DDD6] rounded-[8px] text-sm bg-white focus:border-[#E8571A] focus:ring-0 outline-none appearance-none cursor-pointer transition-all"
            >
              <option value="no_responsable">No Responsable de IVA</option>
              <option value="responsable_iva">Responsable de IVA</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#1C2B3A] uppercase tracking-widest">Municipio Principal</label>
            <select
              value={formData.municipio}
              onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
              className="w-full h-11 px-4 border border-[#E2DDD6] rounded-[8px] text-sm bg-white focus:border-[#E8571A] focus:ring-0 outline-none appearance-none cursor-pointer transition-all"
            >
              {municipios.map((m) => (
                <option key={m.id} value={m.nombre}>{m.nombre} (ReteICA: {m.reteica_pct}%)</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: AIU POR DEFECTO */}
      <div className="bg-white border border-[#E2DDD6] rounded-[12px] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2DDD6] bg-[#F4F2EE] flex items-center justify-between">
          <h3 className="text-sm font-black text-[#1C2B3A] uppercase tracking-wider flex items-center gap-2">
            <span className="w-1 h-4 bg-[#E8571A] rounded-full" />
            Configuración de AIU Estándar
          </h3>
          <div className={cn(
            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
            isAIUOverLimit ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
          )}>
            Total AIU: {totalAIU.toFixed(1)}%
          </div>
        </div>
        <div className="p-6 space-y-8">
          {[
            { label: 'Administración (%)', key: 'aiu_admin_default' as const, color: 'bg-blue-600' },
            { label: 'Imprevistos (%)', key: 'aiu_imprev_default' as const, color: 'bg-orange-500' },
            { label: 'Utilidad (%)', key: 'aiu_utilidad_default' as const, color: 'bg-emerald-600' },
          ].map((item) => (
            <div key={item.key} className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-[#1C2B3A] uppercase">{item.label}</span>
                <span className="text-sm font-black text-[#1C2B3A]">{formData[item.key]}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="0.5"
                value={formData[item.key]}
                onChange={(e) => setFormData({ ...formData, [item.key]: Number(e.target.value) })}
                className="w-full h-1.5 bg-[#F4F2EE] rounded-lg appearance-none cursor-pointer accent-[#E8571A]"
              />
            </div>
          ))}

          {isAIUOverLimit && (
            <div className="p-4 bg-red-50 rounded-lg flex items-start gap-3 border border-red-100">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-black text-red-600 uppercase tracking-wider">Límite Superado</p>
                <p className="text-xs text-red-500">La normativa sugiere que el AIU no supere el 30%-40%. Ajusta los valores para continuar.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN 3: PARÁMETROS DE OBRA */}
      <div className="bg-white border border-[#E2DDD6] rounded-[12px] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2DDD6] bg-[#F4F2EE]">
          <h3 className="text-sm font-black text-[#1C2B3A] uppercase tracking-wider flex items-center gap-2">
            <span className="w-1 h-4 bg-[#E8571A] rounded-full" />
            Parámetros de Obra y Seguridad
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#1C2B3A] uppercase tracking-widest flex items-center gap-2">
                Nivel de Riesgo ARL
                <Info className="h-3 w-3 text-slate-400" />
              </label>
              <select
                value={formData.nivel_riesgo_arl}
                onChange={(e) => setFormData({ ...formData, nivel_riesgo_arl: Number(e.target.value) })}
                className="w-full h-11 px-4 border border-[#E2DDD6] rounded-[8px] text-sm bg-white focus:border-[#E8571A] focus:ring-0 outline-none appearance-none cursor-pointer transition-all"
              >
                <option value={1}>Clase I (0.522%) - Administrativos</option>
                <option value={2}>Clase II (1.044%) - Manufactura, Acabados</option>
                <option value={3}>Clase III (2.436%) - Obras Civiles Medianas</option>
                <option value={4}>Clase IV (4.350%) - Construcción Edificios</option>
                <option value={5}>Clase V (6.960%) - Alturas, Demolición</option>
              </select>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed italic">
              Este nivel determina el factor prestacional que se aplicará a la mano de obra en todos tus presupuestos por defecto.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#1C2B3A] uppercase tracking-widest">Vigencia de Oferta (Días)</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={formData.fecha_validez_presupuesto_dias}
                  onChange={(e) => setFormData({ ...formData, fecha_validez_presupuesto_dias: Number(e.target.value) })}
                  onFocus={handleFocus}
                  className="w-24 h-11 px-4 border border-[#E2DDD6] rounded-[8px] text-sm focus:border-[#E8571A] focus:ring-0 outline-none transition-all"
                />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Días calendario</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER ACCIONES */}
      <div className="flex items-center justify-between p-6 bg-[#1C2B3A] rounded-[12px]">
        <div className="hidden sm:flex items-center gap-4 text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Datos protegidos</span>
          </div>
          <div className="w-px h-4 bg-slate-700" />
          <span className="text-[10px] font-medium leading-tight">La configuración se aplicará automáticamente <br />a todos tus nuevos proyectos.</span>
        </div>
        <Button
          type="submit"
          loading={saving}
          disabled={isAIUOverLimit}
          className="bg-[#E8571A] hover:bg-[#D44A16] text-white px-8 h-12 rounded-[8px] font-black uppercase tracking-widest shadow-none border-none"
          icon={<Save className="h-4 w-4" />}
        >
          Guardar Configuración
        </Button>
      </div>
    </form>
  );
}
