#!/usr/bin/env npx tsx
/**
 * SIPO — Poblar precios 2026 en actividades con precio_unitario = 0
 *
 * Uso:
 *   npx tsx scripts/master-fill-all-prices.ts             (ejecuta cambios)
 *   npx tsx scripts/master-fill-all-prices.ts --dry-run   (solo simula, no escribe)
 */

import { createClient } from '@supabase/supabase-js';
import Decimal from 'decimal.js';
import * as path from 'path';
import * as url from 'url';
import * as dotenv from 'dotenv';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const DRY_RUN = process.argv.includes('--dry-run');

// ─── Precios base COP 2026 (precio unitario completo, incluye mat+MO+equipo) ─

const PRECIOS_BASE = {
  excavacion:    { precio: 32_000,  unidad: 'm³',  label: 'Excavación manual/mecánica'   },
  concreto:      { precio: 620_000, unidad: 'm³',  label: 'Concreto estructural f\'c≥21MPa' },
  acero:         { precio: 4_500,   unidad: 'kg',  label: 'Acero de refuerzo fy=420MPa'  },
  ladrillo:      { precio: 92_000,  unidad: 'm²',  label: 'Mampostería ladrillo/bloque'   },
  panete:        { precio: 30_000,  unidad: 'm²',  label: 'Pañete y revoque'              },
  pintura:       { precio: 24_000,  unidad: 'm²',  label: 'Pintura vinilo/esmalte'        },
  pto_electrico: { precio: 195_000, unidad: 'pto', label: 'Punto eléctrico red normal'    },
  pto_hidraulico:{ precio: 235_000, unidad: 'pto', label: 'Punto hidráulico/sanitario'    },
  default:       { precio: 48_000,  unidad: 'un',  label: 'Actividad general de obra'     },
} as const;

type Categoria = keyof typeof PRECIOS_BASE;

// ─── Factores por tipo de obra ────────────────────────────────────────────────

const FACTOR: Record<string, number> = {
  industrial:      1.25,
  hotelero:        1.15,
  institucional:   1.15,
  residencial:     1.00,
  comercial:       1.00,
  infraestructura: 1.00,
  otro:            1.00,
};

// ─── Proporciones del precio total por componente de APU ─────────────────────

const SPLIT = { material: 0.55, mano_obra: 0.35, equipo: 0.10 } as const;

// ─── Clasificador por nombre de actividad ────────────────────────────────────

