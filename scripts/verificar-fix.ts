#!/usr/bin/env npx tsx
/**
 * SIPO — Verificación end-to-end + benchmark batch vs secuencial
 * Uso: npx tsx scripts/verificar-fix.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as url from 'url';
import * as dotenv from 'dotenv';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(SUPABASE_URL, SERVICE_KEY);

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function count(table: string, filter?: Record<string, string>): Promise<number> {
  let q = admin.from(table).select('id', { count: 'exact', head: true });
  if (filter) {
    for (const [k, v] of Object.entries(filter)) q = (q as any).eq(k, v);
  }
  const { count: c, error } = await q;
  if (error) { console.error(`  count(${table}) error:`, error.message); return -1; }
  return c ?? 0;
}

async function mostrarConteos() {
  console.log('\n══ CONTEOS GLOBALES ══════════════════════════════════════════');
  const cc = await count('catalogo_capitulos');
  const ca = await count('catalogo_actividades');
  const ci = await count('catalogo_apu_items');
  console.log(`  catalogo_capitulos  : ${cc}`);
  console.log(`  catalogo_actividades: ${ca}`);
  console.log(`  catalogo_apu_items  : ${ci}`);

  const { data: budgets } = await admin
    .from('budgets')
    .select('id, titulo, created_at')
    .order('created_at', { ascending: false })
    .limit(3);

  console.log('\n  Presupuestos recientes:');
  for (const b of budgets ?? []) {
    const nc = await count('chapters',   { budget_id: b.id });
    const na = await count('activities', { budget_id: b.id });
    const ts = b.created_at.substring(0, 16);
    console.log(`    "${b.titulo}" [${ts}] → chapters: ${nc} | activities: ${na}`);
  }
  console.log('══════════════════════════════════════════════════════════════');
}

// ─── Cargar catálogo (compartido por ambos tests) ─────────────────────────────

async function cargarCatalogo(tipo_obra: string, limit: number) {
  const { data, error } = await admin
    .from('catalogo_capitulos')
    .select('*, catalogo_actividades(*, catalogo_apu_items(*))')
    .eq('tipo_obra', tipo_obra)
    .order('numero', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

// ─── TEST A: Inserción secuencial (método anterior) ───────────────────────────

async function testSecuencial(userId: string, projectId: string, caps: any[]): Promise<{ ms: number; activities: number; apus: number; budgetId: string }> {
  const titulo = `__TEST_SEQ_${Date.now()}__`;

  const { data: budget, error: budgetErr } = await admin
    .from('budgets')
    .insert({ project_id: projectId, user_id: userId, titulo, estado: 'borrador',
      administracion_pct: 10, imprevistos_pct: 5, utilidad_pct: 10,
      iva_porcentaje: 19, retefuente_pct: 2, ica_pct: 0 })
    .select().single();

  if (budgetErr || !budget) throw budgetErr;

  const capitulosPersonalizados = caps.map((c: any, i: number) => `${String(i + 1).padStart(2, '0')}. ${c.nombre}`);
  const totalCaps = caps.length;
  let totalActs = 0, totalAPUs = 0;

  const t0 = Date.now();

  for (let i = 0; i < totalCaps; i++) {
    const catCap = caps[i];
    const nombreCapitulo = capitulosPersonalizados[i];

    const { data: chapter, error: chErr } = await admin
      .from('chapters')
      .insert({ budget_id: budget.id, user_id: userId, nombre: nombreCapitulo, numero: i + 1 })
      .select().single();

    if (chErr || !chapter) { console.error('  chapter fail:', chErr?.message); continue; }

    const actividades: any[] = (catCap as any).catalogo_actividades ?? [];

    for (let j = 0; j < actividades.length; j++) {
      const act = actividades[j];
      const catalogoApuItems: any[] = act.catalogo_apu_items ?? [];
      const tieneAPU = catalogoApuItems.length > 0;

      let precioUnitario = Number(act.precio_referencia_nacional);
      let costoMaterial = 0, costoMO = 0, costoEquipo = 0;

      if (tieneAPU) {
        for (const item of catalogoApuItems) {
          const sub = Number(item.cantidad) * Number(item.precio_unitario);
          if (item.tipo === 'material') costoMaterial += sub;
          else if (item.tipo === 'mano_obra') costoMO += sub;
          else if (item.tipo === 'equipo') costoEquipo += sub;
        }
        const costoHM = costoMO * 0.03; const costoEPP = costoMO * 0.01;
        precioUnitario = costoMaterial + costoMO + costoEquipo + costoHM + costoEPP;
      }

      const { data: activity, error: actErr } = await admin
        .from('activities')
        .insert({ chapter_id: chapter.id, budget_id: budget.id, user_id: userId,
          nombre: act.nombre, unidad: act.unidad, cantidad: 1,
          precio_unitario: precioUnitario, numero: j + 1, precio_desde_apu: tieneAPU })
        .select().single();

      if (actErr || !activity) continue;
      totalActs++;

      const costoHM = costoMO * 0.03; const costoEPP = costoMO * 0.01;

      const { data: apu, error: apuErr } = await admin
        .from('apus')
        .insert({ activity_id: activity.id, budget_id: budget.id, user_id: userId,
          rendimiento: 1, costo_material: costoMaterial, costo_mano_obra: costoMO,
          costo_equipo: costoEquipo, costo_herramienta_menor: costoHM, costo_epp: costoEPP,
          pct_herramienta_menor: 3, pct_epp: 1 })
        .select().single();

      if (apuErr || !apu) continue;
      totalAPUs++;

      if (tieneAPU) {
        await admin.from('apu_items').insert(
          catalogoApuItems.sort((a, b) => a.orden - b.orden).map(item => ({
            apu_id: apu.id, user_id: userId, nombre: item.nombre,
            descripcion: item.descripcion ?? null, tipo: item.tipo,
            unidad: item.unidad, cantidad: Number(item.cantidad),
            precio_unitario: Number(item.precio_unitario),
          }))
        );
      }
    }
  }

  const ms = Date.now() - t0;
  return { ms, activities: totalActs, apus: totalAPUs, budgetId: budget.id };
}

// ─── TEST B: Inserción batch (método nuevo) ───────────────────────────────────

async function testBatch(userId: string, projectId: string, caps: any[]): Promise<{ ms: number; activities: number; apus: number; budgetId: string }> {
  const titulo = `__TEST_BATCH_${Date.now()}__`;

  const { data: budget, error: budgetErr } = await admin
    .from('budgets')
    .insert({ project_id: projectId, user_id: userId, titulo, estado: 'borrador',
      administracion_pct: 10, imprevistos_pct: 5, utilidad_pct: 10,
      iva_porcentaje: 19, retefuente_pct: 2, ica_pct: 0 })
    .select().single();

  if (budgetErr || !budget) throw budgetErr;

  const capitulosPersonalizados = caps.map((c: any, i: number) => `${String(i + 1).padStart(2, '0')}. ${c.nombre}`);
  const totalCaps = caps.length;

  const t0 = Date.now();

  // BATCH 1: capítulos
  const chapterPayloads = Array.from({ length: totalCaps }, (_, i) => ({
    budget_id: budget.id, user_id: userId,
    nombre: capitulosPersonalizados[i] || caps[i]?.nombre || `Capítulo ${i + 1}`,
    numero: i + 1,
  }));

  const { data: chapters, error: chErr } = await admin
    .from('chapters').insert(chapterPayloads).select('id');

  if (chErr || !chapters) throw chErr;

  // Construir metadata
  type ActivityMeta = {
    payload: Record<string, unknown>;
    catalogoApuItems: any[];
    costoMaterial: number; costoMO: number; costoEquipo: number;
    costoHM: number; costoEPP: number; tieneAPU: boolean;
  };

  const activityMetas: ActivityMeta[] = [];

  for (let i = 0; i < totalCaps; i++) {
    const catCap = caps[i];
    if (!catCap || !chapters[i]) continue;
    const actividades: any[] = (catCap as any).catalogo_actividades ?? [];

    actividades.forEach((act: any, j: number) => {
      const catalogoApuItems: any[] = act.catalogo_apu_items ?? [];
      const tieneAPU = catalogoApuItems.length > 0;
      let precioUnitario = Number(act.precio_referencia_nacional);
      let costoMaterial = 0, costoMO = 0, costoEquipo = 0;

      if (tieneAPU) {
        for (const item of catalogoApuItems) {
          const sub = Number(item.cantidad) * Number(item.precio_unitario);
          if (item.tipo === 'material') costoMaterial += sub;
          else if (item.tipo === 'mano_obra') costoMO += sub;
          else if (item.tipo === 'equipo') costoEquipo += sub;
        }
        const costoHM = costoMO * 0.03; const costoEPP = costoMO * 0.01;
        precioUnitario = costoMaterial + costoMO + costoEquipo + costoHM + costoEPP;
      }

      const costoHM = costoMO * 0.03; const costoEPP = costoMO * 0.01;
      activityMetas.push({
        payload: { chapter_id: chapters[i].id, budget_id: budget.id, user_id: userId,
          nombre: act.nombre, unidad: act.unidad, cantidad: 1,
          precio_unitario: precioUnitario, numero: j + 1, precio_desde_apu: tieneAPU },
        catalogoApuItems, costoMaterial, costoMO, costoEquipo, costoHM, costoEPP, tieneAPU,
      });
    });
  }

  if (activityMetas.length === 0) {
    return { ms: Date.now() - t0, activities: 0, apus: 0, budgetId: budget.id };
  }

  // BATCH 2: actividades
  const { data: activities, error: actErr } = await admin
    .from('activities').insert(activityMetas.map(m => m.payload)).select('id');
  if (actErr || !activities) throw actErr;

  // BATCH 3: APUs
  const { data: apus, error: apuErr } = await admin
    .from('apus')
    .insert(activityMetas.map((m, i) => ({
      activity_id: activities[i].id, budget_id: budget.id, user_id: userId,
      rendimiento: 1, costo_material: m.costoMaterial, costo_mano_obra: m.costoMO,
      costo_equipo: m.costoEquipo, costo_herramienta_menor: m.costoHM, costo_epp: m.costoEPP,
      pct_herramienta_menor: 3, pct_epp: 1,
    })))
    .select('id');
  if (apuErr || !apus) throw apuErr;

  // BATCH 4: apu_items
  const allApuItems: any[] = [];
  activityMetas.forEach((m, i) => {
    if (!m.tieneAPU) return;
    m.catalogoApuItems.sort((a: any, b: any) => a.orden - b.orden).forEach((item: any) => {
      allApuItems.push({
        apu_id: apus[i].id, user_id: userId, nombre: item.nombre,
        descripcion: item.descripcion ?? null, tipo: item.tipo,
        unidad: item.unidad, cantidad: Number(item.cantidad),
        precio_unitario: Number(item.precio_unitario),
      });
    });
  });

  if (allApuItems.length > 0) {
    const { error: itemsErr } = await admin.from('apu_items').insert(allApuItems);
    if (itemsErr) console.error('  apu_items batch error:', itemsErr.message);
  }

  const ms = Date.now() - t0;
  return { ms, activities: activities.length, apus: apus.length, budgetId: budget.id };
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║   SIPO — Benchmark batch vs secuencial                       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  await mostrarConteos();

  const { data: projects } = await admin.from('projects').select('id, nombre, user_id').limit(1);
  if (!projects?.length) { console.error('\n❌ No hay proyectos en BD'); process.exit(1); }

  const { id: projectId, user_id: userId } = projects[0];
  console.log(`\n  Usando project: ${projectId.substring(0, 8)}... | user: ${userId.substring(0, 8)}...`);

  // Cargar catálogo completo residencial para benchmark justo
  console.log('\n[0] Cargando catálogo completo "residencial"...');
  const caps = await cargarCatalogo('residencial', 100);
  const totalActs = caps.reduce((s: number, c: any) => s + ((c.catalogo_actividades ?? []).length), 0);
  const totalItems = caps.reduce((s: number, c: any) =>
    s + (c.catalogo_actividades ?? []).reduce((s2: number, a: any) => s2 + ((a.catalogo_apu_items ?? []).length), 0), 0);
  console.log(`  ${caps.length} capítulos | ${totalActs} actividades | ${totalItems} apu_items`);

  // Contar round-trips del método secuencial
  const roundTripsSeq = caps.length + totalActs + totalActs + totalActs; // caps + acts + apus + items_batches
  console.log(`  Round-trips secuencial estimados: ${roundTripsSeq}`);
  console.log(`  Round-trips batch: 4 (caps + acts + apus + items)`);

  // ─── Test A: secuencial ──────────────────────────────────────────────────
  console.log('\n══ TEST A: SECUENCIAL ════════════════════════════════════════');
  process.stdout.write('  Ejecutando... ');
  const resSeq = await testSecuencial(userId, projectId, caps);
  console.log(`\n  Tiempo: ${resSeq.ms}ms (${(resSeq.ms / 1000).toFixed(1)}s)`);
  console.log(`  activities: ${resSeq.activities} | APUs: ${resSeq.apus}`);

  // Verificar BD
  const ncSeq = await count('chapters',   { budget_id: resSeq.budgetId });
  const naSeq = await count('activities', { budget_id: resSeq.budgetId });
  console.log(`  En BD → chapters: ${ncSeq} | activities: ${naSeq}`);

  // Limpiar
  await admin.from('budgets').delete().eq('id', resSeq.budgetId);

  // ─── Test B: batch ───────────────────────────────────────────────────────
  console.log('\n══ TEST B: BATCH ═════════════════════════════════════════════');
  process.stdout.write('  Ejecutando... ');
  const resBatch = await testBatch(userId, projectId, caps);
  console.log(`\n  Tiempo: ${resBatch.ms}ms (${(resBatch.ms / 1000).toFixed(1)}s)`);
  console.log(`  activities: ${resBatch.activities} | APUs: ${resBatch.apus}`);

  // Verificar BD
  const ncBatch = await count('chapters',   { budget_id: resBatch.budgetId });
  const naBatch = await count('activities', { budget_id: resBatch.budgetId });
  console.log(`  En BD → chapters: ${ncBatch} | activities: ${naBatch}`);

  // Limpiar
  await admin.from('budgets').delete().eq('id', resBatch.budgetId);

  // ─── Comparación ─────────────────────────────────────────────────────────
  const speedup = resSeq.ms / resBatch.ms;
  console.log('\n══ RESULTADO ══════════════════════════════════════════════════');
  console.log(`  Secuencial : ${resSeq.ms}ms`);
  console.log(`  Batch      : ${resBatch.ms}ms`);
  console.log(`  Speedup    : ${speedup.toFixed(1)}× más rápido`);
  console.log(`  Datos OK   : ${naBatch === naSeq ? '✅ misma cantidad de actividades' : '⚠️  diferencia detectada'}`);

  if (resBatch.activities === 0) {
    console.log('\n❌ FALLO: batch no insertó actividades');
  } else if (resBatch.apus === 0) {
    console.log('\n⚠️  PARCIAL: actividades OK pero sin APUs');
  } else {
    console.log(`\n✅ BATCH VERIFICADO: ${ncBatch} caps | ${naBatch} acts | ${resBatch.apus} APUs`);
  }
  console.log('══════════════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('\n❌ Error inesperado:', err.message);
  process.exit(1);
});
