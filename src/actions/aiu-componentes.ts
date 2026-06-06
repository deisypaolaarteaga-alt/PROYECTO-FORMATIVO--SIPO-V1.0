'use server';

import { createClient } from '@/lib/supabase/server';
import Decimal from 'decimal.js';
import { aiuComponenteSchema } from '@/lib/validations/schemas';
import type { AIUComponente } from '@/types';

export async function getAIUComponentes(budgetId: string): Promise<AIUComponente[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('aiu_componentes')
    .select('*')
    .eq('budget_id', budgetId)
    .eq('user_id', user.id)
    .order('orden')
    .order('created_at');

  return (data ?? []) as AIUComponente[];
}

export async function upsertAIUComponente(data: {
  id?: string;
  budget_id: string;
  nombre: string;
  valor_mensual: number;
  orden?: number;
}): Promise<{ success: boolean; data?: AIUComponente; error?: string }> {
  try {
    const validated = aiuComponenteSchema.parse({
      nombre: data.nombre,
      valor_mensual: data.valor_mensual,
    });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    if (data.id) {
      const { data: updated, error } = await supabase
        .from('aiu_componentes')
        .update({ nombre: validated.nombre, valor_mensual: validated.valor_mensual })
        .eq('id', data.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data: updated as AIUComponente };
    }

    const { data: inserted, error } = await supabase
      .from('aiu_componentes')
      .insert({
        budget_id: data.budget_id,
        user_id:   user.id,
        nombre:    validated.nombre,
        valor_mensual: validated.valor_mensual,
        orden:     data.orden ?? 0,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: inserted as AIUComponente };

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return { success: false, error: msg };
  }
}

export async function eliminarAIUComponente(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const { error } = await supabase
      .from('aiu_componentes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return { success: false, error: error.message };
    return { success: true };

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return { success: false, error: msg };
  }
}

export async function calcularAdminPct(
  budgetId: string,
  duracionMeses: number
): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const [{ data: componentes }, { data: budget }] = await Promise.all([
    supabase
      .from('aiu_componentes')
      .select('valor_mensual')
      .eq('budget_id', budgetId)
      .eq('user_id', user.id),
    supabase
      .from('budgets')
      .select('costo_directo')
      .eq('id', budgetId)
      .eq('user_id', user.id)
      .single(),
  ]);

  if (!budget || !componentes) return 0;

  const costoDirecto = new Decimal(budget.costo_directo ?? 0);
  if (costoDirecto.isZero()) return 0;

  const suma = componentes.reduce(
    (acc, c) => acc.add(new Decimal(c.valor_mensual ?? 0)),
    new Decimal(0)
  );

  return suma
    .mul(new Decimal(duracionMeses))
    .div(costoDirecto)
    .mul(100)
    .toDecimalPlaces(2)
    .toNumber();
}
