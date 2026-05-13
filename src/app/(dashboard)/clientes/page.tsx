import { getClientes } from '@/actions/clientes';
import { ClientesList } from '@/components/clientes/ClientesList';
import { Users } from 'lucide-react';

export const metadata = {
  title: 'Mis Clientes | SIPO',
  description: 'Gestión de clientes y contactos comerciales.',
};

export default async function ClientesPage() {
  const clientes = await getClientes();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-[var(--accent-primary)]/10 p-2 rounded-xl">
            <Users className="h-6 w-6 text-[var(--accent-primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone">Mis Clientes</h1>
            <p className="text-sm text-mortar">
              Administra tu base de datos de clientes y contactos para proyectos.
            </p>
          </div>
        </div>
      </div>

      <ClientesList initialClientes={clientes} />
    </div>
  );
}
