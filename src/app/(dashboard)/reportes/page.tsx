import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  getReporteUtilidad,
  getReportePorTipoObra,
  getReportePorCliente,
  getReporteTendencia,
} from '@/actions/analytics';
import { getRangoPeriodo } from '@/lib/utils/periodos';
import ReportesClient from '@/components/reportes/ReportesClient';

export const revalidate = 0;

export default async function ReportesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const rango = getRangoPeriodo('este_mes');
  const opts  = rango
    ? { desde: rango.desde.toISOString(), hasta: rango.hasta.toISOString() }
    : {};

  const [utilidad, tipoObra, clientes, tendencia] = await Promise.all([
    getReporteUtilidad({ userId: user.id, ...opts }),
    getReportePorTipoObra({ userId: user.id, ...opts }),
    getReportePorCliente({ userId: user.id, ...opts }),
    getReporteTendencia({ userId: user.id }),
  ]);

  return (
    <ReportesClient
      userId={user.id}
      initialUtilidad={utilidad}
      initialTipoObra={tipoObra}
      initialClientes={clientes}
      initialTendencia={tendencia}
    />
  );
}
