#!/usr/bin/env npx tsx
/**
 * SIPO — Diagnóstico completo de crearPresupuestoConPlantilla
 * Replica exactamente la lógica de la acción para encontrar dónde falla.
 * Uso: npx tsx scripts/debug-plantilla.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as url from 'url';
import * as dotenv from 'dotenv';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

// Simula createAdminClient() del servidor
const admin = createClient(SUPABASE_URL, SERVICE_KEY);
// Simula createClient() del servidor (sin JWT, como anon)
const anon  = createClient(SUPABASE_URL, ANON_KEY);

const tipo_obra = 'residencial';

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   SIPO — Debug crearPresupuestoConPlantilla              ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // ── PASO 1: Verificar env ────────────────────────────────────────────────
  console.log('── 1. Variables de entorno ──');
  console.log('  SUPABASE_URL:', SUPABASE_URL.substring(0, 40) + '...');
  console.log('  SERVICE_KEY :', SERVICE_KEY ? `${SERVICE_KEY.length} chars` : '❌ VACÍA');
  console.log('  ANON_KEY    :', ANON_KEY ? `${ANON_KEY.length} chars` : '❌ VACÍA');
  console.log();

  // ── PASO 2: Query con admin client (como en el fix) ──────────────────────
  console.log('── 2. Query catálogo con ADMIN CLIENT (service role) ──');
  const { data: adminCaps, error: adminErr } = await admin
    .from('catalogo_capitulos')
    .select('*, catalogo_actividades(*, catalogo_apu_items(*))')
    .eq('tipo_obra', tipo_obra)
    .order('numero', { ascending: true });

  if (adminErr) {
    console.error('  ❌ ERROR:', adminErr.message);
  } else if (!adminCaps || adminCaps.length === 0) {
    console.error('  ❌ Sin datos — adminCaps vacío o null');
    console.log('  adminCaps value:', adminCaps);
  } else {
    console.log(`  ✅ ${adminCaps.length} capítulos obtenidos`);
    adminCaps.slice(0, 3).forEach(c => {
      const acts = (c as any).catalogo_actividades ?? [];
      const totalApuItems = acts.reduce((s: number, a: any) => s + (a.catalogo_apu_items?.length ?? 0), 0);
      console.log(`    [${c.numero}] ${c.nombre} | acts: ${acts.length} | apu_items: ${totalApuItems}`);
    });
    if (adminCaps.length > 3) console.log(`    ... y ${adminCaps.length - 3} más`);
  }
  console.log();

  // ── PASO 3: Query con anon client (como en el servidor sin fix) ──────────
  console.log('── 3. Query catálogo con ANON CLIENT (sin JWT) ──');
  const { data: anonCaps, error: anonErr } = await anon
    .from('catalogo_capitulos')
    .select('*, catalogo_actividades(*, catalogo_apu_items(*))')
    .eq('tipo_obra', tipo_obra)
    .order('numero', { ascending: true });

  if (anonErr) {
    console.error('  ❌ ERROR:', anonErr.message);
  } else if (!anonCaps || anonCaps.length === 0) {
    console.error('  ❌ Sin datos — anonCaps vacío o null');
  } else {
    console.log(`  ✅ ${anonCaps.length} capítulos obtenidos`);
    anonCaps.slice(0, 2).forEach(c => {
      const acts = (c as any).catalogo_actividades ?? [];
      console.log(`    [${c.numero}] ${c.nombre} | acts: ${acts.length}`);
    });
  }
  console.log();

  // ── PASO 4: Simular INSERT de presupuesto, capítulo y actividad ──────────
  console.log('── 4. Simular INSERTs con service role (bypass RLS) ──');

  // Obtener un proyecto real
  const { data: projects } = await admin
    .from('projects')
    .select('id, nombre, user_id')
    .limit(1);

  if (!projects || projects.length === 0) {
    console.log('  ⚠️ No hay proyectos — saltando test de INSERT');
  } else {
    const project = projects[0];
    console.log(`  Proyecto: ${project.nombre} (user: ${project.user_id.substring(0,8)}...)`);

    // Crear budget temporal
    const { data: budget, error: bErr } = await admin
      .from('budgets')
      .insert({
        project_id: project.id,
        user_id: project.user_id,
        titulo: '__DEBUG_TEST__',
        estado: 'borrador',
        administracion_pct: 10,
        imprevistos_pct: 5,
        utilidad_pct: 10,
        iva_porcentaje: 19,
        retefuente_pct: 2,
        ica_pct: 0,
      })
      .select().single();

    if (bErr || !budget) {
      console.error('  ❌ Budget INSERT falló:', bErr?.message);
    } else {
      console.log('  ✅ Budget creado:', budget.id.substring(0,8) + '...');

      // Crear capítulo
      const { data: chapter, error: cErr } = await admin
        .from('chapters')
        .insert({ budget_id: budget.id, user_id: project.user_id, nombre: 'TEST', numero: 1 })
        .select().single();

      if (cErr || !chapter) {
        console.error('  ❌ Chapter INSERT falló:', cErr?.message);
      } else {
        console.log('  ✅ Chapter creado:', chapter.id.substring(0,8) + '...');

        // Tomar primera actividad del catálogo
        const caps = adminCaps ?? [];
        const primeraAct = caps.length > 0 ? ((caps[0] as any).catalogo_actividades ?? [])[0] : null;

        if (!primeraAct) {
          console.error('  ❌ Sin actividades en catálogo para test INSERT');
        } else {
          const precio = Number(primeraAct.precio_referencia_nacional);
          const { data: activity, error: actErr } = await admin
            .from('activities')
            .insert({
              chapter_id: chapter.id,
              budget_id: budget.id,
              user_id: project.user_id,
              nombre: primeraAct.nombre,
              unidad: primeraAct.unidad,
              cantidad: 1,
              precio_unitario: precio,
              numero: 1,
              precio_desde_apu: false,
            })
            .select().single();

          if (actErr || !activity) {
            console.error('  ❌ Activity INSERT falló:', actErr?.message, '| code:', actErr?.code);
            console.error('     details:', actErr?.details, '| hint:', actErr?.hint);
          } else {
            console.log('  ✅ Activity creada:', activity.nombre, '| precio:', activity.precio_unitario);
          }
        }

        // Limpiar todo
        await admin.from('chapters').delete().eq('id', chapter.id);
      }
      await admin.from('budgets').delete().eq('id', budget.id);
      console.log('  🗑️  Registros de prueba eliminados');
    }
  }
  console.log();

  // ── PASO 5: Verificar presupuestos existentes ────────────────────────────
  console.log('── 5. Estado de presupuestos en BD ──');
  const { data: budgets } = await admin
    .from('budgets')
    .select('id, titulo, created_at, chapters(id, nombre, activities(id))')
    .order('created_at', { ascending: false })
    .limit(3);

  if (budgets) {
    for (const b of budgets) {
      const caps = (b as any).chapters ?? [];
      const totalActs = caps.reduce((s: number, c: any) => s + (c.activities?.length ?? 0), 0);
      console.log(`  "${b.titulo}" | caps: ${caps.length} | activities: ${totalActs}`);
    }
  }
  console.log();

  // ── VEREDICTO ─────────────────────────────────────────────────────────────
  console.log('══════════════════════════════════════════════════════════');
  const adminOk = adminCaps && adminCaps.length > 0 && ((adminCaps[0] as any).catalogo_actividades?.length ?? 0) > 0;
  const anonOk  = anonCaps  && anonCaps.length  > 0 && ((anonCaps[0]  as any).catalogo_actividades?.length ?? 0) > 0;

  if (!adminOk && !anonOk) {
    console.log('❌ CRÍTICO: Ningún cliente puede leer catalogo_actividades con embedded join');
    console.log('   → El problema está en la BD o en el schema de PostgREST');
  } else if (!adminOk && anonOk) {
    console.log('❌ Admin client falla pero anon sí funciona — revisar SERVICE_ROLE_KEY');
  } else if (adminOk && !anonOk) {
    console.log('⚠️  Solo admin client funciona — el fix del server.ts es necesario');
  } else {
    console.log('✅ Ambos clientes leen el catálogo con actividades correctamente');
    console.log('   → El problema está en el INSERT de activities (RLS o constraint)');
  }
  console.log('══════════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('\n❌ Error inesperado:', err.message);
  process.exit(1);
});
