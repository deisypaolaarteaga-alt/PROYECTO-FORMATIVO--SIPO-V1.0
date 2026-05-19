import { getProjects } from '@/actions/proyectos';
import Link from 'next/link';
import { Plus, FolderKanban } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { ProyectosGrid } from '@/components/proyectos/ProyectosGrid';

export const metadata = {
  title: 'Proyectos | SIPO',
  description: 'Administra y organiza tus proyectos de obra.',
};

export default async function ProyectosPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="bg-[#FFF4EE] p-2.5 rounded-xl">
            <FolderKanban className="h-6 w-6 text-[#D95510]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">Proyectos</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">Administra y organiza tus proyectos de obra.</p>
          </div>
        </div>
        <Link href="/proyectos/nuevo">
          <Button icon={<Plus className="h-4 w-4" />}>Nuevo proyecto</Button>
        </Link>
      </div>

      <ProyectosGrid projects={projects} />
    </div>
  );
}
