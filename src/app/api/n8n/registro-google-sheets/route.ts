import { NextRequest, NextResponse } from 'next/server';
import Decimal from 'decimal.js';
import { createAdminClient } from '@/lib/supabase/server';
import { verificarSecretoN8N } from '../_auth';

interface BodyRegistroSheets {
  budget_id?: string;
  user_id?: string;
}

export async function POST(request: NextRequest) {
  const error401 = verificarSecretoN8N(request);
  if (error401) return error401;

  try {
    const body: BodyRegistroSheets = await request.json();
    const { budget_id, user_id } = body;

    if (!budget_id || !user_id) {
      return NextResponse.json({ error: 'budget_id y user_id son requeridos' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Obtener datos completos del presupuesto
    const { data: budget, error: errBudget } = await supabase
      .from('budgets')
      .select(`
        id,
        nombre,
        user_id,
        costo_directo,
        projects!inner (
          nombre,
          tipo_obra,
          clientes ( nombre_razon_social )
        )
      `)
      .eq('id', budget_id)
      .eq('user_id', user_id)
      .is('deleted_at', null)
      .single();

    if (errBudget || !budget) {
      console.error('[registro-google-sheets] Budget no encontrado:', budget_id, errBudget);
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 });
    }

    // Obtener totales desde la vista de resumen
    const { data: resumen, error: errResumen } = await supabase
      .from('v_resumen_presupuesto')
      .select('total_oferta, utilidad, costo_directo')
      .eq('budget_id', budget_id)
      .single();

    if (errResumen || !resumen) {
      console.error('[registro-google-sheets] Resumen no encontrado:', budget_id, errResumen);
      return NextResponse.json({ error: 'No se encontraron datos financieros del presupuesto' }, { status: 404 });
    }

    // Obtener nombre del constructor
    const { data: perfil } = await supabase
      .from('profiles')
      .select('nombre_completo')
      .eq('id', user_id)
      .single();

    const proyecto = budget.projects as unknown as {
      nombre: string;
      tipo_obra: string | null;
      clientes: { nombre_razon_social: string } | null;
    };

    const totalOferta   = new Decimal(resumen.total_oferta ?? 0);
    const costoDirecto  = new Decimal(resumen.costo_directo ?? 0);
    const utilidad      = new Decimal(resumen.utilidad ?? 0);
    const margenPct     = totalOferta.isZero()
      ? new Decimal(0)
      : utilidad.div(totalOferta).mul(100).toDecimalPlaces(2);

    // Fecha actual en Colombia DD/MM/YYYY
    const fechaHoy = new Date().toLocaleDateString('es-CO', {
      timeZone: 'America/Bogota',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    return NextResponse.json({
      fecha:          fechaHoy,
      proyecto:       proyecto.nombre,
      cliente:        proyecto.clientes?.nombre_razon_social ?? 'Sin cliente',
      tipo_obra:      proyecto.tipo_obra ?? 'Sin especificar',
      costo_directo:  costoDirecto.toNumber(),
      total_oferta:   totalOferta.toNumber(),
      utilidad:       utilidad.toNumber(),
      margen_pct:     margenPct.toNumber(),
      constructor:    perfil?.nombre_completo ?? 'Sin nombre',
    });
  } catch (err) {
    console.error('[registro-google-sheets] Error general:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
