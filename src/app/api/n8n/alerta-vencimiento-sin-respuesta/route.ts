import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { enviarEmailAlertaVencimiento } from '@/lib/email/brevo';
import { verificarSecretoN8N } from '../_auth';

export async function POST(request: NextRequest) {
  const error401 = verificarSecretoN8N(request);
  if (error401) return error401;

  try {
    const supabase = createAdminClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://proyecto-formativo-sipo-v1-0.vercel.app';

    const ahora = new Date().toISOString();

    // Presupuestos que ya vencieron y nunca respondieron
    const { data: presupuestos, error: errBudgets } = await supabase
      .from('budgets')
      .select(`
        id,
        titulo,
        user_id,
        vigencia_hasta,
        projects!inner ( nombre )
      `)
      .lt('vigencia_hasta', ahora.split('T')[0])
      .in('estado', ['enviado_a_cliente', 'visto_por_cliente'])
      .is('deleted_at', null);

    if (errBudgets) {
      console.error('[alerta-vencimiento-sin-respuesta] Error consultando budgets:', errBudgets);
      return NextResponse.json({ error: 'Error interno al consultar presupuestos' }, { status: 500 });
    }

    if (!presupuestos || presupuestos.length === 0) {
      return NextResponse.json({ alertas: 0 });
    }

    let alertas = 0;

    for (const budget of presupuestos) {
      try {
        // Obtener token con datos del cliente
        const { data: tokenData } = await supabase
          .from('presupuesto_tokens')
          .select('cliente_nombre, cliente_email')
          .eq('budget_id', budget.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Obtener datos del constructor
        const { data: perfil } = await supabase
          .from('profiles')
          .select('nombre_completo, email_empresa')
          .eq('id', budget.user_id)
          .single();

        const { data: authUser } = await supabase.auth.admin.getUserById(budget.user_id);
        const emailConstructor = perfil?.email_empresa ?? authUser?.user?.email ?? '';

        if (!emailConstructor) continue;

        const proyecto = (budget.projects as unknown as { nombre: string } | null);

        // Calcular días vencido
        const fechaVenc = new Date(budget.vigencia_hasta ?? '');
        const hoy = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
        const diasVencido = Math.max(
          1,
          Math.floor((hoy.getTime() - fechaVenc.getTime()) / (1000 * 60 * 60 * 24))
        );

        await enviarEmailAlertaVencimiento({
          destinatario: emailConstructor,
          nombreConstructor: perfil?.nombre_completo ?? 'Constructor',
          nombreCliente: tokenData?.cliente_nombre ?? tokenData?.cliente_email ?? 'El cliente',
          nombreProyecto: proyecto?.nombre ?? 'Sin nombre',
          nombrePresupuesto: budget.titulo ?? 'Presupuesto',
          diasVencido,
          linkEditor: `${appUrl}/presupuestos/${budget.id}`,
        });

        alertas++;
      } catch (err) {
        console.error(`[alerta-vencimiento-sin-respuesta] Error procesando budget ${budget.id}:`, err);
      }
    }

    return NextResponse.json({ alertas });
  } catch (err) {
    console.error('[alerta-vencimiento-sin-respuesta] Error general:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
