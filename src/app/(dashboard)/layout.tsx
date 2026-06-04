import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/shared/Sidebar';
import { DashboardHeader } from '@/components/shared/DashboardHeader';
import { ThemeProvider } from '@/components/shared/ThemeProvider';
import { BannerOnboarding } from '@/components/onboarding/BannerOnboarding';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let mostrarOnboarding = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('empresa')
      .eq('id', user.id)
      .single();
    mostrarOnboarding = !profile?.empresa;
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[#ECEEF2]">
        <Sidebar />
        <div className="lg:ml-64 transition-all duration-200">
          <DashboardHeader />
          <BannerOnboarding mostrarOnboarding={mostrarOnboarding} />
          <main className="p-4 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
