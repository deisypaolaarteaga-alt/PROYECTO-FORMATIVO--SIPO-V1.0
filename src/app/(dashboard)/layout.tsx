import { Sidebar } from '@/components/shared/Sidebar';
import { DashboardHeader } from '@/components/shared/DashboardHeader';
import { ThemeProvider } from '@/components/shared/ThemeProvider';

/**
 * Layout del dashboard — sand background, steel-dark sidebar
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-sand">
        <Sidebar />
        <div className="lg:ml-60 transition-all duration-200">
          <DashboardHeader />
          <main className="p-4 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
