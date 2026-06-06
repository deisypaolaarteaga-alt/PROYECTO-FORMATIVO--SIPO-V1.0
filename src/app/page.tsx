'use client';

import Link from 'next/link';
import {
  ArrowRight, FileText, Calculator, Send, Download,
  BookTemplate, Sparkles, ChevronRight, CheckCircle2,
  Building2, HardHat, ClipboardList,
} from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/shared/Button';

/* ── Regla de diseño: sin gradientes, sin sombras, solo bordes ── */

const features = [
  {
    title: 'APU Detallado por Actividad',
    description:
      'Arma el Análisis de Precio Unitario con materiales, mano de obra y equipos. Precios de referencia del catálogo Colombia 2026 incluidos.',
    icon: ClipboardList,
  },
  {
    title: 'AIU e Impuestos Colombianos',
    description:
      'Calcula Administración, Imprevistos y Utilidad en modo porcentaje o gastos fijos. Aplica IVA, ReteFuente, ReteICA y ReteIVA según la ciudad.',
    icon: Calculator,
  },
  {
    title: 'Portal del Cliente',
    description:
      'Envía el presupuesto al cliente con un enlace seguro. El cliente puede aprobarlo, rechazarlo o dejar comentarios con firma digital.',
    icon: Send,
  },
  {
    title: 'Exportación PDF y Excel',
    description:
      'Genera el PDF con tu logo listo para entregar. El Excel incluye 5 hojas: Resumen, Presupuesto, APUs, Insumos y Programa de Obra.',
    icon: Download,
  },
  {
    title: 'Plantillas Personales',
    description:
      'Guarda la estructura de tus presupuestos como plantilla y reutilízala en proyectos futuros. Con o sin precios, según lo necesites.',
    icon: BookTemplate,
  },
  {
    title: 'Carta Ejecutiva con IA',
    description:
      'Al enviar al cliente, SIPO genera automáticamente una carta de presentación ejecutiva adaptada a tu presupuesto usando inteligencia artificial.',
    icon: Sparkles,
  },
];

const steps = [
  {
    title: 'Organiza por capítulos y actividades',
    desc: 'Crea el presupuesto con la estructura estándar colombiana: capítulos como Cimentación, Mampostería, Acabados, y las actividades con sus cantidades.',
  },
  {
    title: 'Configura APU, AIU e impuestos',
    desc: 'Define el APU de cada actividad con insumos del catálogo. Configura el AIU y las retenciones fiscales según municipio.',
  },
  {
    title: 'Envía al cliente y exporta',
    desc: 'Comparte el presupuesto con un enlace al portal del cliente para aprobación digital. Descarga el PDF o el Excel con Programa de Obra incluido.',
  },
];

