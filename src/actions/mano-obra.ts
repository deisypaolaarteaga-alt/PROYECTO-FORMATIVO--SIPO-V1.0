'use server';

import { createClient } from '@/lib/supabase/server';

export interface TrabajadorReferencia {
  id: string;
  especialidad: string;
  categoria: string;
  jornal_base: number;
  factor_prestacional: number;
  jornal_con_prestaciones: number;
}

export async function getTrabajadoresReferencia(): Promise<TrabajadorReferencia[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('trabajadores')
    .select('id, especialidad, categoria, jornal_base, factor_prestacional, jornal_con_prestaciones')
    .eq('activo', true)
    .order('categoria', { ascending: true })
    .order('especialidad', { ascending: true });

  if (error || !data) return [];
  return data.map((t) => ({
    id: t.id,
    especialidad: t.especialidad,
    categoria: t.categoria,
    jornal_base: Number(t.jornal_base),
    factor_prestacional: Number(t.factor_prestacional),
    jornal_con_prestaciones: Number(t.jornal_con_prestaciones),
  }));
}
