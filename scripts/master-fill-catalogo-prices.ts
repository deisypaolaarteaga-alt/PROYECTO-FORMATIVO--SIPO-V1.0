#!/usr/bin/env npx tsx
/**
 * SIPO — Poblar precios del CATÁLOGO MAESTRO 2026
 *
 * Uso:
 *   npx tsx scripts/master-fill-catalogo-prices.ts
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

// ─── Precios base COP 2026 ───────────────────────────────────────────────────
const PRECIOS_BASE = {
  excavacion:    { precio: 32_000,  unidad: 'm³',  label: 'Excavación manual/mecánica'   },
  concreto:      { precio: 620_000, unidad: 'm³',  label: 'Concreto estructural f\'c≥21MPa' },
  acero:         { precio: 7_500,   unidad: 'kg',  label: 'Acero de refuerzo fy=420MPa'  },
  ladrillo:      { precio: 92_000,  unidad: 'm²',  label: 'Mampostería ladrillo/bloque'   },
  panete:        { precio: 35_000,  unidad: 'm²',  label: 'Pañete y revoque'              },
  pintura:       { precio: 28_000,  unidad: 'm²',  label: 'Pintura vinilo/esmalte'        },
  pisos:         { precio: 85_000,  unidad: 'm²',  label: 'Pisos y enchapes cerámicos'    },
  cubiertas:     { precio: 145_000, unidad: 'm²',  label: 'Cubiertas y techos'            },
  drywall:       { precio: 95_000,  unidad: 'm²',  label: 'Sistema Drywall / Liviano'     },
  carpinteria:   { precio: 450_000, unidad: 'un',  label: 'Carpintería y ventanería'      },
  pto_electrico: { precio: 215_000, unidad: 'pto', label: 'Punto eléctrico red normal'    },
  pto_hidraulico:{ precio: 255_000, unidad: 'pto', label: 'Punto hidráulico/sanitario'    },
  preliminares:  { precio: 15_000,  unidad: 'm²',  label: 'Preliminares y aseo'           },
  default:       { precio: 55_000,  unidad: 'un',  label: 'Actividad general de obra'     },
} as const;

type Categoria = keyof typeof PRECIOS_BASE;

const FACTOR: Record<string, number> = {
  industrial:      1.30,
  hotelero:        1.20,
  institucional:   1.15,
  residencial:     1.00,
  comercial:       1.05,
  infraestructura: 1.10,
};

const SPLIT = { material: 0.60, mano_obra: 0.30, equipo: 0.10 } as const;

function clasificar(nombre: string): Categoria {
  const n = nombre.toLowerCase();
  if (/excav|descapot|nivelac|movimiento.de.tierra/.test(n)) return 'excavacion';
  if (/concreto|hormig|f'c|fc=|mezcla.cemen/.test(n))        return 'concreto';
  if (/acero|hierro|refuerzo|fy=|varilla/.test(n))            return 'acero';
  if (/ladrillo|mamposter|bloque|tabique/.test(n))            return 'ladrillo';
  if (/pañete|panete|revoque|estuco|mortero|friso/.test(n))   return 'panete';
  if (/pintura|esmalte|vinilo|laca|acabado.final/.test(n))    return 'pintura';
  if (/piso|enchape|baldosa|ceramica|porcelanato/.test(n))    return 'pisos';
  if (/teja|cubierta|impermeabil|manto|techo/.test(n))        return 'cubiertas';
  if (/drywall|superboard|placa.yeso|cielorraso/.test(n))     return 'drywall';
  if (/puerta|ventana|marco|carpinteria|aluminio/.test(n))    return 'carpinteria';
  if (/punto.el[eé]c|tomacorriente|salida.el[eé]c|interruptor|braker|breaker/.test(n)) return 'pto_electrico';
  if (/punto.hid|fontaner|sanitari|tuber[ií]a|desag[üu]e|alcantarill/.test(n))         return 'pto_hidraulico';
  if (/limpieza|aseo|cerramiento|preliminar|campamento/.test(n)) return 'preliminares';
  return 'default';
}

async function main() {
  console.log(`\n══ SIPO Master Fill CATALOGUE Prices 2026 ${DRY_RUN ? '[DRY RUN]' : ''} ══\n`);

  // 1. Obtener todas las actividades del catálogo
  const { data: acts, error: err } = await admin
    .from('catalogo_actividades')
    .select('id, nombre, unidad, tipo_obra');

  if (err) { console.error('Error:', err.message); process.exit(1); }
  if (!acts?.length) { console.log('Catálogo vacío.'); return; }

  console.log(`  Actividades encontradas en catálogo: ${acts.length}`);

  let ok = 0;
  for (const act of acts) {
    const categoria = clasificar(act.nombre);
    const base = PRECIOS_BASE[categoria];
    const factor = FACTOR[act.tipo_obra] ?? 1.0;

    const precio = new Decimal(base.precio).mul(factor).toDecimalPlaces(0).toNumber();
    const costoMat = new Decimal(precio).mul(SPLIT.material).toDecimalPlaces(0).toNumber();
    const costoMO = new Decimal(precio).mul(SPLIT.mano_obra).toDecimalPlaces(0).toNumber();
    const costoEq = new Decimal(precio).mul(SPLIT.equipo).toDecimalPlaces(0).toNumber();

    if (DRY_RUN) {
      console.log(`  [DRY] ${act.nombre.substring(0, 30)} -> ${precio}`);
      ok++;
      continue;
    }

    try {
      // 1. Actualizar precio en la actividad
      await admin.from('catalogo_actividades').update({
        precio_referencia_nacional: precio,
        rango_min: new Decimal(precio).mul(0.9).toNumber(),
        rango_max: new Decimal(precio).mul(1.1).toNumber()
      }).eq('id', act.id);

      // 2. Limpiar e insertar APU Items en el catálogo
      await admin.from('catalogo_apu_items').delete().eq('catalogo_actividad_id', act.id);
      
      await admin.from('catalogo_apu_items').insert([
        { catalogo_actividad_id: act.id, tipo: 'material',  nombre: `Material - ${base.label}`,     unidad: act.unidad, cantidad: 1, precio_unitario: costoMat, orden: 1 },
        { catalogo_actividad_id: act.id, tipo: 'mano_obra', nombre: `Mano de obra - ${base.label}`, unidad: 'hr',        cantidad: 1, precio_unitario: costoMO,  orden: 2 },
        { catalogo_actividad_id: act.id, tipo: 'equipo',    nombre: `Equipo - ${base.label}`,       unidad: 'hr',        cantidad: 1, precio_unitario: costoEq,  orden: 3 }
      ]);

      ok++;
      if (ok % 50 === 0) console.log(`  ... procesadas ${ok} actividades`);
    } catch (e: any) {
      console.error(`  Error en ${act.nombre}: ${e.message}`);
    }
  }

  console.log(`\n  ✓ Éxito: ${ok} actividades del catálogo actualizadas.`);
}

main().catch(console.error);
