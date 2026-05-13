import { getCliente } from '@/actions/clientes';
import { notFound } from 'next/navigation';
import { Card } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';
import { Button } from '@/components/shared/Button';
import { 
  Building2, User, MapPin, Phone, Mail, 
  Briefcase, Calendar, ChevronLeft, ArrowRight,
  Contact, FileText, Map
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/format';

export default async function ClienteDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const cliente = await getCliente(id);

  if (!cliente) {
    notFound();
  }

  const proyectos = (cliente as any).projects || [];
  
  // Calcular totales
  let inversionTotal = 0;
  proyectos.forEach((p: any) => {
    (p.budgets || []).forEach((b: any) => {
      inversionTotal += Number(b.costo_directo || 0);
    });
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/clientes">
            <Button variant="ghost" size="sm" className="rounded-full">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-stone">{cliente.nombre_razon_social}</h1>
              {cliente.tipo === 'empresa' ? (
                <Badge className="bg-blue-50 text-blue-700 border-blue-100">Empresa</Badge>
              ) : (
                <Badge className="bg-amber-50 text-amber-700 border-amber-100">Persona Natural</Badge>
              )}
            </div>
            <p className="text-mortar text-sm">
              NIT/Cédula: {cliente.nit_cedula || 'N/A'} • Registrado el {new Date(cliente.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Data */}
        <div className="lg:col-span-1 space-y-6">
          <Card title="Información de Contacto">
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-steel-fog rounded-lg">
                  <Contact className="h-4 w-4 text-mortar" />
                </div>
                <div>
                  <p className="text-[11px] uppercase font-bold text-mortar tracking-wider leading-none mb-1">Contacto Principal</p>
                  <p className="text-sm font-semibold text-stone">{cliente.nombre_contacto || 'No especificado'}</p>
                  {cliente.cargo_contacto && (
                    <p className="text-xs text-mortar">{cliente.cargo_contacto}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-steel-fog rounded-lg">
                  <Phone className="h-4 w-4 text-mortar" />
                </div>
                <div>
                  <p className="text-[11px] uppercase font-bold text-mortar tracking-wider leading-none mb-1">Teléfono</p>
                  {cliente.telefono ? (
                    <a href={`tel:${cliente.telefono}`} className="text-sm font-semibold text-[var(--accent-primary)] hover:underline">
                      {cliente.telefono}
                    </a>
                  ) : (
                    <p className="text-sm text-mortar italic">No registrado</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-steel-fog rounded-lg">
                  <Mail className="h-4 w-4 text-mortar" />
                </div>
                <div>
                  <p className="text-[11px] uppercase font-bold text-mortar tracking-wider leading-none mb-1">Email</p>
                  {cliente.email ? (
                    <a href={`mailto:${cliente.email}`} className="text-sm font-semibold text-[var(--accent-primary)] hover:underline break-all">
                      {cliente.email}
                    </a>
                  ) : (
                    <p className="text-sm text-mortar italic">No registrado</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-concrete pt-5">
                <div className="p-2 bg-steel-fog rounded-lg">
                  <MapPin className="h-4 w-4 text-mortar" />
                </div>
                <div>
                  <p className="text-[11px] uppercase font-bold text-mortar tracking-wider leading-none mb-1">Ubicación</p>
                  <p className="text-sm font-semibold text-stone">
                    {cliente.ciudad}{cliente.departamento ? `, ${cliente.departamento}` : ''}
                  </p>
                  {cliente.direccion && (
                    <p className="text-xs text-mortar mt-1">{cliente.direccion}</p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Resumen Financiero del Cliente */}
          <Card className="bg-stone border-none text-white overflow-hidden relative">
            <div className="absolute top-[-20px] right-[-20px] opacity-10">
              <Briefcase className="h-32 w-32" />
            </div>
            <div className="relative z-10 space-y-4">
              <div>
                <p className="text-[11px] uppercase font-bold text-mortar tracking-wider leading-none mb-2">Inversión Total Acumulada</p>
                <p className="text-2xl font-bold">{formatCurrency(inversionTotal)}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-concrete/20">
                <p className="text-xs font-medium text-concrete">Total Proyectos</p>
                <p className="text-sm font-bold">{proyectos.length}</p>
              </div>
            </div>
          </Card>

          {cliente.notas && (
            <Card title="Notas">
              <p className="text-sm text-stone whitespace-pre-wrap italic">"{cliente.notas}"</p>
            </Card>
          )}
        </div>

        {/* Right Column: Proyectos */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-mortar" />
              Proyectos asociados ({proyectos.length})
            </h2>
          </div>

          {proyectos.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-12 text-center border-dashed">
              <p className="text-mortar text-sm mb-4">No hay proyectos asociados a este cliente todavía.</p>
              <Link href="/proyectos/nuevo">
                <Button variant="outline" size="sm">Vincular nuevo proyecto</Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {proyectos.map((proyecto: any) => {
                const totalProyecto = (proyecto.budgets || []).reduce((acc: number, b: any) => acc + Number(b.costo_directo || 0), 0);
                
                return (
                  <Card key={proyecto.id} className="p-0 overflow-hidden group hover:border-[var(--accent-primary)]/30 transition-all">
                    <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="hidden sm:flex h-12 w-12 rounded-xl bg-steel-fog items-center justify-center text-mortar group-hover:text-[var(--accent-primary)] group-hover:bg-[var(--accent-primary)]/5 transition-all">
                          <Map className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-stone leading-none">{proyecto.nombre}</h4>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="text-xs text-mortar flex items-center">
                              <MapPin className="h-3 w-3 mr-1" /> {proyecto.ubicacion || 'Sin ubicación'}
                            </span>
                            <span className="text-xs text-mortar flex items-center">
                              <Calendar className="h-3 w-3 mr-1" /> {new Date(proyecto.created_at).toLocaleDateString()}
                            </span>
                            <Badge className="text-[10px] uppercase py-0 px-2">
                              {proyecto.tipo_obra || 'Otro'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 sm:text-right border-t sm:border-t-0 border-concrete pt-4 sm:pt-0">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-mortar tracking-wider leading-none">Costo Directo</p>
                          <p className="text-base font-bold text-stone">{formatCurrency(totalProyecto)}</p>
                          <p className="text-[10px] text-mortar">{proyecto.budgets?.length || 0} presupuestos</p>
                        </div>
                        <Link href={`/proyectos/${proyecto.id}`}>
                          <Button size="sm" variant="ghost" className="rounded-full hover:bg-[var(--accent-primary)]/10 hover:text-[var(--accent-primary)]">
                            <ArrowRight className="h-5 w-5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
