'use client';

import { Logo } from './Logo';

/**
 * PageLoader — Pantalla de carga inicial de la aplicación
 * Muestra el logo de SIPO con una animación elegante
 */
export function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      {/* Logo con animación de pulso */}
      <div className="animate-pulse-soft">
        <Logo variant="full" size="lg" />
      </div>

      {/* Barra de carga */}
      <div className="mt-8 w-48 h-1 bg-neutral-100 rounded-full overflow-hidden">
        <div className="h-full bg-primary-500 rounded-full animate-shimmer w-1/2" />
      </div>

      {/* Texto */}
      <p className="mt-4 text-sm text-neutral-400 animate-pulse-soft">
        Cargando SIPO...
      </p>
    </div>
  );
}
