import { Logo } from '@/components/shared/Logo';
import { HardHat, Ruler } from 'lucide-react';

/**
 * Auth Layout — Split screen
 * Izquierda: steel-dark con plano arquitectónico SVG detallado
 * Derecha: blanco con el formulario
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* ── Panel Izquierdo — steel-dark ── */}
      <div className="hidden lg:flex lg:w-[44%] xl:w-[40%] bg-[#1A2535] flex-col justify-between px-12 py-12 relative overflow-hidden">

        {/* ── Fondo: plano arquitectónico SVG ── */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Grid de puntos blueprint */}
            <pattern id="bp-dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="0"  cy="0"  r="0.7" fill="white" opacity="0.12" />
              <circle cx="32" cy="0"  r="0.7" fill="white" opacity="0.12" />
              <circle cx="0"  cy="32" r="0.7" fill="white" opacity="0.12" />
              <circle cx="32" cy="32" r="0.7" fill="white" opacity="0.12" />
              <circle cx="16" cy="16" r="0.4" fill="white" opacity="0.06" />
            </pattern>

            {/* Plano de planta arquitectónica */}
            <pattern id="bp-floor" x="0" y="0" width="320" height="260" patternUnits="userSpaceOnUse">
              {/* Contorno exterior */}
              <rect x="20" y="20" width="280" height="200" fill="none" stroke="white" strokeWidth="1.2" opacity="0.18" />

              {/* Muros interiores */}
              <line x1="20"  y1="110" x2="120" y2="110" stroke="white" strokeWidth="0.8" opacity="0.14" />
              <line x1="120" y1="20"  x2="120" y2="110" stroke="white" strokeWidth="0.8" opacity="0.14" />
              <line x1="120" y1="110" x2="120" y2="220" stroke="white" strokeWidth="0.8" opacity="0.14" />
              <line x1="120" y1="165" x2="300" y2="165" stroke="white" strokeWidth="0.8" opacity="0.14" />
              <line x1="200" y1="20"  x2="200" y2="165" stroke="white" strokeWidth="0.8" opacity="0.14" />

              {/* Ventanas (huecos en paredes) */}
              <line x1="50" y1="20" x2="90" y2="20" stroke="#1A2535" strokeWidth="2.5" />
              <line x1="50" y1="18" x2="90" y2="18" stroke="white" strokeWidth="0.6" opacity="0.30" />

              {/* Puertas (arco) */}
              <path d="M 120 80 Q 140 80 140 100" fill="none" stroke="white" strokeWidth="0.7" opacity="0.20" />
              <line x1="120" y1="80"  x2="140" y2="80"  stroke="white" strokeWidth="0.7" opacity="0.20" />

              {/* Cotas / líneas de dimensión */}
              <line x1="20"  y1="230" x2="300" y2="230" stroke="white" strokeWidth="0.5" opacity="0.22" />
              <line x1="20"  y1="226" x2="20"  y2="234" stroke="white" strokeWidth="0.5" opacity="0.22" />
              <line x1="300" y1="226" x2="300" y2="234" stroke="white" strokeWidth="0.5" opacity="0.22" />
              <line x1="310" y1="20"  x2="310" y2="220" stroke="white" strokeWidth="0.5" opacity="0.22" />
              <line x1="306" y1="20"  x2="314" y2="20"  stroke="white" strokeWidth="0.5" opacity="0.22" />
              <line x1="306" y1="220" x2="314" y2="220" stroke="white" strokeWidth="0.5" opacity="0.22" />

              {/* Rótulo del plano */}
              <rect x="20" y="244" width="280" height="14" fill="none" stroke="white" strokeWidth="0.5" opacity="0.14" />
              <line x1="150" y1="244" x2="150" y2="258" stroke="white" strokeWidth="0.5" opacity="0.14" />
            </pattern>
          </defs>

          {/* Capas de fondo */}
          <rect width="100%" height="100%" fill="url(#bp-dots)" />
          <rect width="100%" height="100%" fill="url(#bp-floor)" />

          {/* Acento: franja naranja tenue en la derecha */}
          <rect x="calc(100% - 3px)" y="0" width="3" height="100%" fill="#C84B1A" opacity="0.35" />
        </svg>

        {/* ── Logo ── */}
        <div className="relative z-10">
          <Logo variant="white" size="md" />
        </div>

        {/* ── Tagline central ── */}
        <div className="relative z-10 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px w-8 bg-[#C84B1A]" />
            <span className="text-[10px] font-semibold text-[#C84B1A] tracking-widest uppercase">
              Presupuestos de Obra
            </span>
          </div>

          <h2 className="text-[30px] font-semibold text-white leading-tight">
            Presupuestos de obra{' '}
            <span className="text-[#C84B1A]">precisos,</span>
            <br />en minutos.
          </h2>

          {/* Ícono decorativo — plano/ruler */}
          <div className="flex items-center gap-3 py-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#C84B1A]/15 border border-[#C84B1A]/25">
              <Ruler className="h-5 w-5 text-[#C84B1A]" />
            </div>
            <p className="text-[13px] text-[#8BA3B8] leading-snug max-w-[200px]">
              Metodología APU/AIU para ingenieros colombianos
            </p>
          </div>

          <p className="text-[13px] text-[#8BA3B8] leading-relaxed max-w-xs">
            La herramienta que los constructores colombianos
            usan para crear presupuestos técnicos precisos.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              { value: '500+', label: 'Ingenieros activos' },
              { value: '3×',   label: 'Más rápido que Excel' },
              { value: '98%',  label: 'Precisión en APU' },
              { value: '$0',   label: 'Para empezar' },
            ].map((s) => (
              <div key={s.label} className="border border-white/10 rounded-lg p-3 bg-white/[0.03]">
                <p className="text-[19px] font-semibold text-white leading-none">{s.value}</p>
                <p className="text-[11px] text-[#8BA3B8] mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer del panel ── */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-[11px] text-[#7A7265]">
            <HardHat className="h-3.5 w-3.5" />
            <span>Hecho para la construcción colombiana</span>
          </div>
        </div>
      </div>

      {/* ── Panel Derecho — formulario ── */}
      <div className="flex-1 bg-[#FAFAF9] flex flex-col">
        {/* Mobile logo */}
        <div className="flex items-center justify-center py-8 border-b border-[#E8E4DE] lg:hidden">
          <Logo variant="full" size="md" />
        </div>

        {/* Formulario centrado */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-[420px] animate-slide-up">
            {children}
          </div>
        </div>

        {/* Footer del panel */}
        <div className="px-6 py-5 border-t border-[#E8E4DE] text-center">
          <p className="text-[11px] text-[#7A7265]">
            © {new Date().getFullYear()} SIPO · Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
