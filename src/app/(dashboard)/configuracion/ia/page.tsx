import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { IAConfigForm } from '@/components/configuracion/IAConfigForm';
import { Cpu, ShieldCheck, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Configuración de IA | SIPO',
  description: 'Gestiona tu integración con Claude API y controla el uso de inteligencia artificial.',
};

export default async function IAConfigPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('anthropic_key_enc, ia_global_enabled')
    .eq('id', user.id)
    .single();

  const { data: usage } = await supabase
    .from('ai_usage')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  return (
    <div className="max-w-4xl mx-auto py-10 px-6 space-y-10">
      {/* HEADER */}
      <div className="flex flex-col gap-2 pb-6 border-b border-[#E2DDD6]">
        <div className="flex items-center gap-2 text-[#E8571A] font-black text-[10px] uppercase tracking-[0.2em]">
          <ShieldCheck className="h-4 w-4" />
          IA Privada y Segura
        </div>
        <h1 className="text-3xl font-black text-[#1C2B3A] tracking-tight">Inteligencia Artificial (Claude)</h1>
        <p className="text-sm text-slate-500 max-w-xl">
          SIPO utiliza los modelos de Anthropic para ayudarte a estructurar presupuestos complejos en segundos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <IAConfigForm 
            initialEnabled={profile?.ia_global_enabled ?? true}
            hasKey={!!profile?.anthropic_key_enc}
            usage={usage}
          />
        </div>

        <div className="space-y-6">
          <div className="bg-[#1C2B3A] text-white p-6 rounded-[12px] space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <Cpu className="h-5 w-5 text-[#E8571A]" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider">Modelos Soportados</h3>
            </div>
            <ul className="space-y-3">
              {[
                { name: 'Claude 3.5 Sonnet', desc: 'Equilibrio perfecto (recomendado)' },
                { name: 'Claude 3 Opus', desc: 'Máxima capacidad creativa' },
                { name: 'Claude 3 Haiku', desc: 'Velocidad instantánea' },
              ].map((m, i) => (
                <li key={i} className="space-y-0.5">
                  <p className="text-xs font-black text-white">{m.name}</p>
                  <p className="text-[10px] text-slate-400">{m.desc}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-5 border border-amber-100 bg-amber-50 rounded-[12px] space-y-3">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Información de Costos</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              SIPO no cobra comisiones por el uso de la IA. Solo pagas lo que consumas directamente a Anthropic mediante tu propia API Key.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
