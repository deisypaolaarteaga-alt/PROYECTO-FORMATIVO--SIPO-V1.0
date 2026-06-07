import { NextRequest, NextResponse } from 'next/server';
import Decimal from 'decimal.js';
import { createAdminClient } from '@/lib/supabase/server';
import { enviarEmailResumenSemanal } from '@/lib/email/brevo';
import { verificarSecretoN8N } from '../_auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const error401 = verificarSecretoN8N(request);
  if (error401) return error401;

  try {
    const supabase = createAdminClient();

    // Calcular semana anterior (lunes-domingo) en timezone Bogotá
    const ahoraBogota = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
    const diaSemana = ahoraBogota.getDay(); // 0=dom, 1=lun, ...
    // Lunes de la semana pasada
    const diasHastaLunesPasado = diaSemana === 0 ? 6 : diaSemana - 1;
    const lunesPasado = new Date(ahoraBogota);
    lunesPasado.setDate(ahoraBogota.getDate() - diasHastaLunesPasado - 7);
    lunesPasado.setHours(0, 0, 0, 0);
    // Domingo de la semana pasada
    const domingoPasado = new Date(lunesPasado);
    domingoPasado.setDate(lunesPasado.getDate() + 6);
    domingoPasado.setHours(23, 59, 59, 999);

    const desde = lunesPasado.toISOString();
    const hasta = domingoPasado.toISOString();

    const fechaSemana = `${lunesPasado.toLocaleDateString('es-CO', {
      timeZone: 'America/Bogota',
      day: 'numeric',
      month: 'long',
    })} al ${domingoPasado.toLocaleDateString('es-CO', {
      timeZone: 'America/Bogota',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}`;

    // Fecha límite para "vence próximos 7 días"
    const en7Dias = new Date(ahoraBogota);
    en7Dias.setDate(ahoraBogota.getDate() + 7);
    const fechaEn7Dias = en7Dias.toISOString().split('T')[0];
    const hoyFecha = ahoraBogota.toISOString().split('T')[0];

    // Obtener todos los usuarios activos (con al menos 1 proyecto)
    const { data: usuariosActivos, error: errUsuarios } = await supabase
      .from('profiles')
      .select('id, nombre_completo, email_empresa')
      .not('id', 'is', null);

    if (errUsuarios || !usuariosActivos) {
      console.error('[resumen-semanal] Error obteniendo perfiles:', errUsuarios);
      return NextResponse.json({ error: 'Error interno al obtener perfiles' }, { status: 500 });
    }

    let enviados = 0;

    for (const perfil of usuariosActivos) {
      try {
        // Verificar que tenga al menos 1 proyecto activo
        const { count: countProyectos } = await supabase
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', perfil.id)
          .is('deleted_at', null);

        if (!countProyectos || countProyectos === 0) continue;

        // Presupuestos de la semana anterior
        const { data: budgetsSemana } = await supabase
          .from('budgets')
          .select('id, estado, total_oferta, utilidad_pct, created_at')
          .eq('user_id', perfil.id)
          .gte('created_at', desde)
          .lte('created_at', hasta)
          .is('deleted_at', null);

        // Si no tiene ningún presupuesto activo, saltar
        const { count: countActivos } = await supabase
          .from('budgets')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', perfil.id)
          .in('estado', ['enviado_a_cliente', 'visto_por_cliente', 'aprobado_por_cliente', 'en_revision'])
          .is('deleted_at', null);

        if (!countActivos || countActivos === 0) continue;

        const enviados_semana = budgetsSemana?.filter(b =>
          ['enviado_a_cliente', 'visto_por_cliente', 'aprobado_por_cliente', 'rechazado_por_cliente'].includes(b.estado)
        ).length ?? 0;

        const aprobados_semana = budgetsSemana?.filter(b => b.estado === 'aprobado_por_cliente').length ?? 0;
        const rechazados_semana = budgetsSemana?.filter(b => b.estado === 'rechazado_por_cliente').length ?? 0;

        // Utilidad generada de aprobados: total_oferta × utilidad_pct / (100 + administracion + imprevistos + utilidad)
        // Simplificado: usamos v_resumen_presupuesto para los aprobados
        const idsAprobados = budgetsSemana
          ?.filter(b => b.estado === 'aprobado_por_cliente')
          .map(b => b.id) ?? [];

        let utilidadGenerada = new Decimal(0);
        if (idsAprobados.length > 0) {
          const { data: resumenes } = await supabase
            .from('v_resumen_presupuesto')
            .select('utilidad, budget_id')
            .in('budget_id', idsAprobados);

          resumenes?.forEach(r => {
            utilidadGenerada = utilidadGenerada.plus(new Decimal(r.utilidad ?? 0));
          });
        }

        // Cartera potencial: sum total_oferta de enviados/visto
        const { data: carteraData } = await supabase
          .from('v_resumen_presupuesto')
          .select('total_oferta, budget_id')
          .eq('user_id', perfil.id)
          .in('estado', ['enviado_a_cliente', 'visto_por_cliente']);

        const carteraPotencial = (carteraData ?? []).reduce(
          (acc, r) => acc.plus(new Decimal(r.total_oferta ?? 0)),
          new Decimal(0)
        );

        // Presupuestos que vencen en 7 días
        const { count: porVencer } = await supabase
          .from('budgets')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', perfil.id)
          .in('estado', ['enviado_a_cliente', 'visto_por_cliente'])
          .gte('vigencia_hasta', hoyFecha)
          .lte('vigencia_hasta', fechaEn7Dias)
          .is('deleted_at', null);

        // Email del constructor
        const { data: authUser } = await supabase.auth.admin.getUserById(perfil.id);
        const emailConstructor = perfil.email_empresa ?? authUser?.user?.email ?? '';
        if (!emailConstructor) continue;

        await enviarEmailResumenSemanal({
          destinatario: emailConstructor,
          nombreConstructor: perfil.nombre_completo ?? 'Constructor',
          fechaSemana,
          presupuestosEnviados: enviados_semana,
          presupuestosAprobados: aprobados_semana,
          presupuestosRechazados: rechazados_semana,
          utilidadGenerada: utilidadGenerada.toNumber(),
          carteraPotencial: carteraPotencial.toNumber(),
          presupuestosPorVencer: porVencer ?? 0,
        });

        enviados++;
      } catch (err) {
        console.error(`[resumen-semanal] Error procesando perfil ${perfil.id}:`, err);
      }
    }

    return NextResponse.json({ enviados });
  } catch (err) {
    console.error('[resumen-semanal] Error general:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
