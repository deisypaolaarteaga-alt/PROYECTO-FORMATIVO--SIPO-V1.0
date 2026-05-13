'use client';

import Link from 'next/link';
import {
  Sparkles, CheckCircle2, BarChart3, Clock,
  ShieldCheck, Smartphone, Zap, ArrowRight,
  MessageSquare, Layout, HardHat,
} from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/shared/Button';

/* ── Design rule: no gradients, no shadows, only borders ── */

const features = [
  {
    title: 'Asistente IA Experto',
    description: 'Genera presupuestos detallados en segundos hablando con nuestra IA especializada en construcción.',
    icon: MessageSquare,
  },
  {
    title: 'Análisis de APU',
    description: 'Desglose técnico automático de materiales, mano de obra y equipos para cada actividad.',
    icon: Layout,
  },
  {
    title: 'Base de Insumos 2025',
    description: 'Acceso a precios de referencia actualizados para las principales ciudades de Colombia.',
    icon: BarChart3,
  },
  {
    title: 'Exportación Profesional',
    description: 'Genera PDFs impecables con tu logo para enviar directamente a tus clientes.',
    icon: Zap,
  },
  {
    title: 'Seguridad Total',
    description: 'Tus datos están protegidos con encriptación de grado bancario y respaldo en la nube.',
    icon: ShieldCheck,
  },
  {
    title: 'Multi-dispositivo',
    description: 'Gestiona tus obras desde el computador, tablet o celular en cualquier lugar.',
    icon: Smartphone,
  },
];

