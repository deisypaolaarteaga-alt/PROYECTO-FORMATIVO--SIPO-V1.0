import { getProveedores } from '@/actions/proveedores';
import { ProveedoresList } from '@/components/proveedores/ProveedoresList';
import { ProveedoresNewButton } from '@/components/proveedores/ProveedoresNewButton';
import { Truck } from 'lucide-react';

export const metadata = {
  title: 'Mis Proveedores | SIPO',
  description: 'Gestión de proveedores y contactos de suministro.',
};

export default async function ProveedoresPage() {
  const proveedores = await getProveedores();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-[var(--accent-primary)]/10 p-2 rounded-xl">
            <Truck className="h-6 w-6 text-[var(--accent-primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone">Mis Proveedores</h1>
            <p className="text-sm text-mortar">
              Administra tu directorio de proveedores de materiales, equipos y servicios.
            </p>
          </div>
        </div>
        <ProveedoresNewButton />
      </div>

      <ProveedoresList initialProveedores={proveedores} />
    </div>
  );
}
