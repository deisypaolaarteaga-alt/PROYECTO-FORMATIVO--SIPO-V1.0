'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { generarTexto } from '@/lib/ia/groq';
import Decimal from 'decimal.js';
import type { ActionResult } from '@/types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatCOP(v: number): string {
  return `$${new Decimal(v).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} COP`;
}

function calcularTotales(budget: {
  costo_directo: number;
  administracion_pct: number;
  imprevistos_pct: number;
  utilidad_pct: number;
  metodo_iva: string;
  iva_porcentaje: number;
}): { totalOferta: number; aiuPct: number } {
  const cd        = new Decimal(budget.costo_directo ?? 0);
  const admin     = cd.mul(new Decimal(budget.administracion_pct ?? 10).div(100));
  const imprev    = cd.mul(new Decimal(budget.imprevistos_pct   ??  5).div(100));
  const utilidad  = cd.mul(new Decimal(budget.utilidad_pct      ?? 10).div(100));
  const sub       = cd.plus(admin).plus(imprev).plus(utilidad);
  const ivaPct    = new Decimal(budget.iva_porcentaje ?? 0).div(100);
  let iva         = new Decimal(0);
  switch (budget.metodo_iva) {
    case 'sobre_utilidad': iva = utilidad.mul(ivaPct); break;
    case 'sobre_aiu':      iva = admin.plus(imprev).plus(utilidad).mul(ivaPct); break;
    case 'sobre_total':    iva = sub.mul(ivaPct); break;
  }
  const aiuPct = (budget.administracion_pct ?? 10)
               + (budget.imprevistos_pct   ??  5)
               + (budget.utilidad_pct      ?? 10);
  return { totalOferta: sub.plus(iva).toNumber(), aiuPct };
}

const TIPO_OBRA_LABELS: Record<string, string> = {
  residencial:    'Residencial',
  comercial:      'Comercial',
  infraestructura:'Infraestructura',
  hotelero:       'Hotelero',
  industrial:     'Industrial',
  institucional:  'Institucional',
  otro:           'Obra',
};

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface CartaPresentacionResult {
  cuerpoCorreo: string;
  cartaEjecutiva: string;
}

// ── Action ────────────────────────────────────────────────────────────────────

