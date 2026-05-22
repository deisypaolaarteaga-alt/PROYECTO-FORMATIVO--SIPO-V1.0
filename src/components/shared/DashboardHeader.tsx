import { createClient } from '@/lib/supabase/server';
import { Avatar } from '@/components/shared/Avatar';
import { signOut } from '@/actions/auth';
import { LogOut } from 'lucide-react';

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
    <header className="h-[60px] bg-white border-b border-[#EAE6E0] flex items-center justify-between px-6 lg:px-8">
      {/* Mobile: spacer para el botón hamburguesa */}
      <div className="w-10 lg:hidden" />

      {/* Desktop: indicador de sección estilo path */}
      <div className="hidden lg:flex items-center gap-1.5 select-none">
        <span className="text-[13px] font-medium text-[#C84B1A]">/</span>
        <span className="text-[12px] font-medium text-[#A89F96] tracking-[0.06em] uppercase">
          Panel de control
        </span>
      </div>

      {/* Derecha: usuario + logout */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={nombre} size="sm" />
          <div className="hidden sm:block text-right">
            <p className="text-[13px] font-medium text-[#1C1814] leading-tight">
              {nombre}
            </p>
            {empresa && (
              <p className="text-[11px] text-[#7A7265] leading-tight">{empresa}</p>
            )}
          </div>
        </div>

        <div className="h-4 w-px bg-[#E2DDD6]" />

        <form action={signOut}>
          <button
            type="submit"
            className="p-1.5 rounded-lg text-[#C8C0B5] hover:text-[#991B1B] hover:bg-[#FDE8E8] transition-colors duration-150 cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </header>
  );
}
