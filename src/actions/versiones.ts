'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import Decimal from 'decimal.js';
import type { ActionResult, BudgetSnapshot, SnapshotData } from '@/types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function calcularTotalOfertaLocal(budget: {
  costo_directo: number;
  administracion_pct: number;
  imprevistos_pct: number;
  utilidad_pct: number;
  metodo_iva: string;
  iva_porcentaje: number;
}): number {
  const cd = new Decimal(budget.costo_directo ?? 0);
  const admin = cd.mul(new Decimal(budget.administracion_pct ?? 10).div(100));
  const imprevistos = cd.mul(new Decimal(budget.imprevistos_pct ?? 5).div(100));
  const utilidad = cd.mul(new Decimal(budget.utilidad_pct ?? 10).div(100));
  const subtotalConAIU = cd.plus(admin).plus(imprevistos).plus(utilidad);
  const ivaPct = new Decimal(budget.iva_porcentaje ?? 19).div(100);

  let iva = new Decimal(0);
  switch (budget.metodo_iva) {
    case 'sobre_utilidad': iva = utilidad.mul(ivaPct); break;
    case 'sobre_aiu':      iva = admin.plus(imprevistos).plus(utilidad).mul(ivaPct); break;
    case 'sobre_total':    iva = subtotalConAIU.mul(ivaPct); break;
  }

  return subtotalConAIU.plus(iva).toNumber();
}

// ── 1b. detectarCambios ───────────────────────────────────────────────────────

/**
 * Compara el estado actual del presupuesto contra el último snapshot guardado.
 * Retorna true si hay cambios reales (precio, cantidad, actividades, AIU).
 * Cambios que NO cuentan: titulo, vigencia_dias, area_m2, ciudad_ica.
 */
async function detectarCambios(
  budgetId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _userId: string
): Promise<boolean> {
  try {
    const admin = createAdminClient();

    // 1. Último snapshot con data JSONB
    const { data: lastSnap } = await admin
      .from('budget_snapshots')
      .select('data')
      .eq('budget_id', budgetId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Sin snapshot previo → siempre hay cambio
    if (!lastSnap?.data) return true;

    // 2. Estado actual del presupuesto
    const { data: budget } = await admin
      .from('budgets')
      .select(`
        administracion_pct, imprevistos_pct, utilidad_pct,
        chapters (
          activities (
            id, cantidad, precio_unitario, deleted_at
          )
        )
      `)
      .eq('id', budgetId)
      .single();

    if (!budget) return true;

    const snap = lastSnap.data as SnapshotData;

    // 3. Comparar AIU (Administración, Imprevistos, Utilidad)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b = budget as any;
    if (!new Decimal(b.administracion_pct ?? 0).eq(new Decimal(snap.administracion_pct ?? 0))) return true;
    if (!new Decimal(b.imprevistos_pct    ?? 0).eq(new Decimal(snap.imprevistos_pct    ?? 0))) return true;
    if (!new Decimal(b.utilidad_pct       ?? 0).eq(new Decimal(snap.utilidad_pct       ?? 0))) return true;

    // 4. Actividades del snapshot → mapa por id
    const snapActs = snap.capitulos.flatMap((c) => c.actividades);
    const snapMap  = new Map(snapActs.map((a) => [a.id, a]));

    // 5. Actividades actuales no eliminadas → mapa por id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentActs: Array<{ id: string; cantidad: number; precio_unitario: number }> =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (b.chapters ?? []).flatMap((ch: any) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((ch.activities ?? []) as any[]).filter((a) => !a.deleted_at)
      );
    const currentMap = new Map(currentActs.map((a) => [a.id, a]));

    // 6. Actividades eliminadas (en snapshot pero no en actual)
    for (const id of snapMap.keys()) {
      if (!currentMap.has(id)) return true;
    }

    // 7. Actividades nuevas (en actual pero no en snapshot)
    for (const id of currentMap.keys()) {
      if (!snapMap.has(id)) return true;
    }

    // 8. Cambios en cantidad o precio_unitario (usando decimal.js, nunca floats)
    for (const [id, current] of currentMap.entries()) {
      const snapAct = snapMap.get(id);
      if (!snapAct) continue;
      if (!new Decimal(current.precio_unitario ?? 0).eq(new Decimal(snapAct.precio_unitario ?? 0))) return true;
      if (!new Decimal(current.cantidad         ?? 0).eq(new Decimal(snapAct.cantidad         ?? 0))) return true;
    }

    return false;
  } catch {
    // En caso de error, asumir que hay cambios (más conservador)
    return true;
  }
}

