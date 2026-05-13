'use client';

import Link from 'next/link';
import { Home, AlertCircle } from 'lucide-react';
import { Button } from '@/components/shared/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="w-20 h-20 bg-danger-50 rounded-3xl flex items-center justify-center mb-8">
        <AlertCircle className="h-10 w-10 text-danger-600" />
      </div>
      <h1 className="text-6xl font-black text-neutral-900 mb-4">404</h1>
      <h2 className="text-2xl font-bold text-neutral-800 mb-4">¡Página no encontrada!</h2>
      <p className="text-neutral-500 max-w-md mb-10 leading-relaxed">
        Lo sentimos, la página que estás buscando no existe o ha sido movida a otro lugar.
      </p>
      <Link href="/dashboard">
        <Button icon={<Home className="h-4 w-4" />}>
          Volver al Inicio
        </Button>
      </Link>
    </div>
  );
}
