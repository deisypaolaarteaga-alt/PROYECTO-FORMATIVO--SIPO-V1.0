'use server';

import { createClient } from '@/lib/supabase/server';
import { obtenerPresupuesto } from '@/actions/presupuestos';
import { getAIUComponentes } from '@/actions/aiu-componentes';
import { renderToBuffer } from '@react-pdf/renderer';
import { PresupuestoPDF } from '@/components/pdf/PresupuestoPDF';
import { PresupuestoCompletoConAPU } from '@/components/pdf/PresupuestoCompletoConAPU';
import type { PDFExportOptions, ParametrosFiscales } from '@/types/pdf';
import React from 'react';

export async function generarPresupuestoPDF(
  budgetId: string,
  options?: PDFExportOptions
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    // 1. Obtener datos del presupuesto
    const presupuestoResult = await obtenerPresupuesto(budgetId);
    if (!presupuestoResult || !('data' in presupuestoResult) || !presupuestoResult.data) {
      return { success: false, error: 'Presupuesto no encontrado' };
    }
    const budget = presupuestoResult.data;

    // 2. Validar que el presupuesto tiene contenido mínimo para exportar
    const tieneCapitulos = Array.isArray(budget.chapters) && budget.chapters.length > 0;
    if (!tieneCapitulos) {
      return { success: false, error: 'El presupuesto no tiene capítulos. Agrega actividades antes de exportar.' };
    }

    // 3. Obtener perfil
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return { success: false, error: 'Perfil de usuario no encontrado' };
    }

    // 3b. Normalizar: Supabase devuelve apus[] (plural); los componentes esperan apu + apu_items flat
    if (budget.chapters) {
      budget.chapters = (budget.chapters as any[]).map((ch: any) => ({
        ...ch,
        activities: (ch.activities || []).map((act: any) => {
          const apuRecord = Array.isArray(act.apus) ? act.apus[0] : (act.apus ?? null);
          return {
            ...act,
            apu: apuRecord ?? act.apu ?? null,
            apu_items: apuRecord?.apu_items ?? act.apu_items ?? [],
          };
        }),
      }));
    }

    // 4b. Obtener componentes AIU si el método es detallado
    const aiuComponentes = (budget as any).metodo_aiu === 'detallado'
      ? await getAIUComponentes(budgetId)
      : [];

    // 4. Obtener Parámetros Fiscales Actuales
    const { data: paramFiscales } = await supabase
      .from('parametros_fiscales')
      .select('*')
      .order('año', { ascending: false })
      .limit(1)
      .single();

    const finalOptions = {
      ...options,
      parametrosFiscales: paramFiscales as ParametrosFiscales | undefined
    };

    // 5. Registrar en audit_log
    await supabase.from('audit_log').insert({
      tabla: 'budgets',
      operacion: 'EXPORT_PDF',
      registro_id: budgetId,
      user_id: user.id,
      datos_anteriores: null,
      datos_nuevos: { options: finalOptions }
    });

    // 6. Seleccionar Componente a Renderizar
    const Component = finalOptions.incluirAPUs ? PresupuestoCompletoConAPU : PresupuestoPDF;

    const element = React.createElement(Component, {
      budget:         budget as any,
      profile:        profile as any,
      options:        finalOptions,
      aiuComponentes: aiuComponentes.length > 0 ? aiuComponentes : undefined,
      duracionMeses:  Number((budget as any).duracion_meses) || undefined,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(element as any);
    
    // Retornamos como Base64 para atravesar la barrera del Server Action
    const base64Pdf = buffer.toString('base64');
    
    return { success: true, data: base64Pdf };
  } catch (error: any) {
    console.error('Error al generar PDF:', error);
    return { success: false, error: error.message || 'Error interno al generar el PDF' };
  }
}
