'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/shared/Button';

interface BotonIAProps {
  onClick: () => Promise<void>;
  iaConfigurada: boolean;
  consultasRestantes: number;
}

export function BotonIA({ onClick, iaConfigurada, consultasRestantes }: BotonIAProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (!iaConfigurada || consultasRestantes <= 0) return;
    
    setLoading(true);
    setError(null);
    try {
      await onClick();
    } catch (err: any) {
      setError(err.message || 'Error al conectar con la IA');
    } finally {
      setLoading(false);
    }
  };

  if (!iaConfigurada) {
    return (
      <div className="group relative inline-block">
        <Button 
          disabled 
          variant="outline" 
          icon={<Sparkles className="h-4 w-4" />}
          className="opacity-50"
        >
          Generar con IA
        </Button>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-neutral-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          IA no configurada — agrega tu API key en configuración
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 items-start">
      <Button
        onClick={handleClick}
        disabled={loading || consultasRestantes <= 0}
        variant="primary"
        icon={!loading ? <Sparkles className="h-4 w-4" /> : undefined}
      >
        {loading ? 'Consultando IA...' : 'Generar con IA'}
      </Button>
      
      {!loading && (
        <span className="text-[10px] text-neutral-500 font-medium">
          {consultasRestantes} consultas restantes hoy
        </span>
      )}

      {error && (
        <div className="flex flex-col gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg mt-2">
          <p className="font-semibold">Ha ocurrido un error:</p>
          <p>{error}</p>
          <button 
            onClick={() => setError(null)} 
            className="text-xs font-bold text-red-700 underline text-left mt-1"
          >
            Continuar manualmente o reintentar
          </button>
        </div>
      )}
    </div>
  );
}
