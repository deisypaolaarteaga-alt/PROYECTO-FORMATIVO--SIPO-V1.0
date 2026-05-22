import { getProveedores } from '@/actions/proveedores';
import { ProveedoresList } from '@/components/proveedores/ProveedoresList';
import { Truck, Building2, User, Package } from 'lucide-react';
import { CATEGORIA_PROVEEDOR_LABELS } from '@/types';
import type { CategoriaProveedor } from '@/types';

export const metadata = {
  title: 'Proveedores | SIPO',
  description: 'Gestión de proveedores y contactos de suministro.',
};

export default async function ProveedoresPage() {
  const proveedores = await getProveedores();

  const totalEmpresa = proveedores.filter(p => p.tipo === 'empresa').length;
  const totalPersona = proveedores.filter(p => p.tipo === 'persona').length;

  const catCounts = proveedores.reduce<Record<string, number>>((acc, p) => {
    acc[p.categoria] = (acc[p.categoria] || 0) + 1;
    return acc;
  }, {});
  const categoriaTop = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];

  const kpis = [
    {
      label: 'Total Proveedores',
      value: String(proveedores.length),
      sub: 'proveedores activos',
      iconBg: 'bg-[#FFF4EE]',
      iconColor: 'text-[#D95510]',
      accent: 'border-l-[#D95510]',
      Icon: Truck,
    },
    {
      label: 'Personas Jurídicas',
      value: String(totalEmpresa),
      sub: 'empresas y sociedades',
      iconBg: 'bg-[#EFF6FF]',
      iconColor: 'text-[#1E6FB8]',
      accent: 'border-l-[#1E6FB8]',
      Icon: Building2,
    },
    {
      label: 'Personas Naturales',
      value: String(totalPersona),
      sub: 'contratistas individuales',
      iconBg: 'bg-[#F0FDF4]',
      iconColor: 'text-[#2D7A45]',
      accent: 'border-l-[#2D7A45]',
      Icon: User,
    },
    {
      label: 'Categoría + frecuente',
      value: categoriaTop ? String(categoriaTop[1]) : '0',
      sub: categoriaTop
        ? CATEGORIA_PROVEEDOR_LABELS[categoriaTop[0] as CategoriaProveedor]
        : 'Sin proveedores aún',
      iconBg: 'bg-[#FDF4FF]',
      iconColor: 'text-[#9333EA]',
      accent: 'border-l-[#9333EA]',
      Icon: Package,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="bg-[#FFF4EE] p-2.5 rounded-xl">
          <Truck className="h-6 w-6 text-[#D95510]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-stone">Proveedores</h1>
          <p className="text-sm text-mortar">
            Administra tu directorio de proveedores de materiales, equipos y servicios.
          </p>
        </div>
      </div>

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

      <ProveedoresList initialProveedores={proveedores} />
    </div>
  );
}
