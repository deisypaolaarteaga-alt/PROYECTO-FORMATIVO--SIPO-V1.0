import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { enviarEmailRecordatorioSinRespuesta } from '@/lib/email/brevo';
import { verificarSecretoN8N } from '../_auth';

export async function POST(request: NextRequest) {
  const error401 = verificarSecretoN8N(request);
  if (error401) return error401;

  try {
    const supabase = createAdminClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://proyecto-formativo-sipo-v1-0.vercel.app';

    // Tokens donde: cliente lo vio, no respondió, visto hace > 72h, presupuesto en estado visto_por_cliente
    const { data: tokens, error: errTokens } = await supabase
      .from('presupuesto_tokens')
      .select(`
        token,
        budget_id,
        cliente_email,
        cliente_nombre,
        visto_at,
        budgets!inner ( id, titulo, user_id, estado, deleted_at, projects!inner ( nombre ) )
      `)
      .not('visto_at', 'is', null)
      .is('cliente_accion', null)
      .lt('visto_at', new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString());

    if (errTokens) {
      console.error('[recordatorio-sin-respuesta] Error consultando tokens:', errTokens);
      return NextResponse.json({ error: 'Error interno al consultar tokens' }, { status: 500 });
    }

    if (!tokens || tokens.length === 0) {
      return NextResponse.json({ enviados: 0 });
    }

    // Filtrar solo presupuestos con estado visto_por_cliente y no eliminados
    const tokensValidos = tokens.filter((t) => {
      const b = t.budgets as unknown as { estado: string; deleted_at: string | null } | null;
      return b?.estado === 'visto_por_cliente' && !b?.deleted_at;
    });

    let enviados = 0;

    for (const token of tokensValidos) {
      if (!token.cliente_email) continue;

      try {
        const budget = token.budgets as unknown as {
          id: string;
          titulo: string;
          user_id: string;
          projects: { nombre: string } | null;
        };

        const { data: perfil } = await supabase
          .from('profiles')
          .select('nombre_completo, email_empresa, telefono')
          .eq('id', budget.user_id)
          .single();

        const { data: authUser } = await supabase.auth.admin.getUserById(budget.user_id);
        const emailConstructor = perfil?.email_empresa ?? authUser?.user?.email ?? '';

        await enviarEmailRecordatorioSinRespuesta({
          destinatario: token.cliente_email,
          nombreCliente: token.cliente_nombre ?? token.cliente_email,
          nombreProyecto: budget.projects?.nombre ?? 'Sin nombre',
          nombrePresupuesto: budget.titulo ?? 'Presupuesto',
          linkPortal: `${appUrl}/presupuesto-publico/${token.token}`,
          nombreConstructor: perfil?.nombre_completo ?? 'Constructor',
          emailConstructor: emailConstructor,
          telefonoConstructor: perfil?.telefono ?? undefined,
        });

        enviados++;
      } catch (err) {
        console.error(`[recordatorio-sin-respuesta] Error procesando token ${token.token}:`, err);
      }
    }

    return NextResponse.json({ enviados });
  } catch (err) {
    console.error('[recordatorio-sin-respuesta] Error general:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