const steps = [
  { title: 'Habla con la IA', desc: 'Describe tu proyecto y recibe una propuesta técnica al instante.' },
  { title: 'Ajusta los detalles', desc: 'Edita cantidades y precios en nuestro editor inteligente.' },
  { title: 'Envía el PDF', desc: 'Descarga y comparte el presupuesto profesional con tu cliente.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-steel-dark border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-[60px] flex items-center justify-between">
          <Logo variant="white" size="sm" />
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-[13px] font-medium text-steel-light hover:text-white transition-colors duration-150"
            >
              Iniciar sesión
            </Link>
            <Link href="/registro">
              <Button size="sm" variant="primary">
                Pruébalo Gratis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-steel-dark">
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-28 text-center">
          {/* Badge IA */}
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-[20px] bg-burn-pale text-burn-deep text-[11px] font-medium mb-8">
            <Sparkles className="h-3 w-3" />
            Presupuestos de obra con IA
          </span>

          <h1 className="text-[36px] md:text-[52px] font-semibold text-white tracking-tight leading-tight mb-6 max-w-3xl mx-auto">
            Construye presupuestos{' '}
            <span className="text-burn-orange">en minutos,</span>{' '}
            no horas.
          </h1>

          <p className="text-[15px] text-steel-light max-w-xl mx-auto mb-10 leading-relaxed">
            SIPO es el asistente inteligente que ayuda a ingenieros, arquitectos y
            maestros de obra a crear presupuestos técnicos precisos con IA.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/registro">
              <Button size="lg" icon={<ArrowRight className="h-4 w-4" />}>
                Empieza ahora — es gratis
              </Button>
            </Link>
            <p className="text-[13px] text-steel-light">Sin tarjeta de crédito</p>
          </div>

          {/* App mockup */}
          <div className="mt-16 mx-auto max-w-4xl rounded-[12px] border border-white/10 overflow-hidden">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-steel-mid border-b border-white/10">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
              </div>
              <div className="mx-auto w-1/3 h-4 bg-white/10 rounded" />
            </div>
            {/* App content mock */}
            <div className="bg-sand aspect-[16/8] flex gap-0 overflow-hidden">
              {/* Sidebar mock */}
              <div className="w-[200px] h-full bg-steel-dark flex-shrink-0 p-4 space-y-3">
                <div className="h-5 w-16 bg-burn-orange/80 rounded" />
                <div className="h-px bg-white/10 my-3" />
                <div className="space-y-1.5">
                  {[70, 55, 80, 60].map((w, i) => (
                    <div key={i} className={`h-7 rounded flex items-center gap-2 px-2 ${i === 1 ? 'bg-steel-mid/50' : ''}`}>
                      <div className={`h-3 rounded ${i === 1 ? 'bg-white/60' : 'bg-white/20'}`} style={{ width: `${w}%` }} />
                    </div>
                  ))}
                </div>
              </div>
              {/* Content mock */}
              <div className="flex-1 p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1.5">
                    <div className="h-4 w-40 bg-ink/20 rounded" />
                    <div className="h-3 w-24 bg-stone/30 rounded" />
                  </div>
                  <div className="h-8 w-24 bg-burn-orange rounded-lg" />
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white rounded-lg border border-concrete p-3 space-y-2">
                      <div className="h-6 w-6 bg-steel-fog rounded" />
                      <div className="h-3 w-full bg-concrete rounded" />
                      <div className="h-4 w-2/3 bg-steel-mid/20 rounded" />
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {[85, 65, 90].map((w, i) => (
                    <div key={i} className="bg-white rounded-lg border border-concrete h-10 flex items-center px-3 gap-3">
                      <div className="h-3 w-3 bg-concrete rounded-full" />
                      <div className="h-3 rounded bg-concrete" style={{ width: `${w}%` }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Métricas rápidas ── */}
      <section className="bg-white border-b border-concrete">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-concrete">
          {[
            { value: '3x', label: 'Más rápido que Excel' },
            { value: '98%', label: 'Precisión en APU' },
            { value: '500+', label: 'Ingenieros activos' },
            { value: '0 COP', label: 'Para empezar' },
          ].map((m, i) => (
            <div key={i} className="px-6 py-4 text-center first:pl-0 last:pr-0">
              <p className="text-[28px] font-semibold text-steel-dark">{m.value}</p>
              <p className="text-[13px] text-stone mt-1">{m.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-sand py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-14">
            <h2 className="text-[28px] font-semibold text-ink mb-3">
              Todo lo que necesitas para ganar licitaciones
            </h2>
            <p className="text-[15px] text-stone max-w-lg">
              Herramientas profesionales diseñadas por ingenieros para constructores colombianos.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-white border border-concrete rounded-[12px] px-6 py-5 transition-all duration-150 hover:border-mortar"
              >
                <div className="h-9 w-9 rounded-lg bg-steel-fog flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-steel-mid" />
                </div>
                <h3 className="text-[15px] font-semibold text-ink mb-2">{f.title}</h3>
                <p className="text-[13px] text-stone leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ── */}
      <section className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-start gap-16">
            {/* Pasos */}
            <div className="flex-1">
              <h2 className="text-[28px] font-semibold text-ink mb-10">¿Cómo funciona SIPO?</h2>
              <div className="space-y-8">
                {steps.map((s, i) => (
                  <div key={i} className="flex gap-5">
                    <div className="w-9 h-9 rounded-lg border border-burn-orange/30 bg-burn-pale text-burn-deep flex items-center justify-center text-[15px] font-semibold shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="text-[15px] font-semibold text-ink mb-1">{s.title}</h4>
                      <p className="text-[13px] text-stone leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Testimonial */}
            <div className="flex-1 bg-steel-dark rounded-[12px] border border-white/10 p-10 flex items-center justify-center text-center min-h-[280px]">
              <div className="space-y-5">
                <HardHat className="h-12 w-12 text-burn-orange mx-auto" />
                <p className="text-white text-[15px] font-medium leading-relaxed italic max-w-sm">
                  "SIPO me ahorró 3 días de trabajo en mi última cotización.
                  El APU que generó la IA fue increíblemente preciso."
                </p>
                <p className="text-steel-light text-[13px]">— Ing. Alejandro M., Constructor</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="bg-sand py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-[28px] font-semibold text-ink mb-3">
              Planes simples para equipos en crecimiento
            </h2>
            <p className="text-[13px] text-stone">Sin sorpresas. Sin letra pequeña.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Gratis */}
            <div className="bg-white border border-concrete rounded-[12px] p-8">
              <h3 className="text-[17px] font-semibold text-ink mb-1">Gratis</h3>
              <div className="text-[28px] font-semibold text-ink mb-1">
                $0{' '}
                <span className="text-[13px] font-normal text-stone">/ siempre</span>
              </div>
              <p className="text-[11px] text-stone mb-6">Para empezar sin riesgos</p>
              <ul className="text-[13px] text-charcoal space-y-3 mb-8">
                {[
                  '5 Proyectos activos',
                  '20 Consultas IA diarias',
                  'Exportación PDF básica',
                  'Base de insumos limitada',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-success-text shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/registro">
                <Button fullWidth variant="secondary">
                  Comenzar gratis
                </Button>
              </Link>
            </div>
            {/* Pro */}
            <div className="bg-white border border-burn-orange rounded-[12px] p-8 relative">
              <span className="absolute top-0 right-8 -translate-y-1/2 bg-burn-orange text-white text-[11px] font-medium px-3 py-1 rounded-[20px]">
                Recomendado
              </span>
              <h3 className="text-[17px] font-semibold text-ink mb-1">Profesional</h3>
              <div className="text-[28px] font-semibold text-ink mb-1">
                $99.000{' '}
                <span className="text-[13px] font-normal text-stone">COP / mes</span>
              </div>
              <p className="text-[11px] text-stone mb-6">Próximamente disponible</p>
              <ul className="text-[13px] text-charcoal space-y-3 mb-8">
                {[
                  'Proyectos ilimitados',
                  'Consultas IA ilimitadas',
                  'PDF Premium con logo propio',
                  'Soporte prioritario',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-success-text shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button fullWidth disabled>
                Muy pronto
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="bg-steel-dark py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-[28px] font-semibold text-white mb-4">
            Empieza a presupuestar con inteligencia
          </h2>
          <p className="text-[15px] text-steel-light mb-8 max-w-md mx-auto">
            Únete a los ingenieros y arquitectos que ya usan SIPO para ganar más licitaciones.
          </p>
          <Link href="/registro">
            <Button size="lg" icon={<ArrowRight className="h-4 w-4" />}>
              Crear cuenta gratis
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-ink py-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-5">
          <Logo variant="white" size="sm" />
          <div className="flex gap-8 text-[13px] text-steel-light">
            <Link href="#" className="hover:text-white transition-colors">Privacidad</Link>
            <Link href="#" className="hover:text-white transition-colors">Términos</Link>
            <Link href="mailto:hola@sipo.com.co" className="hover:text-white transition-colors">Soporte</Link>
          </div>
          <p className="text-[11px] text-stone">Hecho con ❤️ en Colombia</p>
        </div>
      </footer>
    </div>
  );
}
