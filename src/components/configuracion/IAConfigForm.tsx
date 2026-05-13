'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Key, Save, Cpu, ExternalLink, ShieldCheck, Zap } from 'lucide-react';
import { saveUserAnthropicKey, toggleIAGlobal } from '@/actions/ia';
import { Button } from '@/components/shared/Button';

interface IAConfigFormProps {
  initialEnabled: boolean;
  hasKey: boolean;
  usage: any;
}

export function IAConfigForm({ initialEnabled, hasKey, usage }: IAConfigFormProps) {
  const [key, setKey] = useState('');
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.startsWith('sk-ant')) {
      toast.error('Formato de API Key inválido. Debe empezar con "sk-ant-..."');
      return;
    }

    setSaving(true);
    const res = await saveUserAnthropicKey(key);
    setSaving(false);

    if (res.success) {
      toast.success('API Key guardada y encriptada correctamente');
      setKey('');
    } else {
      toast.error(res.error);
    }
  };

  const handleToggle = async (val: boolean) => {
    setEnabled(val);
    const res = await toggleIAGlobal(val);
    if (!res.success) {
      toast.error(res.error);
      setEnabled(!val);
    }
  };

  return (
    <div className="space-y-8">
      {/* SECCIÓN 1: ESTADO GLOBAL */}
      <div className="bg-white border border-[#E2DDD6] rounded-[12px] p-6 flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-black text-[#1C2B3A] uppercase tracking-wider flex items-center gap-2">
            <Cpu className="h-4 w-4 text-[#E8571A]" />
            Estado de la Inteligencia Artificial
          </h3>
          <p className="text-xs text-slate-500">Activa o desactiva las funciones de IA en toda tu cuenta.</p>
        </div>
        <button
          onClick={() => handleToggle(!enabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-[#E8571A]' : 'bg-slate-200'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* SECCIÓN 2: API KEY */}
      <div className="bg-white border border-[#E2DDD6] rounded-[12px] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2DDD6] bg-[#F4F2EE]">
          <h3 className="text-sm font-black text-[#1C2B3A] uppercase tracking-wider">Configuración de Anthropic</h3>
        </div>
        <form onSubmit={handleSaveKey} className="p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-[#1C2B3A] uppercase tracking-widest">API Key Personal</label>
              <a 
                href="https://console.anthropic.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[10px] font-bold text-[#E8571A] hover:underline flex items-center gap-1"
              >
                Obtener en Anthropic Console <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="relative">
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder={hasKey ? "••••••••••••••••••••••••••••••••" : "sk-ant-api03-..."}
                className="w-full h-11 pl-11 pr-4 border border-[#E2DDD6] rounded-[8px] text-sm focus:border-[#E8571A] focus:ring-0 outline-none transition-all"
              />
              <Key className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed italic">
              Tu clave se guarda encriptada mediante AES-256-CBC. SIPO nunca la mostrará en texto plano ni la enviará a terceros distintos a Anthropic.
            </p>
          </div>

          <Button
            type="submit"
            loading={saving}
            className="bg-[#1C2B3A] hover:bg-slate-800 text-white px-8 rounded-[8px] font-black uppercase tracking-widest text-[10px]"
            icon={<Save className="h-3.5 w-3.5" />}
          >
            Actualizar API Key
          </Button>
        </form>
      </div>

      {/* SECCIÓN 3: MÉTRICAS DE USO */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Consultas Hoy', value: usage?.consultas_hoy || 0, icon: Zap, suffix: '/ 10' },
          { label: 'Tokens Mes', value: usage?.total_tokens || 0, icon: Cpu, suffix: '' },
          { label: 'Costo Estimado', value: `$${((usage?.total_tokens || 0) * 0.000009).toFixed(4)}`, icon: Zap, suffix: ' USD' },
          { label: 'Seguridad', value: 'Encriptado', icon: ShieldCheck, suffix: '' },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-[#E2DDD6] p-4 rounded-[12px] space-y-2">
            <div className="flex items-center gap-2 text-slate-400">
              <stat.icon className="h-3.5 w-3.5" />
              <span className="text-[9px] font-black uppercase tracking-widest">{stat.label}</span>
            </div>
            <div className="text-xl font-black text-[#1C2B3A]">
              {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
              <span className="text-[10px] text-slate-400 ml-1 font-bold">{stat.suffix}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
