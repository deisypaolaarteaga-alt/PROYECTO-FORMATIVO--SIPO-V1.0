import { getClientes } from '@/actions/clientes';
import { ClientesList } from '@/components/clientes/ClientesList';
import { Users, DollarSign, Briefcase, Repeat2 } from 'lucide-react';

export const metadata = {
  title: 'Clientes | SIPO',
  description: 'Administra tu base de datos de clientes y contactos para proyectos.',
};

function abreviarMonto(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(3).replace(/\.?0+$/, '')}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export default async function ClientesPage() {
  const clientes = await getClientes();

  const inversionTotal = clientes.reduce((s, c) => s + (c.valor_total_proyectos || 0), 0);
  const proyectosTotal = clientes.reduce((s, c) => s + (c.total_proyectos || 0), 0);
  const recurrentes = clientes.filter(c => (c.total_proyectos || 0) > 1).length;
  const tasaRecompra = clientes.length > 0 ? Math.round((recurrentes / clientes.length) * 100) : 0;

  const kpis = [
    {
      label: 'Clientes Activos',
      value: String(clientes.length),
      sub: 'clientes registrados',
      iconBg: 'bg-[#FFF4EE]',
      iconColor: 'text-[#D95510]',
      accent: 'border-l-[#D95510]',
      Icon: Users,
    },
    {
      label: 'Inversión Total',
      value: abreviarMonto(inversionTotal),
      sub: 'en proyectos',
      iconBg: 'bg-[#EFF6FF]',
      iconColor: 'text-[#1E6FB8]',
      accent: 'border-l-[#1E6FB8]',
      Icon: DollarSign,
    },
    {
      label: 'Proyectos Asociados',
      value: String(proyectosTotal),
      sub: 'proyectos en total',
      iconBg: 'bg-[#F0FDF4]',
      iconColor: 'text-[#2D7A45]',
      accent: 'border-l-[#2D7A45]',
      Icon: Briefcase,
    },
    {
      label: 'Tasa de Recompra',
      value: `${tasaRecompra}%`,
      sub: 'clientes recurrentes',
      iconBg: 'bg-[#FDF4FF]',
      iconColor: 'text-[#9333EA]',
      accent: 'border-l-[#9333EA]',
      Icon: Repeat2,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-[#FFF4EE] p-2.5 rounded-xl">
          <Users className="h-6 w-6 text-[#D95510]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-stone">Clientes</h1>
          <p className="text-sm text-mortar">
            Administra tu base de datos de clientes y contactos para proyectos.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className={`bg-white border border-[#E5E7EB] border-l-4 ${k.accent} rounded-2xl p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]`}
          >
            <div className={`${k.iconBg} w-10 h-10 rounded-lg flex items-center justify-center mb-4`}>
              <k.Icon className={`h-5 w-5 ${k.iconColor}`} />
            </div>
            <p className="text-sm font-medium text-[#6B7280]">{k.label}</p>
            <p className="text-3xl font-bold text-[#111827] mt-1 tabular-nums">{k.value}</p>
            <p className="text-xs text-[#9CA3AF] mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      <ClientesList initialClientes={clientes} />
    </div>
  );
}
