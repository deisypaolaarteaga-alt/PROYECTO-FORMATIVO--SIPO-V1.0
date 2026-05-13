#!/usr/bin/env npx tsx
/**
 * SIPO — Verificación del estado del catálogo via REST API de Supabase
 * Uso: npx tsx scripts/check-catalogo.ts
 */

import * as path from 'path';
import * as url from 'url';
import * as dotenv from 'dotenv';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env');
  process.exit(1);
}

const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'count=exact',
};

async function query(table: string, params = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, { headers });
  const count = res.headers.get('content-range')?.split('/')[1] ?? '?';
  const data = await res.json() as any[];
  return { data, count };
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   SIPO — Check Estado del Catálogo (REST)    ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  // 1. catalogo_capitulos — conteo total
  const caps = await query('catalogo_capitulos', 'select=id,nombre,tipo_obra&order=tipo_obra');
  console.log(`📦 catalogo_capitulos:   ${caps.count} filas`);

  // Agrupar por tipo_obra
  const porTipo: Record<string, number> = {};
  for (const row of caps.data) {
    porTipo[row.tipo_obra] = (porTipo[row.tipo_obra] || 0) + 1;
  }
  if (Object.keys(porTipo).length === 0) {
    console.log('   └─ (tabla vacía)');
  } else {
    for (const [tipo, n] of Object.entries(porTipo)) {
      console.log(`   └─ tipo_obra="${tipo}"  →  ${n} capítulos`);
    }
  }

  // 2. catalogo_actividades
  const acts = await query('catalogo_actividades', 'select=id,nombre,capitulo_id,precio_referencia_nacional');
  console.log(`\n🏗️  catalogo_actividades: ${acts.count} filas`);

  // Actividades por capítulo (muestra distribución)
  const actPorCap: Record<string, number> = {};
  for (const row of acts.data) {
    actPorCap[row.capitulo_id] = (actPorCap[row.capitulo_id] || 0) + 1;
  }
  const capsConActs = Object.keys(actPorCap).length;
  console.log(`   └─ Distribuidas en ${capsConActs} capítulos distintos`);

  // 3. catalogo_apu_items
  const apus = await query('catalogo_apu_items', 'select=id,tipo,actividad_id');
  console.log(`\n🔧 catalogo_apu_items:   ${apus.count} filas`);

  const porTipoApu: Record<string, number> = {};
  const actsConApu = new Set<string>();
  for (const row of apus.data) {
    porTipoApu[row.tipo] = (porTipoApu[row.tipo] || 0) + 1;
    actsConApu.add(row.actividad_id);
  }
  if (apus.data.length === 0) {
    console.log('   └─ (tabla vacía)');
  } else {
    for (const [tipo, n] of Object.entries(porTipoApu)) {
      console.log(`   └─ tipo="${tipo}"  →  ${n} ítems`);
    }
    console.log(`   └─ Actividades con APU items: ${actsConApu.size}`);
  }

  // 4. Muestra: 8 primeras actividades residencial con sus precios y APU items
  console.log('\n📋 Muestra — actividades residencial (hasta 8):');
  const capRes = caps.data.filter(c => c.tipo_obra === 'residencial').map(c => c.id);

  if (capRes.length === 0) {
    console.log('   └─ Sin capítulos con tipo_obra="residencial"');
  } else {
    const actsRes = acts.data
      .filter(a => capRes.includes(a.capitulo_id))
      .slice(0, 8);

    for (const act of actsRes) {
      const apuItems = apus.data.filter(i => i.actividad_id === act.id).length;
      const precio   = Number(act.precio_referencia_nacional).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
      console.log(`   [${act.id.substring(0,8)}] ${act.nombre} — ref ${precio} — ${apuItems} APU items`);
    }
  }

  // 5. Veredicto
  const totalCaps = Number(caps.count);
  const totalActs = Number(acts.count);
  const totalApus = Number(apus.count);
  const hasRes    = capRes.length > 0;

  console.log('\n══════════════════════════════════════════════');
  if (totalCaps === 0) {
    console.log('❌ ACCIÓN REQUERIDA: catalogo_capitulos está vacío');
    console.log('   → Ejecuta: npm run seed:catalogo');
  } else if (totalActs === 0) {
    console.log('⚠️  ACCIÓN REQUERIDA: catalogo_actividades está vacío');
    console.log('   → Ejecuta: npm run seed:catalogo');
  } else if (totalApus === 0) {
    console.log('⚠️  ACCIÓN REQUERIDA: catalogo_apu_items está vacío');
    console.log('   → Ejecuta: npm run seed:apu');
  } else if (!hasRes) {
    console.log('⚠️  No hay capítulos con tipo_obra="residencial"');
    console.log('   → Revisa el seed o usa otro tipo_obra');
  } else {
    console.log('✅ Catálogo OK — crearPresupuestoConPlantilla debería insertar actividades correctamente');
  }
  console.log('══════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('\n❌ Error inesperado:', err.message);
  process.exit(1);
});
