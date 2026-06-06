'use server';

import { createClient } from '@/lib/supabase/server';
import { generarTexto } from '@/lib/ia/groq';
import { formatearCOP } from '@/lib/utils/formato-cop';

export type MensajeChat = { rol: 'usuario' | 'ia'; texto: string };

const CATEGORIA_LABELS: Record<string, string> = {
  ferreteria:  'Ferretería / Materiales',
  contratista: 'Contratista especializado',
  equipos:     'Arriendo de equipos y maquinaria',
  laboratorio: 'Laboratorio',
  transporte:  'Transporte y volquetas',
  servicios:   'Servicios técnicos varios',
  otro:        'Otro',
};

export async function consultarIA(
  budgetId: string,
  mensaje: string,
  historial: MensajeChat[]
): Promise<{ respuesta: string } | { error: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Sesión no válida.' };

    const [{ data: budget, error: budgetErr }, { data: proveedores }] = await Promise.all([
      supabase
        .from('budgets')
        .select(`
          titulo,
          costo_directo,
          administracion_pct,
          imprevistos_pct,
          utilidad_pct,
          metodo_iva,
          iva_porcentaje,
          duracion_meses,
          ciudad_ica,
          chapters (
            nombre,
            numero,
            activities (
              nombre,
              unidad,
              cantidad,
              precio_unitario
            )
          )
        `)
        .eq('id', budgetId)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .single(),
      supabase
        .from('proveedores')
        .select('nombre_razon_social, categoria, telefono, email')
        .eq('user_id', user.id)
        .eq('activo', true)
        .is('deleted_at', null)
        .order('nombre_razon_social'),
    ]);

    if (budgetErr || !budget) return { error: 'Presupuesto no encontrado.' };

    // Calcular totales para el contexto
    const cd = Number(budget.costo_directo ?? 0);
    const adminPct = Number((budget as any).administracion_pct ?? 10);
    const imprPct  = Number((budget as any).imprevistos_pct ?? 5);
    const utilPct  = Number((budget as any).utilidad_pct ?? 10);
    const aiuTotal = (adminPct + imprPct + utilPct) / 100;
    const subConAIU = cd * (1 + aiuTotal);
    const ivaPct = Number((budget as any).iva_porcentaje ?? 0) / 100;
    const utilidad = cd * (utilPct / 100);
    let iva = 0;
    switch ((budget as any).metodo_iva) {
      case 'sobre_utilidad': iva = utilidad * ivaPct; break;
      case 'sobre_aiu':      iva = cd * aiuTotal * ivaPct; break;
      case 'sobre_total':    iva = subConAIU * ivaPct; break;
    }
    const totalOferta = subConAIU + iva;

    // Construir lista de capítulos y actividades
    const chapters = ((budget as any).chapters as any[] ?? [])
      .sort((a: any, b: any) => (a.numero ?? 0) - (b.numero ?? 0));

    const listaActividades = chapters.length === 0
      ? '  (Sin actividades registradas)'
      : chapters.map((cap: any) => {
          const acts = (cap.activities as any[] ?? []);
          const capTotal = acts.reduce((s: number, a: any) =>
            s + (Number(a.cantidad) * Number(a.precio_unitario) || 0), 0);
          const lineasActs = acts.map((a: any) => {
            const sub = (Number(a.cantidad) * Number(a.precio_unitario)) || 0;
            return `    - ${a.nombre} (${a.cantidad} ${a.unidad} × ${formatearCOP(Number(a.precio_unitario))} = ${formatearCOP(sub)})`;
          }).join('\n');
          return `  ${cap.numero ?? '?'}. ${cap.nombre} — ${formatearCOP(capTotal)}\n${lineasActs}`;
        }).join('\n\n');

    const listaProveedores = !(proveedores ?? []).length
      ? '  (Sin proveedores registrados)'
      : (proveedores ?? []).map((p: any) =>
          `  - ${p.nombre_razon_social} [${CATEGORIA_LABELS[p.categoria] ?? p.categoria}]${p.telefono ? ` · Tel: ${p.telefono}` : ''}${p.email ? ` · ${p.email}` : ''}`
        ).join('\n');

    const duracion = (budget as any).duracion_meses
      ? `${(budget as any).duracion_meses} meses`
      : null;

    // Incluir historial de la conversación en el prompt
    const historialTexto = historial.length > 0
      ? '\n\nCONVERSACIÓN ANTERIOR:\n' + historial
          .map(m => `${m.rol === 'usuario' ? 'Constructor' : 'Asistente'}: ${m.texto}`)
          .join('\n')
      : '';

    const prompt = `Eres un asistente experto en construcción colombiana integrado en SIPO.
Respondes preguntas sobre el siguiente presupuesto de obra en español colombiano.
Solo usas los datos que te proporciono — nunca inventas precios ni datos externos.
Sé conciso y práctico. Si te preguntan algo que no está en los datos, dilo claramente.

PRESUPUESTO: ${(budget as any).titulo}
Ciudad de la obra: ${(budget as any).ciudad_ica ?? 'No especificada'}
${duracion ? `Duración estimada de la obra: ${duracion}` : 'Duración estimada de la obra: No configurada (pide al constructor que la configure en la sección AIU del presupuesto)'}
Costo directo: ${formatearCOP(cd)}
AIU (${adminPct}% adm + ${imprPct}% impr + ${utilPct}% util): ${formatearCOP(subConAIU - cd)}
Total oferta: ${formatearCOP(totalOferta)}

CAPÍTULOS Y ACTIVIDADES:
${listaActividades}

PROVEEDORES REGISTRADOS DEL CONSTRUCTOR:
${listaProveedores}

Cuando te pregunten por flujo de caja, distribuye el costo directo proporcionalmente entre los meses de duración. Si la duración no está configurada, indícale al constructor que debe configurarla en los parámetros del presupuesto (campo "Duración estimada de la obra") y no asumas ningún valor.
Cuando te pregunten por proveedores, cruza los insumos del presupuesto con las categorías de los proveedores registrados.
Cuando te pregunten por el orden lógico de actividades, sugiere una secuencia constructiva basada en la lista de capítulos.${historialTexto}

Pregunta del constructor: ${mensaje}`;

    console.log('Prompt length:', prompt.length);
    const respuesta = await generarTexto(prompt);
    console.log('Groq respuesta:', respuesta);
    if (!respuesta) return { error: 'No se obtuvo respuesta de la IA. Intenta nuevamente.' };

    return { respuesta };
  } catch {
    return { error: 'Error al consultar la IA. Intenta nuevamente.' };
  }
}
