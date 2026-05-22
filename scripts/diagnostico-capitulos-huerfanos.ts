#!/usr/bin/env npx tsx
/**
 * SIPO — Diagnóstico de capítulos huérfanos del catálogo
 *
 * Identifica capítulos/actividades que NO tienen catalogo_apu_items,
 * lo que los hace inútiles al importar desde "Plantilla Sugerida".
 *
 * Uso:
 *   npx tsx scripts/diagnostico-capitulos-huerfanos.ts
 *   npx tsx scripts/diagnostico-capitulos-huerfanos.ts --json   (salida JSON)
 *
 * Requiere en .env: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_DB_PASSWORD
 */

import { Client } from 'pg';
import * as path from 'path';
import * as url from 'url';
import * as dotenv from 'dotenv';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const args   = process.argv.slice(2);
const AS_JSON = args.includes('--json');

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface FilaActividad {
  capitulo_id:    string;
  capitulo_codigo: string;
  capitulo_nombre: string;
  tipo_obra:       string;
  actividad_id:    string;
  actividad_codigo: string;
  actividad_nombre: string;
  precio_ref:      number;
  total_items:     number;
}

interface ResumenCapitulo {
  tipo_obra:          string;
  capitulo_codigo:    string;
  capitulo_nombre:    string;
  total_actividades:  number;
  actividades_sin_items: number;
  actividades_con_items: number;
  items_total:        number;
  huerfano:           boolean;
}

// ─── Conexión ─────────────────────────────────────────────────────────────────

