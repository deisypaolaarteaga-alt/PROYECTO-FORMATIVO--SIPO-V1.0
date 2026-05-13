'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { ActionResult } from '@/types';

/**
 * Esquema de validación para la configuración fiscal
 */
const configFiscalSchema = z.object({
  nit: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{1}$/, {
    message: 'Formato de NIT inválido (ej: 000.000.000-0)'
  }).optional().or(z.literal('')),
  razon_social: z.string().min(3, 'La razón social debe tener al menos 3 caracteres').optional().or(z.literal('')),
  regimen_tributario: z.enum(['responsable_iva', 'no_responsable']),
  municipio: z.string().min(1, 'El municipio es obligatorio'),
  nivel_riesgo_arl: z.number().int().min(1).max(5),
  aiu_admin_default: z.number().min(0).max(100),
  aiu_imprev_default: z.number().min(0).max(100),
  aiu_utilidad_default: z.number().min(0).max(100),
  fecha_validez_presupuesto_dias: z.number().int().min(1).max(365),
}).refine((data) => {
  const totalAIU = data.aiu_admin_default + data.aiu_imprev_default + data.aiu_utilidad_default;
  return totalAIU <= 40;
}, {
  message: 'El AIU total (Administración + Imprevistos + Utilidad) no debe superar el 40%',
  path: ['aiu_admin_default'], // Mostrar error en el primer campo de AIU
});

export type ConfigFiscal = z.infer<typeof configFiscalSchema>;

/**
 * Obtiene la configuración fiscal del usuario actual
 */
export async function getConfigFiscalUsuario() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('No autorizado');

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        nit,
        razon_social,
        regimen_tributario,
        municipio,
        nivel_riesgo_arl,
        aiu_admin_default,
        aiu_imprev_default,
        aiu_utilidad_default,
        fecha_validez_presupuesto_dias
      `)
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching config fiscal:', error);
    return null;
  }
}

/**
 * Actualiza la configuración fiscal del usuario
 */
export async function updateConfigFiscalUsuario(data: ConfigFiscal): Promise<ActionResult> {
  try {
    const validated = configFiscalSchema.parse(data);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { success: false, error: 'No autorizado' };

    const { error } = await supabase
      .from('profiles')
      .update(validated)
      .eq('id', user.id);

    if (error) throw error;

    revalidatePath('/configuracion/fiscal');
    return { success: true };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error('Error updating config fiscal:', error);
    return { success: false, error: 'No se pudo guardar la configuración.' };
  }
}

/**
 * Obtiene la lista de municipios disponibles
 */
export async function getMunicipiosDisponibles() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('municipios')
    .select('*')
    .order('nombre');
  return data || [];
}