const tiposObra = [
  'Residencial',
  'Comercial',
  'Institucional',
  'Industrial',
  'Infraestructura',
  'Hotelero',
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
                Registrarse
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-steel-dark">
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-28 text-center">
          {/* Badge tipo de sistema */}
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-[20px] bg-burn-pale text-burn-deep text-[11px] font-medium mb-8">
            <Building2 className="h-3 w-3" />
            Sistema de presupuestación de obras — Colombia
          </span>

          <h1 className="text-[36px] md:text-[52px] font-semibold text-white tracking-tight leading-tight mb-6 max-w-3xl mx-auto">
            Presupuestos de construcción{' '}
            <span className="text-burn-orange">precisos y profesionales.</span>
          </h1>

          <p className="text-[15px] text-steel-light max-w-2xl mx-auto mb-10 leading-relaxed">
            SIPO es el sistema para ingenieros, arquitectos y constructores colombianos
            que necesitan elaborar presupuestos con APU, AIU, retenciones fiscales y
            enviarlos al cliente con aprobación digital.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/registro">
              <Button size="lg" icon={<ArrowRight className="h-4 w-4" />}>
                Crear cuenta gratis
              </Button>
            </Link>
            <Link href="/login">
              <button className="text-[14px] font-medium text-steel-light hover:text-white transition-colors duration-150 flex items-center gap-1.5">
                Ya tengo cuenta <ChevronRight className="h-4 w-4" />
              </button>
            </Link>
          </div>

          {/* Mockup de la app */}
          <div className="mt-16 mx-auto max-w-4xl rounded-[12px] border border-white/10 overflow-hidden">
            {/* Chrome del navegador */}
            <div className="flex items-center gap-2 px-4 py-3 bg-steel-mid border-b border-white/10">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
              </div>
              <div className="mx-auto w-1/3 h-4 bg-white/10 rounded" />
            </div>
            {/* Contenido simulado */}
            <div className="bg-sand aspect-[16/8] flex gap-0 overflow-hidden">
              {/* Sidebar */}
              <div className="w-[180px] h-full bg-steel-dark flex-shrink-0 p-4 flex flex-col gap-3">
                <div className="h-5 w-16 bg-burn-orange/80 rounded" />
                <div className="h-px bg-white/10" />
                <div className="flex flex-col gap-1.5">
                  {[70, 55, 80, 60, 45].map((w, i) => (
                    <div key={i} className={`h-7 rounded flex items-center gap-2 px-2 ${i === 1 ? 'bg-steel-mid/50' : ''}`}>
                      <div className={`h-3 rounded ${i === 1 ? 'bg-white/60' : 'bg-white/20'}`} style={{ width: `${w}%` }} />
                    </div>
                  ))}
                </div>
                <div className="mt-auto h-px bg-white/10" />
                <div className="h-6 w-24 bg-white/10 rounded" />
              </div>
              {/* Contenido del editor — flex col que llena el alto */}
              <div className="flex-1 p-5 flex flex-col gap-3 min-h-0">
                {/* Header */}
                <div className="flex justify-between items-start shrink-0">
                  <div className="flex flex-col gap-1.5">
                    <div className="h-4 w-48 bg-ink/20 rounded" />
                    <div className="h-3 w-32 bg-stone/30 rounded" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 w-20 bg-steel-fog rounded-lg border border-concrete" />
                    <div className="h-8 w-24 bg-burn-orange rounded-lg" />
                  </div>
                </div>
                {/* Capítulos — ocupa el espacio disponible */}
                <div className="flex flex-col gap-2 flex-1 min-h-0">
                  {[
                    { w: 72, val: 68 },
                    { w: 55, val: 52 },
                    { w: 88, val: 85 },
                    { w: 60, val: 57 },
                  ].map((c, i) => (
                    <div key={i} className="bg-white rounded-lg border border-concrete flex-1 flex items-center px-3 gap-3 min-h-0">
                      <div className="h-2.5 w-2.5 rounded-sm bg-burn-orange/40 shrink-0" />
                      <div className="h-3 rounded bg-concrete flex-1" style={{ maxWidth: `${c.w}%` }} />
                      <div className="ml-auto h-3 w-14 bg-success-bg rounded shrink-0" />
                    </div>
                  ))}
                </div>
                {/* Resumen financiero — fijo abajo */}
                <div className="grid grid-cols-3 gap-3 shrink-0">
                  {[
                    { color: 'bg-steel-fog', accent: false },
                    { color: 'bg-steel-fog', accent: false },
                    { color: 'bg-burn-orange/20', accent: true },
                  ].map((card, i) => (
                    <div key={i} className={`rounded-lg border p-3 ${card.accent ? 'border-burn-orange/30 bg-burn-pale' : 'border-concrete bg-white'}`}>
                      <div className="h-2 w-14 bg-concrete/80 rounded mb-2" />
                      <div className={`h-4 rounded ${card.color} ${card.accent ? 'w-full' : 'w-3/4'}`} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tipos de obra ── */}
      <section className="bg-white border-b border-concrete">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <p className="text-[12px] font-medium text-stone uppercase tracking-widest mb-5 text-center">
            Tipos de obra soportados
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {tiposObra.map((tipo) => (
              <span
                key={tipo}
                className="px-4 py-1.5 rounded-[20px] border border-concrete text-[13px] text-charcoal bg-sand"
              >
                {tipo}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Funcionalidades ── */}
      <section className="bg-sand py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-14">
            <h2 className="text-[28px] font-semibold text-ink mb-3">
              Todo en un solo sistema
            </h2>
            <p className="text-[15px] text-stone max-w-xl">
              Desde el APU hasta la aprobación del cliente — sin hojas de Excel sueltas ni correos de ida y vuelta.
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

            {/* Qué incluye el presupuesto */}
            <div className="flex-1 bg-steel-dark rounded-[12px] border border-white/10 p-8">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="h-6 w-6 text-burn-orange" />
                <p className="text-white text-[15px] font-semibold">El presupuesto incluye</p>
              </div>
              <ul className="space-y-3">
                {[
                  'Capítulos y actividades con cantidades y precios unitarios',
                  'APU por actividad: materiales, mano de obra y equipos',
                  'AIU en modo porcentaje o gastos fijos mensuales',
                  'IVA según método (sobre utilidad, AIU o total)',
                  'ReteFuente, ReteICA y ReteIVA por municipio',
                  'Resumen financiero con costo directo y total oferta',
                  'Programa de obra en el Excel exportado',
                  'Carta ejecutiva generada por IA al enviar al cliente',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-burn-orange mt-0.5 shrink-0" />
                    <span className="text-[13px] text-steel-light leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Catálogo de referencia ── */}
      <section className="bg-sand py-20 border-t border-concrete border-b">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-10">
            <div className="flex-1">
              <h2 className="text-[24px] font-semibold text-ink mb-3">
                Catálogo de referencia Colombia 2026
              </h2>
              <p className="text-[14px] text-stone leading-relaxed max-w-lg">
                SIPO incluye un catálogo con{' '}
                <span className="font-semibold text-ink">28 capítulos</span>,{' '}
                <span className="font-semibold text-ink">164 actividades</span> y más de{' '}
                <span className="font-semibold text-ink">800 insumos APU</span> con precios
                de referencia actualizados para las principales ciudades de Colombia.
                Úsalos como punto de partida y ajusta a tu mercado local.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 shrink-0">
              {[
                { value: '28', label: 'Capítulos' },
                { value: '164', label: 'Actividades' },
                { value: '800+', label: 'Insumos APU' },
                { value: '6', label: 'Tipos de obra' },
              ].map((m, i) => (
                <div key={i} className="bg-white border border-concrete rounded-[12px] px-5 py-4 text-center">
                  <p className="text-[24px] font-semibold text-steel-dark">{m.value}</p>
                  <p className="text-[12px] text-stone mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Portal del cliente ── */}
      <section className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Texto */}
            <div className="flex-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-burn-deep bg-burn-pale px-3 py-1 rounded-[20px] mb-5">
                <Send className="h-3 w-3" /> Portal del Cliente
              </span>
              <h2 className="text-[28px] font-semibold text-ink mb-4">
                El cliente aprueba en línea, sin imprimir ni firmar a mano
              </h2>
              <p className="text-[14px] text-stone leading-relaxed mb-6 max-w-md">
                Envía un enlace seguro al cliente. Él ve el resumen financiero, los capítulos
                del presupuesto y los datos de tu empresa. Puede aprobar, rechazar o dejar
                observaciones con su nombre como firma digital.
              </p>
              <ul className="space-y-2.5">
                {[
                  'Enlace único con expiración configurable',
                  'Vista del presupuesto sin acceso al editor',
                  'Notificación al constructor por correo al responder',
                  'Historial de versiones y snapshots automáticos',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-[13px] text-charcoal">
                    <CheckCircle2 className="h-4 w-4 text-success-text shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Simulación del portal */}
            <div className="flex-1 w-full max-w-md border border-concrete rounded-[12px] overflow-hidden bg-sand">
              <div className="bg-steel-dark px-5 py-4 flex items-center gap-3">
                <HardHat className="h-5 w-5 text-burn-orange" />
                <div>
                  <p className="text-white text-[13px] font-semibold">Constructora El Pino S.A.S.</p>
                  <p className="text-steel-light text-[11px]">Presupuesto — Proyecto Residencial Palmera</p>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {['Costo Directo', 'Con AIU', 'Total Oferta'].map((label, i) => (
                    <div key={i} className={`rounded-lg border p-3 text-center ${i === 2 ? 'border-burn-orange/30 bg-burn-pale' : 'border-concrete bg-white'}`}>
                      <p className="text-[10px] text-stone mb-1">{label}</p>
                      <div className={`h-3 rounded mx-auto ${i === 2 ? 'bg-burn-orange/30 w-4/5' : 'bg-concrete w-3/4'}`} />
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  {['Cimentación', 'Mampostería', 'Cubierta'].map((cap, i) => (
                    <div key={i} className="bg-white border border-concrete rounded-lg h-9 flex items-center px-3 gap-3">
                      <div className="h-2 w-2 rounded-full bg-burn-orange/40" />
                      <span className="text-[12px] text-charcoal">{cap}</span>
                      <div className="ml-auto h-2.5 w-20 bg-concrete rounded" />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <div className="flex-1 h-9 rounded-lg border border-success-border bg-success-bg flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success-text" />
                    <span className="text-[12px] font-medium text-success-text">Aprobar</span>
                  </div>
                  <div className="flex-1 h-9 rounded-lg border border-concrete bg-white flex items-center justify-center">
                    <span className="text-[12px] text-stone">Rechazar</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="bg-steel-dark py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-[28px] font-semibold text-white mb-4">
            Empieza a presupuestar como profesional
          </h2>
          <p className="text-[15px] text-steel-light mb-8 max-w-md mx-auto">
            Crea tu cuenta y elabora tu primer presupuesto con APU, AIU y retenciones colombianas
            en cuestión de minutos.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/registro">
              <Button size="lg" icon={<ArrowRight className="h-4 w-4" />}>
                Crear cuenta gratis
              </Button>
            </Link>
            <Link href="/login">
              <button className="text-[14px] font-medium text-steel-light hover:text-white transition-colors duration-150">
                Ya tengo cuenta
              </button>
            </Link>
          </div>
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
          <p className="text-[11px] text-stone">Hecho con orgullo en Colombia</p>
        </div>
      </footer>
    </div>
  );
}