async function conectar(): Promise<Client> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const dbPassword  = process.env.SUPABASE_DB_PASSWORD;
  const dbHostEnv   = process.env.SUPABASE_DB_HOST;
  const dbPortEnv   = process.env.SUPABASE_DB_PORT;

  if (!supabaseUrl || !dbPassword) {
    console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_DB_PASSWORD en .env');
    process.exit(1);
  }

  const projectId = new URL(supabaseUrl).hostname.split('.')[0];
  const dbHost    = dbHostEnv ?? `db.${projectId}.supabase.co`;
  const dbPort    = dbPortEnv ?? '5432';
  const dbUser    = dbHostEnv ? `postgres.${projectId}` : 'postgres';

  const client = new Client({
    connectionString: `postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/postgres`,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  return client;
}

// ─── Diagnóstico ──────────────────────────────────────────────────────────────

async function diagnosticar(client: Client): Promise<void> {
  if (!AS_JSON) {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║   SIPO — Diagnóstico Capítulos Huérfanos           ║');
    console.log('╚════════════════════════════════════════════════════╝\n');
  }

  // ── Consulta principal ────────────────────────────────────────────────────
  const { rows } = await client.query<FilaActividad>(`
    SELECT
      cc.id                              AS capitulo_id,
      cc.codigo                          AS capitulo_codigo,
      cc.nombre                          AS capitulo_nombre,
      cc.tipo_obra,
      ca.id                              AS actividad_id,
      ca.codigo                          AS actividad_codigo,
      ca.nombre                          AS actividad_nombre,
      COALESCE(ca.precio_referencia_nacional, 0) AS precio_ref,
      COUNT(cai.id)::int                 AS total_items
    FROM catalogo_capitulos cc
    JOIN catalogo_actividades ca
      ON ca.catalogo_capitulo_id = cc.id
    LEFT JOIN catalogo_apu_items cai
      ON cai.catalogo_actividad_id = ca.id
    GROUP BY cc.id, cc.codigo, cc.nombre, cc.tipo_obra,
             ca.id, ca.codigo, ca.nombre, ca.precio_referencia_nacional
    ORDER BY cc.tipo_obra, cc.codigo, ca.codigo
  `);

  if (rows.length === 0) {
    console.log('⚠️  No se encontraron actividades en el catálogo.');
    return;
  }

  // ── Agrupar por capítulo ──────────────────────────────────────────────────
  const porCapitulo = new Map<string, ResumenCapitulo>();

  for (const row of rows) {
    const key = row.capitulo_id;
    if (!porCapitulo.has(key)) {
      porCapitulo.set(key, {
        tipo_obra:             row.tipo_obra,
        capitulo_codigo:       row.capitulo_codigo,
        capitulo_nombre:       row.capitulo_nombre,
        total_actividades:     0,
        actividades_sin_items: 0,
        actividades_con_items: 0,
        items_total:           0,
        huerfano:              false,
      });
    }
    const cap = porCapitulo.get(key)!;
    cap.total_actividades++;
    cap.items_total += row.total_items;
    if (row.total_items === 0) {
      cap.actividades_sin_items++;
    } else {
      cap.actividades_con_items++;
    }
    cap.huerfano = cap.actividades_sin_items > 0;
  }

  // ── Estadísticas globales ─────────────────────────────────────────────────
  const totalCaps     = porCapitulo.size;
  const capsSinItems  = [...porCapitulo.values()].filter(c => c.huerfano).length;
  const actsSinItems  = rows.filter(r => r.total_items === 0).length;
  const actsConItems  = rows.filter(r => r.total_items > 0).length;

  // ── Agrupar huérfanos por tipo_obra ───────────────────────────────────────
  const huerfanosPorTipo = new Map<string, ResumenCapitulo[]>();
  for (const cap of porCapitulo.values()) {
    if (!cap.huerfano) continue;
    const lista = huerfanosPorTipo.get(cap.tipo_obra) ?? [];
    lista.push(cap);
    huerfanosPorTipo.set(cap.tipo_obra, lista);
  }

  // ── Actividades huérfanas detalladas ──────────────────────────────────────
  const actHuerfanas = rows.filter(r => r.total_items === 0);

  if (AS_JSON) {
    console.log(JSON.stringify({
      resumen: { totalCaps, capsSinItems, actsSinItems, actsConItems },
      capitulosHuerfanos: [...porCapitulo.values()].filter(c => c.huerfano),
      actividadesHuerfanas: actHuerfanas.map(r => ({
        tipo_obra:        r.tipo_obra,
        capitulo_codigo:  r.capitulo_codigo,
        capitulo_nombre:  r.capitulo_nombre,
        actividad_id:     r.actividad_id,
        actividad_codigo: r.actividad_codigo,
        actividad_nombre: r.actividad_nombre,
        precio_ref:       r.precio_ref,
      })),
    }, null, 2));
    return;
  }

  // ── Salida legible ────────────────────────────────────────────────────────
  console.log('📊 RESUMEN GLOBAL');
  console.log(`   Capítulos totales          : ${totalCaps}`);
  console.log(`   Capítulos con huérfanos    : ${capsSinItems}  ${capsSinItems > 0 ? '⚠️' : '✅'}`);
  console.log(`   Actividades con items      : ${actsConItems}`);
  console.log(`   Actividades SIN items      : ${actsSinItems}  ${actsSinItems > 0 ? '⚠️' : '✅'}`);

  if (actsSinItems === 0) {
    console.log('\n✅ El catálogo está completo — ninguna actividad huérfana.\n');
    return;
  }

  console.log('\n─────────────────────────────────────────────────────\n');

  const TIPOS_ORDEN = ['residencial', 'comercial', 'infraestructura', 'institucional', 'industrial', 'hotelero'];

  for (const tipo of TIPOS_ORDEN) {
    const caps = huerfanosPorTipo.get(tipo);
    if (!caps || caps.length === 0) continue;

    const tipoLabel = tipo.toUpperCase();
    console.log(`\n🏗️  ${tipoLabel}`);
    console.log('─'.repeat(50));

    for (const cap of caps) {
      const icon = cap.actividades_sin_items === cap.total_actividades ? '❌' : '⚠️ ';
      console.log(`\n  ${icon} [${cap.capitulo_codigo}] ${cap.capitulo_nombre}`);
      console.log(`     Actividades totales  : ${cap.total_actividades}`);
      console.log(`     Con apu_items        : ${cap.actividades_con_items}`);
      console.log(`     Sin apu_items        : ${cap.actividades_sin_items}  ← HUÉRFANAS`);
      console.log(`     Items totales        : ${cap.items_total}`);

      // Detalle de las actividades huérfanas
      const huerfanasDelCap = rows.filter(
        r => r.capitulo_codigo === cap.capitulo_codigo &&
             r.tipo_obra === cap.tipo_obra &&
             r.total_items === 0
      );

      for (const act of huerfanasDelCap) {
        const precio = act.precio_ref > 0
          ? `$${act.precio_ref.toLocaleString('es-CO')}`
          : 'sin precio';
        console.log(`       • ${act.actividad_codigo} — ${act.actividad_nombre} (${precio})`);
      }
    }
  }

  console.log('\n─────────────────────────────────────────────────────');
  console.log('\n💡 Para corregir, ejecuta:');
  console.log('   npx tsx scripts/reimportar-capitulos-huerfanos.ts\n');
}

// ─── Entry point ──────────────────────────────────────────────────────────────

(async () => {
  const client = await conectar();
  try {
    await diagnosticar(client);
  } catch (err) {
    console.error('\n❌ Error en el diagnóstico:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
