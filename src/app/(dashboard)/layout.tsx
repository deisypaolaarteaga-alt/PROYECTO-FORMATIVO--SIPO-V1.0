import { Sidebar } from '@/components/shared/Sidebar';
import { DashboardHeader } from '@/components/shared/DashboardHeader';
import { ThemeProvider } from '@/components/shared/ThemeProvider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[#ECEEF2]">
        <Sidebar />
        <div className="lg:ml-64 transition-all duration-200">
          <DashboardHeader />
          <main className="p-4 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