// ── 1. guardarSnapshot ────────────────────────────────────────────────────────

/**
 * Guarda un snapshot inmutable de la jerarquía completa del presupuesto.
 * Debe llamarse ANTES de cambiar el estado del budget.
 */
export async function guardarSnapshot(
  budgetId: string,
  motivo: 'rechazo_cliente' | 'reapertura_manual' | 'aprobacion' | 'envio_cliente'
): Promise<ActionResult & { generado?: boolean }> {
  try {
    // 1. Verificar ownership con cliente de usuario (RLS aplica)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const { data: budgetOwner } = await supabase
      .from('budgets')
      .select('id, user_id, estado, version')
      .eq('id', budgetId)
      .single();

    if (!budgetOwner) return { success: false, error: 'Presupuesto no encontrado' };
    if (budgetOwner.user_id !== user.id) return { success: false, error: 'Sin permiso' };

    // 1b. Verificar cambios reales (excepto envio_cliente y aprobacion — siempre guardan)
    if (motivo !== 'envio_cliente' && motivo !== 'aprobacion') {
      const hayCambios = await detectarCambios(budgetId, user.id);
      if (!hayCambios) {
        return { success: true, generado: false, message: 'Sin cambios detectados' };
      }
    }

    // 2. Leer jerarquía completa con admin client (evita problemas de JWT en server actions largas)
    const admin = createAdminClient();

    const { data: budget } = await admin
      .from('budgets')
      .select(`
        id, version, estado,
        metodo_aiu, administracion_pct, imprevistos_pct, utilidad_pct,
        metodo_iva, iva_porcentaje, costo_directo,
        chapters (
          id, nombre, numero, valor_subtotal,
          activities (
            id, nombre, unidad, cantidad, precio_unitario,
            deleted_at,
            apus (
              rendimiento, pct_herramienta_menor, pct_epp,
              costo_material, costo_mano_obra, costo_equipo,
              apu_items (
                tipo, nombre, unidad, cantidad, precio_unitario
              )
            )
          )
        )
      `)
      .eq('id', budgetId)
      .single();

    if (!budget) return { success: false, error: 'Error al leer el presupuesto' };

    // 3. Serializar jerarquía completa (filtrar actividades eliminadas)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const capitulos = ((budget as any).chapters ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((cap: any) => ({
        id:             cap.id,
        nombre:         cap.nombre,
        orden:          (cap as any).numero ?? 0,
        valor_subtotal: cap.valor_subtotal,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        actividades: ((cap.activities ?? []) as any[])
          .filter((act: any) => !act.deleted_at)
          .map((act: any) => {
            const apuRaw = act.apus?.[0];
            return {
              id:             act.id,
              nombre:         act.nombre,
              unidad:         act.unidad,
              cantidad:       act.cantidad,
              precio_unitario: act.precio_unitario,
              subtotal:       new Decimal(act.cantidad ?? 0).mul(act.precio_unitario ?? 0).toNumber(),
              apu: apuRaw ? {
                rendimiento:          apuRaw.rendimiento,
                pct_herramienta_menor: apuRaw.pct_herramienta_menor,
                pct_epp:              apuRaw.pct_epp,
                costo_material:       apuRaw.costo_material,
                costo_mano_obra:      apuRaw.costo_mano_obra,
                costo_equipo:         apuRaw.costo_equipo,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                items: (apuRaw.apu_items ?? []).map((item: any) => ({
                  tipo:            item.tipo,
                  nombre:          item.nombre,
                  unidad:          item.unidad,
                  cantidad:        item.cantidad,
                  precio_unitario: item.precio_unitario,
                  subtotal:        new Decimal(item.cantidad ?? 0).mul(item.precio_unitario ?? 0).toNumber(),
                })),
              } : undefined,
            };
          }),
      }));

    const b = budget as unknown as {
      version: number;
      estado: string;
      metodo_aiu: string;
      administracion_pct: number;
      imprevistos_pct: number;
      utilidad_pct: number;
      metodo_iva: string;
      iva_porcentaje: number;
      costo_directo: number;
    };

    // 4. Calcular versión secuencial para este budget
    const { data: lastSnap } = await admin
      .from('budget_snapshots')
      .select('version')
      .eq('budget_id', budgetId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = (lastSnap?.version ?? 0) + 1;

    const data = {
      version:           nextVersion,
      costo_directo:     b.costo_directo,
      metodo_aiu:        b.metodo_aiu,
      administracion_pct: b.administracion_pct,
      imprevistos_pct:   b.imprevistos_pct,
      utilidad_pct:      b.utilidad_pct,
      metodo_iva:        b.metodo_iva,
      iva_porcentaje:    b.iva_porcentaje,
      capitulos,
    };

    const totalOferta = calcularTotalOfertaLocal(b);

    // 5. Insertar snapshot
    const { error: insertErr } = await admin
      .from('budget_snapshots')
      .insert({
        budget_id:     budgetId,
        user_id:       user.id,
        version:       nextVersion,
        motivo,
        estado_budget: b.estado,
        total_oferta:  totalOferta,
        costo_directo: b.costo_directo,
        datos_json:    data,  // columna legacy requerida (NOT NULL)
        data,
      });

    if (insertErr) {
      console.error('[guardarSnapshot] error al insertar:', insertErr);
      return { success: false, error: 'Error al guardar el snapshot.' };
    }

    return { success: true, generado: true };
  } catch (err) {
    console.error('[guardarSnapshot]', err);
    return { success: false, error: 'Error al guardar la versión del presupuesto.' };
  }
}

