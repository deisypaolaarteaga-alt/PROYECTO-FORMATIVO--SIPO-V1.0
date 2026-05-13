import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PerfilEmpresaClient } from '@/components/perfil/PerfilEmpresaClient';

export default async function PerfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return <PerfilEmpresaClient profile={profile ?? {}} />;
}