export async function generarCartaPresentacion(
  budgetId: string
): Promise<ActionResult<CartaPresentacionResult>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Sesión no válida.' };

    const admin = createAdminClient();

    const { data: budget } = await admin
      .from('budgets')
      .select(`
        id, titulo, costo_directo,
        administracion_pct, imprevistos_pct, utilidad_pct,
        metodo_iva, iva_porcentaje,
        duracion_meses, vigencia_dias,
        projects:project_id (
          nombre, tipo_obra, ubicacion,
          clientes:cliente_id (nombre_razon_social)
        ),
        chapters (
          id, nombre, numero, valor_subtotal, deleted_at,
          activities (nombre, deleted_at)
        )
      `)
      .eq('id', budgetId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (!budget) return { success: false, error: 'Presupuesto no encontrado.' };

    const { data: profileRaw } = await admin
      .from('profiles')
      .select('nombre_completo, empresa')
      .eq('id', user.id)
      .maybeSingle();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const proyecto    = budget.projects as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cliente     = proyecto?.clientes as { nombre_razon_social: string } | null;
    const profile     = profileRaw as { nombre_completo: string | null; empresa: string | null } | null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chapters = ((budget.chapters ?? []) as any[])
      .filter((c: any) => !c.deleted_at)
      .sort((a: any, b: any) => (a.numero ?? 0) - (b.numero ?? 0));
    const { totalOferta, aiuPct } = calcularTotales(budget as Parameters<typeof calcularTotales>[0]);

    const capitulosList = chapters
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((c: any) => {
        const nombre = (c.nombre as string).replace(/^\d{1,3}[\.\-\s]+/, '');
        const actividades = ((c.activities ?? []) as any[])
          .filter((a: any) => !a.deleted_at)
          .slice(0, 4)
          .map((a: any) => (a.nombre as string).replace(/^\d{1,3}[\.\-\s]+/, ''))
          .join(', ');
        const actLine = actividades ? ` (incluye: ${actividades})` : '';
        return `- ${nombre}: ${formatCOP(Number(c.valor_subtotal) || 0)}${actLine}`;
      })
      .join('\n');

    const tipoObraLabel = TIPO_OBRA_LABELS[proyecto?.tipo_obra ?? ''] ?? (proyecto?.tipo_obra ?? 'Obra');
    const ubicacion = proyecto?.ubicacion ? `\n- Ubicación: ${proyecto.ubicacion}` : '';

    const fechaHoy = new Date().toLocaleDateString('es-CO', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const prompt = `Eres un asistente experto en construcción colombiana.
Genera dos textos profesionales en español colombiano formal.
Responde SOLO con un JSON válido con esta estructura exacta, sin markdown ni texto adicional:
{"cuerpoCorreo":"...","cartaEjecutiva":"..."}

DATOS DEL PROYECTO:
- Fecha: ${fechaHoy}
- Proyecto: ${proyecto?.nombre ?? budget.titulo}
- Tipo de obra: ${tipoObraLabel}${ubicacion}
- Cliente: ${cliente?.nombre_razon_social ?? 'estimado cliente'}
- Constructor: ${profile?.nombre_completo ?? 'el constructor'}, ${profile?.empresa ?? 'empresa constructora'}
- Total oferta: ${formatCOP(totalOferta)}
- Costo directo: ${formatCOP(Number(budget.costo_directo) || 0)}
- AIU: ${aiuPct}%
- Duración estimada: ${budget.duracion_meses ? `${budget.duracion_meses} meses` : 'a definir'}
- Vigencia de la oferta: ${budget.vigencia_dias ?? 30} días

CAPÍTULOS DEL PRESUPUESTO (nombre: valor — actividades principales):
${capitulosList || '- Sin capítulos registrados'}

TEXTO 1 — cuerpoCorreo (máximo 120 palabras, 3 párrafos cortos):
- Saludo personalizado al cliente por su nombre
- Describe la propuesta de forma simple y acogedora, mencionando el tipo de obra y la ubicación
- Llamado a la acción: invitar a revisar el portal y aprobar

TEXTO 2 — cartaEjecutiva (máximo 380 palabras):
- Primera línea: "Bogotá, ${fechaHoy}" (o la ciudad si está en la ubicación)
- Saludo formal al cliente
- Párrafo de introducción: qué es el proyecto, para qué sirve la obra, por qué beneficia al cliente
- Para CADA capítulo: una línea en lenguaje cotidiano explicando QUÉ trabajo se hace y POR QUÉ importa para el cliente (sin jerga técnica). Formato: "• [Nombre capítulo]: [explicación simple]."
- Resumen financiero: costo directo, AIU (${aiuPct}%), total oferta ${formatCOP(totalOferta)}, vigencia
- Cierre profesional con nombre y empresa del constructor

Usa \\n para saltos de línea dentro de las cadenas JSON.`;

    const respuesta = await generarTexto(prompt);
    if (!respuesta) {
      return { success: false, error: 'El servicio de IA no respondió. Intenta de nuevo.' };
    }

    // Limpiar bloque markdown si Groq lo añade
    const jsonStr = respuesta
      .replace(/^```(?:json)?\s*/m, '')
      .replace(/\s*```$/m, '')
      .trim();

    let parsed: CartaPresentacionResult;
    try {
      parsed = JSON.parse(jsonStr) as CartaPresentacionResult;
    } catch {
      return { success: false, error: 'La IA devolvió un formato inesperado. Intenta de nuevo.' };
    }

    if (!parsed.cuerpoCorreo || !parsed.cartaEjecutiva) {
      return { success: false, error: 'La respuesta de la IA está incompleta. Intenta de nuevo.' };
    }

    return { success: true, data: { cuerpoCorreo: parsed.cuerpoCorreo, cartaEjecutiva: parsed.cartaEjecutiva } };
  } catch (err) {
    console.error('[generarCartaPresentacion]', err);
    return { success: false, error: 'Error al generar la carta. Intenta de nuevo.' };
  }
}