function clasificar(nombre: string): Categoria {
  const n = nombre.toLowerCase();
  if (/excav|descapot|nivelac|movimiento.de.tierra/.test(n)) return 'excavacion';
  if (/concreto|hormig|f'c|fc=|mezcla.cemen/.test(n))        return 'concreto';
  if (/acero|hierro|refuerzo|fy=|varilla/.test(n))            return 'acero';
  if (/ladrillo|mamposter|bloque|tabique/.test(n))            return 'ladrillo';
  if (/pañete|panete|revoque|estuco|mortero|friso/.test(n))   return 'panete';
  if (/pintura|esmalte|vinilo|laca|acabado.final/.test(n))    return 'pintura';
  if (/punto.el[eé]c|tomacorriente|salida.el[eé]c|interruptor|braker|breaker/.test(n)) return 'pto_electrico';
  if (/punto.hid|fontaner|sanitari|tuber[ií]a|desag[üu]e|alcantarill/.test(n))         return 'pto_hidraulico';
  return 'default';
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n══ SIPO Master Fill Prices 2026 ${DRY_RUN ? '[DRY RUN — sin escrituras]' : ''} ══\n`);

  // 1. Actividades con precio_unitario = 0 (activas)
  const { data: activities, error: actErr } = await admin
    .from('activities')
    .select('id, nombre, unidad, budget_id, user_id')
    .eq('precio_unitario', 0)
    .is('deleted_at', null);

  if (actErr) { console.error('Error cargando actividades:', actErr.message); process.exit(1); }
  if (!activities?.length) { console.log('No hay actividades con precio 0. Todo OK.'); return; }

  console.log(`  Actividades con precio 0 : ${activities.length}`);

  // 2. Cargar presupuestos y proyectos para obtener tipo_obra
  const budgetIds  = Array.from(new Set(activities.map(a => a.budget_id)));
  const { data: budgets } = await admin
    .from('budgets').select('id, project_id').in('id', budgetIds);

  const projectIds = Array.from(new Set((budgets ?? []).map((b: any) => b.project_id).filter(Boolean)));
  const { data: projects } = await admin
    .from('projects').select('id, tipo_obra').in('id', projectIds);

  const budgetToProject: Record<string, string> = {};
  for (const b of budgets ?? []) budgetToProject[b.id] = b.project_id;

  const projectToTipo: Record<string, string> = {};
  for (const p of projects ?? []) projectToTipo[p.id] = p.tipo_obra ?? 'residencial';

  // 3. Procesar
  let ok = 0, errores = 0;
  const resumen: Record<string, number> = {};

  for (const act of activities) {
    const tipoObra  = projectToTipo[budgetToProject[act.budget_id]] ?? 'residencial';
    const categoria = clasificar(act.nombre);
    const base      = PRECIOS_BASE[categoria];
    const factor    = FACTOR[tipoObra] ?? 1.0;

    const precio  = new Decimal(base.precio).mul(factor).toDecimalPlaces(0).toNumber();
    const costoMat = new Decimal(precio).mul(SPLIT.material).toDecimalPlaces(2).toNumber();
    const costoMO  = new Decimal(precio).mul(SPLIT.mano_obra).toDecimalPlaces(2).toNumber();
    const costoEq  = new Decimal(precio).mul(SPLIT.equipo).toDecimalPlaces(2).toNumber();
    const costoHM  = new Decimal(costoMO).mul(0.03).toDecimalPlaces(2).toNumber();
    const costoEPP = new Decimal(costoMO).mul(0.01).toDecimalPlaces(2).toNumber();

    console.log(
      `  [${tipoObra.padEnd(14)} ×${factor.toFixed(2)}] ${act.nombre.substring(0, 42).padEnd(42)}`+
      ` → ${categoria.padEnd(14)} → $${precio.toLocaleString('es-CO')}`,
    );

    resumen[categoria] = (resumen[categoria] ?? 0) + 1;

    if (DRY_RUN) { ok++; continue; }

    try {
      // Upsert APU
      const { data: existingApu } = await admin
        .from('apus').select('id').eq('activity_id', act.id).maybeSingle();

      let apuId: string;
      if (existingApu?.id) {
        apuId = existingApu.id;
      } else {
        const { data: newApu, error: e } = await admin
          .from('apus')
          .insert({ activity_id: act.id, budget_id: act.budget_id, user_id: act.user_id, rendimiento: 1 })
          .select('id').single();
        if (e) throw new Error(`APU insert: ${e.message}`);
        apuId = newApu.id;
      }

      // Reemplazar ítems (hard-delete válido — son detalles del APU)
      await admin.from('apu_items').delete().eq('apu_id', apuId);

      const { error: itemsErr } = await admin.from('apu_items').insert([
        { apu_id: apuId, user_id: act.user_id, tipo: 'material',  nombre: `Material — ${base.label}`,     unidad: base.unidad, cantidad: 1, precio_unitario: costoMat },
        { apu_id: apuId, user_id: act.user_id, tipo: 'mano_obra', nombre: `Mano de obra — ${base.label}`, unidad: 'hr',        cantidad: 1, precio_unitario: costoMO  },
        { apu_id: apuId, user_id: act.user_id, tipo: 'equipo',    nombre: `Equipo — ${base.label}`,       unidad: 'hr',        cantidad: 1, precio_unitario: costoEq  },
      ]);
      if (itemsErr) throw new Error(`apu_items insert: ${itemsErr.message}`);

      // Escribir costos en apus → dispara trigger chain →
      //   apus.costo_total (GENERATED) → trg_sync_activity_precio → activities.precio_unitario
      //   → trg_sync_chapter_subtotal → chapters.valor_subtotal
      //   → trg_sync_budget_costo → budgets.costo_directo
      const { error: upErr } = await admin.from('apus').update({
        costo_material:          costoMat,
        costo_mano_obra:         costoMO,
        costo_equipo:            costoEq,
        costo_herramienta_menor: costoHM,
        costo_epp:               costoEPP,
        updated_at:              new Date().toISOString(),
      }).eq('id', apuId);
      if (upErr) throw new Error(`apus update: ${upErr.message}`);

      ok++;
    } catch (err: any) {
      console.error(`    ✗ ${act.id} — ${err.message}`);
      errores++;
    }
  }

  // Resumen final
  console.log('\n══ RESUMEN ══════════════════════════════════════');
  for (const [cat, n] of Object.entries(resumen).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat.padEnd(16)}: ${n} actividades`);
  }
  console.log(`\n  ✓ Procesadas : ${ok}`);
  if (errores) console.log(`  ✗ Errores    : ${errores}`);
  if (DRY_RUN) console.log('\n  (dry-run: ningún cambio fue escrito en BD)');
}

main().catch(err => { console.error(err); process.exit(1); });