// ── 2. getVersiones ───────────────────────────────────────────────────────────

/**
 * Lista los snapshots de un presupuesto ordenados por versión descendente.
 * Solo campos de lista (sin data JSONB).
 */
export async function getVersiones(
  budgetId: string
): Promise<ActionResult & { versiones?: BudgetSnapshot[] }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    // Verificar ownership
    const { data: budget } = await supabase
      .from('budgets')
      .select('id, user_id')
      .eq('id', budgetId)
      .single();

    if (!budget || budget.user_id !== user.id) {
      return { success: false, error: 'Presupuesto no encontrado' };
    }

    const { data: rows, error } = await supabase
      .from('budget_snapshots')
      .select('id, version, motivo, estado_budget, total_oferta, costo_directo, created_at')
      .eq('budget_id', budgetId)
      .order('version', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      versiones: (rows ?? []) as unknown as BudgetSnapshot[],
    };
  } catch (err) {
    console.error('[getVersiones]', err);
    return { success: false, error: 'Error al obtener las versiones.' };
  }
}

// ── 3. getDetalleVersion ──────────────────────────────────────────────────────

/**
 * Retorna el snapshot completo con data JSONB.
 * Verifica ownership a través del budget_id.
 */
export async function getDetalleVersion(
  snapshotId: string
): Promise<ActionResult & { snapshot?: BudgetSnapshot }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    // Leer snapshot con budget_id para verificar ownership
    const { data: row, error } = await supabase
      .from('budget_snapshots')
      .select('id, budget_id, version, motivo, estado_budget, total_oferta, costo_directo, created_at, data')
      .eq('id', snapshotId)
      .single();

    if (error || !row) return { success: false, error: 'Versión no encontrada' };

    // Verificar ownership via budget
    const { data: budget } = await supabase
      .from('budgets')
      .select('user_id')
      .eq('id', row.budget_id)
      .single();

    if (!budget || budget.user_id !== user.id) {
      return { success: false, error: 'Sin permiso para ver esta versión' };
    }

    return { success: true, snapshot: row as unknown as BudgetSnapshot };
  } catch (err) {
    console.error('[getDetalleVersion]', err);
    return { success: false, error: 'Error al obtener el detalle de la versión.' };
  }
}
