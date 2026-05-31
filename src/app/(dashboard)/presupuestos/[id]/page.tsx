import { obtenerPresupuesto, actualizarPresupuesto } from '@/actions/presupuestos';
import { EditorPresupuesto } from '@/components/presupuestos/EditorPresupuesto';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Props { params: Promise<{ id: string }> }

export default async function PresupuestoEditorPage({ params }: Props) {
  const { id } = await params;
  const result = await obtenerPresupuesto(id);
  if (!result || !('data' in result) || !result.data) notFound();
  let budget = result.data;

  // Auto-archivado: si la vigencia venció y no está aprobado ni archivado → archivar
  const vigenciaDias = Number(budget.vigencia_dias ?? 0);
  if (
    vigenciaDias > 0 &&
    budget.created_at &&
    !['aprobado', 'archivado'].includes(budget.estado ?? '')
  ) {
    const fechaVenc = new Date(budget.created_at);
    fechaVenc.setDate(fechaVenc.getDate() + vigenciaDias);
    if (new Date() > fechaVenc) {
      await actualizarPresupuesto(budget.id, { estado: 'archivado' });
      const refreshed = await obtenerPresupuesto(id);
      if (refreshed && 'data' in refreshed && refreshed.data) {
        budget = refreshed.data;
      }
    }
  }

  const { createClient: getServerClient } = await import('@/lib/supabase/server');
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    const { redirect } = await import('next/navigation');
    return redirect('/login');
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  return (
    <div className="flex flex-col h-[calc(100vh-64px-32px)] animate-fade-in">
      <div className="px-6 py-2">
        <Link href={`/proyectos/${budget.project_id}`} className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-600 transition-colors">
          <ArrowLeft className="h-3 w-3" /> {
            (budget as any).projects ? (
              Array.isArray((budget as any).projects) 
                ? (budget as any).projects[0]?.nombre 
                : (budget as any).projects.nombre
            ) : 'Proyecto'
          }
        </Link>
      </div>
      <div className="flex-1 overflow-hidden rounded-2xl border border-neutral-100 shadow-sm mx-0">
        <EditorPresupuesto budget={budget} profile={profile} />
      </div>
    </div>
  );
}
