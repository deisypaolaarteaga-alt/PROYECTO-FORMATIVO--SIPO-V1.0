import { createClient } from '@/lib/supabase/server';
import { Avatar } from '@/components/shared/Avatar';
import { signOut } from '@/actions/auth';
import { LogOut } from 'lucide-react';

/**
 * Header — white bg, concrete border-bottom, 60px height
 */
export async function DashboardHeader() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('nombre_completo, empresa')
    .eq('id', user?.id ?? '')
    .maybeSingle();

  const nombre = profile?.nombre_completo
    || user?.user_metadata?.nombre_completo
    || user?.user_metadata?.full_name
    || user?.email
    || 'Usuario';
  const empresa = profile?.empresa || user?.user_metadata?.empresa || '';

  return (
    <header className="h-[60px] bg-white border-b border-concrete flex items-center justify-between px-6 lg:px-8">
      <div className="w-10 lg:hidden" />
      <div className="hidden lg:block" />

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <Avatar name={nombre} size="sm" />
          <div className="hidden sm:block text-right">
            <p className="text-[13px] font-medium text-ink leading-tight">
              {nombre}
            </p>
            {empresa && (
              <p className="text-[11px] text-stone leading-tight">{empresa}</p>
            )}
          </div>
        </div>

        <div className="h-5 w-px bg-concrete" />

        <form action={signOut}>
          <button
            type="submit"
            className="p-2 rounded-lg text-mortar hover:text-danger-text hover:bg-danger-bg transition-colors cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </header>
  );
}
