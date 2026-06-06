import { createAdminClient } from '@/lib/supabase/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { PresupuestoPDF } from '@/components/pdf/PresupuestoPDF';
import React from 'react';

/**
 * Genera el buffer PDF de un presupuesto server-side sin depender de la sesión
 * del usuario. Usa createAdminClient() para saltarse RLS de forma segura.
 * Replica la lógica de obtenerPresupuesto (2 queries separadas para evitar
 * ambigüedad de FK en PostgREST budgets→chapters→activities→apus).
 */
export async function generatePresupuestoPDFBuffer(
  budgetId: string,
  userId: string
): Promise<Buffer | null> {
  try {
    const admin = createAdminClient();

    // Query principal: presupuesto con capítulos y actividades (sin APUs anidados)
    const { data: budgetData } = await admin
      .from('budgets')
      .select(`
        *,
        projects(
          nombre,
          ubicacion,
          area_m2,
          cliente_id,
          cliente_nombre,
          tipo_obra,
          clientes(*)
        ),
        chapters(
          *,
          activities(*)
        )
      `)
      .eq('id', budgetId)
      .is('deleted_at', null)
      .single();

    if (!budgetData) return null;

    // Query separada para APUs con ítems (evita ambigüedad de FK en PostgREST)
    const { data: apusData } = await admin
      .from('apus')
      .select('*, apu_items(*)')
      .eq('budget_id', budgetId)
      .is('deleted_at', null);

    // Indexar APUs por activity_id para merge O(1)
    const apusByActivityId: Record<string, any> = {};
    for (const apu of apusData ?? []) {
      apusByActivityId[apu.activity_id] = apu;
    }

    // Filtrar soft-deleted, ordenar y adjuntar APU a cada actividad
    if (budgetData.chapters) {
      (budgetData as any).chapters = (budgetData.chapters as any[])
        .filter((ch: any) => !ch.deleted_at)
        .sort((a: any, b: any) => (a.numero ?? 0) - (b.numero ?? 0))
        .map((ch: any) => ({
          ...ch,
          activities: (ch.activities || [])
            .filter((act: any) => !act.deleted_at)
            .map((act: any) => ({
              ...act,
              apu:       apusByActivityId[act.id] ?? null,
              apu_items: apusByActivityId[act.id]?.apu_items ?? [],
              apus:      apusByActivityId[act.id] ? [apusByActivityId[act.id]] : [],
            })),
        }));
    }

    // Obtener perfil del constructor
    const { data: profile } = await admin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!profile) return null;

    const element = React.createElement(PresupuestoPDF, {
      budget:  budgetData as any,
      profile: profile as any,
    });

    return await renderToBuffer(element as any);
  } catch (error) {
    console.error('[generatePresupuestoPDFBuffer]', error);
    return null;
  }
}
