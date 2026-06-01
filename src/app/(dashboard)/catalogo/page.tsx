import { obtenerCapitulosCatalogo } from '@/actions/catalogo';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { CatalogoView } from '@/components/catalogo/CatalogoView';

export const metadata = { title: 'Catálogo de referencia — SIPO' };

export default async function CatalogoPage() {
  const [capitulosRes, supabase] = await Promise.all([
    obtenerCapitulosCatalogo('residencial'),
    createClient(),
  ]);

  const capitulosIniciales = capitulosRes.success ? (capitulosRes.data ?? []) : [];

  // Obtener el rol del usuario autenticado
  const { data: { user } } = await supabase.auth.getUser();
  let rol: 'usuario' | 'super_admin' = 'usuario';

  if (user) {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.rol === 'super_admin') rol = 'super_admin';
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <CatalogoView capitulosIniciales={capitulosIniciales} rol={rol} />
    </div>
  );
}
