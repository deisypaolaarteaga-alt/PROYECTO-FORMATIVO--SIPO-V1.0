import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { enviarEmailRecordatorioVencimiento } from '@/lib/email/brevo';
import { verificarSecretoN8N } from '../_auth';

export async function POST(request: NextRequest) {
  const error401 = verificarSecretoN8N(request);
  if (error401) return error401;

  try {
    const supabase = createAdminClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://proyecto-formativo-sipo-v1-0.vercel.app';

    // Fecha de hoy + 3 días en timezone Bogotá
    const ahora = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
    const en3Dias = new Date(ahora);
    en3Dias.setDate(en3Dias.getDate() + 3);
    const fechaISO = en3Dias.toISOString().split('T')[0]; // YYYY-MM-DD

    // Buscar presupuestos que vencen exactamente en 3 días
    const { data: presupuestos, error: errBudgets } = await supabase
      .from('budgets')
      .select(`
        id,
        nombre,
        vigencia_hasta,
        estado,
        user_id,
        projects!inner ( nombre )
      `)
      .eq('vigencia_hasta', fechaISO)
      .in('estado', ['enviado_a_cliente', 'visto_por_cliente'])
      .is('deleted_at', null);

    if (errBudgets) {
      console.error('[recordatorio-vencimiento] Error consultando budgets:', errBudgets);
      return NextResponse.json({ error: 'Error interno al consultar presupuestos' }, { status: 500 });
    }

    if (!presupuestos || presupuestos.length === 0) {
      return NextResponse.json({ enviados: 0, presupuestos: [] });
    }

    const enviados: string[] = [];

    for (const budget of presupuestos) {
      try {
        // Obtener token activo con datos del cliente
        const { data: tokenData } = await supabase
          .from('presupuesto_tokens')
          .select('token, cliente_email, cliente_nombre')
          .eq('budget_id', budget.id)
          .not('cliente_email', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!tokenData?.cliente_email) continue;

        // Obtener datos del constructor
        const { data: perfil } = await supabase
          .from('profiles')
          .select('nombre_completo, email_empresa, telefono')
          .eq('id', budget.user_id)
          .single();

        const { data: authUser } = await supabase.auth.admin.getUserById(budget.user_id);
        const emailConstructor = perfil?.email_empresa ?? authUser?.user?.email ?? '';

        const proyecto = (budget.projects as unknown as { nombre: string } | null);
        const fechaVenc = new Date(budget.vigencia_hasta ?? '').toLocaleDateString('es-CO', {
          timeZone: 'America/Bogota',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        await enviarEmailRecordatorioVencimiento({
          destinatario: tokenData.cliente_email,
          nombreCliente: tokenData.cliente_nombre ?? tokenData.cliente_email,
          nombreProyecto: proyecto?.nombre ?? 'Sin nombre',
          nombrePresupuesto: budget.nombre ?? 'Presupuesto',
          fechaVencimiento: fechaVenc,
          linkPortal: `${appUrl}/presupuesto-publico/${tokenData.token}`,
          nombreConstructor: perfil?.nombre_completo ?? 'Constructor',
          emailConstructor: emailConstructor,
          telefonoConstructor: perfil?.telefono ?? undefined,
        });

        enviados.push(budget.id);
      } catch (err) {
        console.error(`[recordatorio-vencimiento] Error procesando budget ${budget.id}:`, err);
      }
    }

    return NextResponse.json({ enviados: enviados.length, presupuestos: enviados });
  } catch (err) {
    console.error('[recordatorio-vencimiento] Error general:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
