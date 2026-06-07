import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { enviarEmailAlertaPresupuestoVisto } from '@/lib/email/brevo';
import { verificarSecretoN8N } from '../_auth';

interface BodyAlertaVisto {
  token_id?: string;
  budget_id?: string;
  cliente_email?: string;
  cliente_nombre?: string;
  visto_at?: string;
}

export async function POST(request: NextRequest) {
  const error401 = verificarSecretoN8N(request);
  if (error401) return error401;

  try {
    const body: BodyAlertaVisto = await request.json();
    const { budget_id, cliente_nombre, cliente_email, visto_at } = body;

    if (!budget_id) {
      return NextResponse.json({ error: 'budget_id requerido' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://proyecto-formativo-sipo-v1-0.vercel.app';

    // Obtener datos del presupuesto y proyecto
    const { data: budget, error: errBudget } = await supabase
      .from('budgets')
      .select(`id, titulo, user_id, projects:project_id ( nombre )`)
      .eq('id', budget_id)
      .is('deleted_at', null)
      .single();

    if (errBudget || !budget) {
      console.error('[alerta-presupuesto-visto] Budget no encontrado:', budget_id, errBudget);
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 });
    }

    // Obtener email del constructor
    const { data: perfil } = await supabase
      .from('profiles')
      .select('nombre_completo, email_empresa')
      .eq('id', budget.user_id)
      .single();

    const { data: authUser } = await supabase.auth.admin.getUserById(budget.user_id);
    const emailConstructor = perfil?.email_empresa ?? authUser?.user?.email ?? '';

    if (!emailConstructor) {
      console.error('[alerta-presupuesto-visto] No se encontró email del constructor para user_id:', budget.user_id);
      return NextResponse.json({ success: false, error: 'Email del constructor no encontrado' });
    }

    const proyecto = (budget.projects as unknown as { nombre: string } | null);

    const horaApertura = visto_at
      ? new Date(visto_at).toLocaleString('es-CO', {
          timeZone: 'America/Bogota',
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'medium', timeStyle: 'short' });

    await enviarEmailAlertaPresupuestoVisto({
      destinatario: emailConstructor,
      nombreConstructor: perfil?.nombre_completo ?? 'Constructor',
      nombreCliente: cliente_nombre ?? cliente_email ?? 'Tu cliente',
      nombreProyecto: proyecto?.nombre ?? 'Sin nombre',
      nombrePresupuesto: budget.titulo ?? 'Presupuesto',
      horaApertura,
      linkEditor: `${appUrl}/presupuestos/${budget_id}`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[alerta-presupuesto-visto] Error general:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
