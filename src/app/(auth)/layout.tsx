import { Logo } from '@/components/shared/Logo';
import { HardHat } from 'lucide-react';

/**
 * Auth Layout — Split screen
 * Izquierda: steel-dark con patrón geométrico arquitectónico
 * Derecha: blanco con el formulario
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* ── Panel Izquierdo — steel-dark ── */}
      <div className="hidden lg:flex lg:w-[42%] xl:w-[38%] bg-steel-dark flex-col justify-between px-12 py-12 relative overflow-hidden">
        {/* Patrón geométrico tipo blueprint */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Grid de puntos */}
          <defs>
            <pattern id="blueprint-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="0" cy="0" r="0.8" fill="white" />
              <circle cx="40" cy="0" r="0.8" fill="white" />
              <circle cx="0" cy="40" r="0.8" fill="white" />
              <circle cx="40" cy="40" r="0.8" fill="white" />
              <circle cx="20" cy="20" r="0.5" fill="white" />
            </pattern>
            <pattern id="blueprint-lines" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <rect x="10" y="10" width="100" height="70" fill="none" stroke="white" strokeWidth="0.5" />
              <line x1="10" y1="30" x2="110" y2="30" stroke="white" strokeWidth="0.3" />
              <line x1="10" y1="50" x2="110" y2="50" stroke="white" strokeWidth="0.3" />
              <line x1="40" y1="10" x2="40" y2="80" stroke="white" strokeWidth="0.3" />
              <line x1="70" y1="10" x2="70" y2="80" stroke="white" strokeWidth="0.3" />
              {/* Planta arquitectónica abstracta */}
              <rect x="25" y="95" width="70" height="15" fill="none" stroke="white" strokeWidth="0.5" />
              <line x1="55" y1="95" x2="55" y2="110" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#blueprint-grid)" />
          <rect width="100%" height="100%" fill="url(#blueprint-lines)" opacity="0.7" />
        </svg>

        {/* Logo */}
        <div className="relative z-10">
          <Logo variant="white" size="md" />
        </div>

        {/* Tagline central */}
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-burn-orange" />
            <span className="text-[11px] font-medium text-burn-orange tracking-widest uppercase">
              Plataforma de Presupuestos
            </span>
          </div>
          <h2 className="text-[32px] font-semibold text-white leading-tight">
            Presupuesta con{' '}
            <span className="text-burn-orange">inteligencia.</span>
          </h2>
          <p className="text-[14px] text-steel-light leading-relaxed max-w-xs">
            La herramienta que los ingenieros y constructores colombianos
            usan para crear presupuestos técnicos precisos en minutos.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { value: '500+', label: 'Ingenieros activos' },
              { value: '3x', label: 'Más rápido que Excel' },
              { value: '98%', label: 'Precisión en APU' },
              { value: '$0', label: 'Para empezar' },
            ].map((s, i) => (
              <div key={i} className="border border-white/10 rounded-lg p-3">
                <p className="text-[20px] font-semibold text-white">{s.value}</p>
                <p className="text-[11px] text-steel-light mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer del panel */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-[11px] text-stone">
            <HardHat className="h-3.5 w-3.5" />
            <span>Hecho para la construcción colombiana</span>
          </div>
        </div>
      </div>

      {/* ── Panel Derecho — formulario ── */}
      <div className="flex-1 bg-white flex flex-col">
        {/* Mobile logo */}
        <div className="flex items-center justify-center py-8 border-b border-concrete lg:hidden">
          <Logo variant="full" size="md" />
        </div>

        {/* Formulario centrado */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-[400px] animate-slide-up">
            {children}
          </div>
        </div>

        {/* Footer del panel */}
        <div className="px-6 py-5 border-t border-concrete text-center">
          <p className="text-[11px] text-stone">
            © {new Date().getFullYear()} SIPO · Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
