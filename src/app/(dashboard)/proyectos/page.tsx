import { getProjects } from '@/actions/proyectos';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { ProyectosGrid } from '@/components/proyectos/ProyectosGrid';

export default async function ProyectosPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Proyectos</h1>
        </div>
        <Link href="/proyectos/nuevo">
          <Button icon={<Plus className="h-4 w-4" />}>Nuevo proyecto</Button>
        </Link>
      </div>

      <ProyectosGrid projects={projects} />
    </div>
  );
}
