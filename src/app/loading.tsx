import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm italic">S</span>
          </div>
        </div>
      </div>
      <p className="mt-6 text-sm font-medium text-neutral-500 animate-pulse tracking-wide uppercase">
        Cargando SIPO...
      </p>
    </div>
  );
}
