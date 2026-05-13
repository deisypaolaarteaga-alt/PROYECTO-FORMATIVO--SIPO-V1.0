import { createClient } from '@/lib/supabase/server';

/**
 * Tipo TypeScript para los parámetros fiscales
 */
export interface ParametrosFiscales {
  id?: string;
  año: number;
  smmlv: number;
  aux_transporte: number;
  factor_prestacional_riesgo_i: number;
  factor_prestacional_riesgo_ii: number;
  factor_prestacional_riesgo_iii: number;
  factor_prestacional_riesgo_iv: number;
  factor_prestacional_riesgo_v: number;
  divisor_apu: number;
  tpnl_porcentaje: number;
  herramienta_menor_porcentaje: number;
  epp_porcentaje: number;
  iva_porcentaje: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Valores de respaldo (Fallback) por si falla la base de datos
 * Basados en Colombia 2025
 */
const FALLBACK_PARAMETROS: ParametrosFiscales = {
  año: 2025,
  smmlv: 1423500,
  aux_transporte: 200000,
  factor_prestacional_riesgo_i: 1.522,
  factor_prestacional_riesgo_ii: 1.534,
  factor_prestacional_riesgo_iii: 1.564,
  factor_prestacional_riesgo_iv: 1.5988,
  factor_prestacional_riesgo_v: 1.646,
  divisor_apu: 182,
  tpnl_porcentaje: 22.5,
  herramienta_menor_porcentaje: 3.0,
  epp_porcentaje: 1.0,
  iva_porcentaje: 19.0
};

/**
 * Obtiene los parámetros fiscales vigentes (año actual).
 * IMPORTANTE: No usa unstable_cache porque createClient() llama cookies()
 * internamente, lo cual es incompatible con el scope de caché de Next.js.
 * Los parámetros fiscales son globales — no requieren sesión de usuario.
 */
export async function getParametrosFiscalesVigentes(): Promise<ParametrosFiscales> {
  const añoActual = new Date().getFullYear();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('parametros_fiscales')
      .select('*')
      .eq('año', añoActual)
      .maybeSingle();

    if (error) throw error;
    
    // Si no existe el año actual, intentar con el más reciente
    if (!data) {
      const { data: recents, error: errRecent } = await supabase
        .from('parametros_fiscales')
        .select('*')
        .order('año', { ascending: false })
        .limit(1);
      
      if (errRecent) throw errRecent;
      if (recents && recents.length > 0) return recents[0];
    }

    return data || FALLBACK_PARAMETROS;
  } catch (err) {
    console.warn('⚠️ SIPO: Falló la obtención de parámetros fiscales desde la BD. Usando fallback hardcoded.', err);
    return FALLBACK_PARAMETROS;
  }
}

/**
 * Obtiene los parámetros fiscales para un año específico
 */
export async function getParametrosFiscalesPorAnio(anio: number): Promise<ParametrosFiscales> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('parametros_fiscales')
      .select('*')
      .eq('año', anio)
      .maybeSingle();

    if (error) throw error;
    if (!data) return FALLBACK_PARAMETROS;

    return data;
  } catch (err) {
    console.warn(`⚠️ SIPO: Error al consultar parámetros para el año ${anio}.`, err);
    return FALLBACK_PARAMETROS;
  }
}
