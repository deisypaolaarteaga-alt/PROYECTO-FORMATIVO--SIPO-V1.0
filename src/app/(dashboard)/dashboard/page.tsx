export const maxDuration = 60;

import { createClient } from '@/lib/supabase/server';
import {
  getKPIsGlobales,
  getDistribucionCD,
  getPresupuestosVencimiento,
} from '@/actions/analytics';
import DashboardClient from '@/components/dashboard/DashboardClient';

export const revalidate = 30;

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [profile, kpis, distribucion, vencimientos] = await Promise.all([
    supabase
      .from('profiles')
      .select('nombre_completo, empresa')
      .eq('id', user?.id ?? '')
      .maybeSingle()
      .then((r) => r.data),
    getKPIsGlobales(),
    getDistribucionCD(),
    getPresupuestosVencimiento(),
  ]);

  return (
    <DashboardClient
      initialKpis={kpis}
      initialDistribucion={distribucion}
      vencimientos={vencimientos}
      profile={profile}
    />
  );
}
