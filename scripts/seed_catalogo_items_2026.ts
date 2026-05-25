#!/usr/bin/env npx tsx
/**
 * SIPO — Seed masivo de ítems APU de referencia (catalogo_apu_items)
 * Colombia 2026 — Proporciones por categoría de capítulo
 *
 * Cubre TODAS las actividades del catálogo que aún no tienen "receta" APU.
 * Las actividades que ya tienen ítems se omiten salvo que se use --reset.
 *
 * Uso:
 *   npx tsx scripts/seed_catalogo_items_2026.ts
 *   npx tsx scripts/seed_catalogo_items_2026.ts --dry-run   (simula, no inserta)
 *   npx tsx scripts/seed_catalogo_items_2026.ts --reset     (borra los generados y re-inserta)
 *   npx tsx scripts/seed_catalogo_items_2026.ts --force     (inserta aunque ya existan ítems)
 *
 * Requiere en .env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * SMMLV 2026 = $1.423.500 | Factor prestacional estimado = 1.64
 * Jornales con prestaciones (costo real contratista):
 *   Ayudante de construcción  $52.000 × 1.64 ≈  $85.000/jor
 *   Oficial de construcción   $72.000 × 1.64 ≈ $118.000/jor
 *   Maestro de obra           $95.000 × 1.64 ≈ $156.000/jor
 *   Operador de maquinaria    $95.000 × 1.64 ≈ $156.000/jor
 *   Electricista / Plomero    $88.000 × 1.64 ≈ $144.000/jor
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

// ─── CLI flags ────────────────────────────────────────────────────────────────
const args  = process.argv.slice(2);
const DRY   = args.includes('--dry-run');
const RESET = args.includes('--reset');
const FORCE = args.includes('--force');

// ─── Supabase (service_role — omite RLS) ─────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

// ─── Tipos internos ───────────────────────────────────────────────────────────
type TipoItem = 'material' | 'mano_obra' | 'equipo' | 'herramienta_menor' | 'epp';

interface ItemTemplate {
  tipo:           TipoItem;
  nombre:         string;
  unidad:         string;
  /** Fracción del precio_referencia_nacional total */
  pct:            number;
}

interface PerfilAPU {
  /** Descripción del tipo de capítulo para logging */
  label:  string;
  items:  ItemTemplate[];
}


// ─── Perfiles por categoría de capítulo ──────────────────────────────────────
//
// Las proporciones siguen la metodología de costos directos del mercado colombiano 2025
// y prácticas de mercado colombiano 2026.  Cada perfil suma exactamente 100 %.
//
// Distribución típica por capítulo:
//  • Excavaciones/Movimiento de tierras: equipo pesado domina (60 %)
//  • Pilotaje / Cimentación: materiales dominan (62 %) — concreto + acero
//  • Estructura / Concretos: materiales (62 %) + MO significativa
//  • Mampostería / Muros: materiales (65 %) — bloques + mortero
//  • Cubierta / Techos: materiales (63 %)
//  • Impermeabilización: materiales (68 %)
//  • Acabados / Pisos / Enchapes / Pintura: materiales (63 %)
//  • Instalaciones eléctricas: MO alta (44 %) — mano calificada
//  • Instalaciones hidrosanitarias: MO alta (41 %)
//  • Vías / Pavimentos: equipo pesado (32 %) + materiales (45 %)
//  • Preliminares / Descapote / Campamento: equipo (35 %) + MO (43 %)
//  • Default (cualquier otro): materiales (60 %) + MO (33 %)

const PERFILES: Record<string, PerfilAPU> = {

  // ── Preliminares / Campamento / Cerramiento ─────────────────────────────────
  preliminar: {
    label: 'Preliminares / Campamento',
    items: [
      { tipo: 'material',         nombre: 'Materiales temporales y consumibles',   unidad: 'glb', pct: 0.15 },
      { tipo: 'mano_obra',        nombre: 'Oficial de construcción',               unidad: 'jor', pct: 0.25 },
      { tipo: 'mano_obra',        nombre: 'Ayudante de construcción',              unidad: 'jor', pct: 0.18 },
      { tipo: 'equipo',           nombre: 'Equipo y maquinaria menor',             unidad: 'h',   pct: 0.35 },
      { tipo: 'herramienta_menor',nombre: 'Herramienta menor (5 % MO)',            unidad: 'glb', pct: 0.05 },
      { tipo: 'epp',              nombre: 'Elementos de protección personal',      unidad: 'glb', pct: 0.02 },
    ],
  },

  // ── Excavaciones / Movimiento de tierras ────────────────────────────────────
  excav: {
    label: 'Excavaciones / Movimiento de tierras',
    items: [
      { tipo: 'material',         nombre: 'Materiales y rellenos seleccionados',  unidad: 'm³',  pct: 0.05 },
      { tipo: 'mano_obra',        nombre: 'Operador de maquinaria pesada',        unidad: 'jor', pct: 0.15 },
      { tipo: 'mano_obra',        nombre: 'Ayudante de construcción',             unidad: 'jor', pct: 0.13 },
      { tipo: 'equipo',           nombre: 'Retroexcavadora / volqueta / equipo',  unidad: 'h',   pct: 0.60 },
      { tipo: 'herramienta_menor',nombre: 'Herramienta menor (5 % MO)',           unidad: 'glb', pct: 0.04 },
      { tipo: 'epp',              nombre: 'Elementos de protección personal',     unidad: 'glb', pct: 0.03 },
    ],
  },

  // ── Pilotaje / Cimentación ──────────────────────────────────────────────────
  cimentacion: {
    label: 'Pilotaje / Cimentación',
    items: [
      { tipo: 'material',         nombre: 'Concreto, acero y formaleta de cimentación', unidad: 'glb', pct: 0.62 },
      { tipo: 'mano_obra',        nombre: 'Oficial maestro de obra',                    unidad: 'jor', pct: 0.16 },
      { tipo: 'mano_obra',        nombre: 'Ayudante de construcción',                   unidad: 'jor', pct: 0.12 },
      { tipo: 'equipo',           nombre: 'Vibrador de concreto / equipo de perforación',unidad: 'h', pct: 0.06 },
      { tipo: 'herramienta_menor',nombre: 'Herramienta menor (5 % MO)',                 unidad: 'glb', pct: 0.02 },
      { tipo: 'epp',              nombre: 'Elementos de protección personal',            unidad: 'glb', pct: 0.02 },
    ],
  },

  // ── Estructuras / Concretos ─────────────────────────────────────────────────
  estructura: {
    label: 'Estructura / Concretos',
    items: [
      { tipo: 'material',         nombre: 'Concreto estructural, acero y formaleta',  unidad: 'glb', pct: 0.62 },
      { tipo: 'mano_obra',        nombre: 'Oficial maestro de obra',                  unidad: 'jor', pct: 0.16 },
      { tipo: 'mano_obra',        nombre: 'Ayudante de construcción',                 unidad: 'jor', pct: 0.12 },
      { tipo: 'equipo',           nombre: 'Vibrador de concreto y formaleta metálica',unidad: 'h',   pct: 0.06 },
      { tipo: 'herramienta_menor',nombre: 'Herramienta menor (5 % MO)',               unidad: 'glb', pct: 0.02 },
      { tipo: 'epp',              nombre: 'Elementos de protección personal',          unidad: 'glb', pct: 0.02 },
    ],
  },

  // ── Mampostería / Muros / Divisiones ────────────────────────────────────────
  mampuesto: {
    label: 'Mampostería / Muros',
    items: [
      { tipo: 'material',         nombre: 'Bloques, ladrillo, mortero y cemento',  unidad: 'glb', pct: 0.65 },
      { tipo: 'mano_obra',        nombre: 'Oficial de mampostería',                unidad: 'jor', pct: 0.18 },
      { tipo: 'mano_obra',        nombre: 'Ayudante de construcción',              unidad: 'jor', pct: 0.10 },
      { tipo: 'equipo',           nombre: 'Mezcladora de mortero',                 unidad: 'h',   pct: 0.03 },
      { tipo: 'herramienta_menor',nombre: 'Herramienta menor (5 % MO)',            unidad: 'glb', pct: 0.02 },
      { tipo: 'epp',              nombre: 'Elementos de protección personal',      unidad: 'glb', pct: 0.02 },
    ],
  },

  // ── Cubierta / Techo ────────────────────────────────────────────────────────
  cubierta: {
    label: 'Cubierta / Techos',
    items: [
      { tipo: 'material',         nombre: 'Tejas, estructura metálica y accesorios',unidad: 'glb', pct: 0.63 },
      { tipo: 'mano_obra',        nombre: 'Oficial de cubierta',                    unidad: 'jor', pct: 0.20 },
      { tipo: 'mano_obra',        nombre: 'Ayudante de construcción',               unidad: 'jor', pct: 0.10 },
      { tipo: 'equipo',           nombre: 'Equipos de elevación y herramienta',     unidad: 'h',   pct: 0.03 },
      { tipo: 'herramienta_menor',nombre: 'Herramienta menor (5 % MO)',             unidad: 'glb', pct: 0.02 },
      { tipo: 'epp',              nombre: 'Elementos de protección personal',       unidad: 'glb', pct: 0.02 },
    ],
  },

  // ── Impermeabilización ──────────────────────────────────────────────────────
  imperme: {
    label: 'Impermeabilización',
    items: [
      { tipo: 'material',         nombre: 'Membrana impermeabilizante y accesorios', unidad: 'glb', pct: 0.68 },
      { tipo: 'mano_obra',        nombre: 'Oficial especializado en impermeabilización',unidad: 'jor', pct: 0.17 },
      { tipo: 'mano_obra',        nombre: 'Ayudante de construcción',               unidad: 'jor', pct: 0.09 },
      { tipo: 'equipo',           nombre: 'Soplete, soplete de gas y herramientas', unidad: 'h',   pct: 0.02 },
      { tipo: 'herramienta_menor',nombre: 'Herramienta menor (5 % MO)',             unidad: 'glb', pct: 0.02 },
      { tipo: 'epp',              nombre: 'Elementos de protección personal',       unidad: 'glb', pct: 0.02 },
    ],
  },

  // ── Acabados / Pisos / Enchapes / Pintura ────────────────────────────────────
  acabado: {
    label: 'Acabados / Pisos / Pintura',
    items: [
      { tipo: 'material',         nombre: 'Cerámicas, pintura, adhesivo y accesorios',unidad: 'glb', pct: 0.63 },
      { tipo: 'mano_obra',        nombre: 'Oficial de acabados',                    unidad: 'jor', pct: 0.20 },
      { tipo: 'mano_obra',        nombre: 'Ayudante de construcción',               unidad: 'jor', pct: 0.10 },
      { tipo: 'equipo',           nombre: 'Pulidora, equipo de corte y herramienta',unidad: 'h',   pct: 0.03 },
      { tipo: 'herramienta_menor',nombre: 'Herramienta menor (5 % MO)',             unidad: 'glb', pct: 0.02 },
      { tipo: 'epp',              nombre: 'Elementos de protección personal',       unidad: 'glb', pct: 0.02 },
    ],
  },

  // ── Instalaciones Eléctricas ─────────────────────────────────────────────────
  electric: {
    label: 'Instalaciones Eléctricas',
    items: [
      { tipo: 'material',         nombre: 'Cable, tubería conduit, tableros y accesorios',unidad: 'glb', pct: 0.48 },
      { tipo: 'mano_obra',        nombre: 'Técnico electricista certificado RETIE', unidad: 'jor', pct: 0.27 },
      { tipo: 'mano_obra',        nombre: 'Ayudante de electricista',               unidad: 'jor', pct: 0.17 },
      { tipo: 'equipo',           nombre: 'Herramienta eléctrica especializada',    unidad: 'h',   pct: 0.04 },
      { tipo: 'herramienta_menor',nombre: 'Herramienta menor (5 % MO)',             unidad: 'glb', pct: 0.02 },
      { tipo: 'epp',              nombre: 'Elementos de protección personal',       unidad: 'glb', pct: 0.02 },
    ],
  },

  // ── Instalaciones Hidrosanitarias / Plomería ────────────────────────────────
  hidrosanitario: {
    label: 'Instalaciones Hidrosanitarias',
    items: [
      { tipo: 'material',         nombre: 'Tubería PVC, sanitarios, grifería y accesorios',unidad: 'glb', pct: 0.50 },
      { tipo: 'mano_obra',        nombre: 'Técnico plomero / instalador sanitario', unidad: 'jor', pct: 0.26 },
      { tipo: 'mano_obra',        nombre: 'Ayudante de plomería',                   unidad: 'jor', pct: 0.15 },
      { tipo: 'equipo',           nombre: 'Herramienta especializada (fusionadora, etc.)',unidad: 'h', pct: 0.05 },
      { tipo: 'herramienta_menor',nombre: 'Herramienta menor (5 % MO)',             unidad: 'glb', pct: 0.02 },
      { tipo: 'epp',              nombre: 'Elementos de protección personal',       unidad: 'glb', pct: 0.02 },
    ],
  },

  // ── Vías / Pavimentos / Andenes ─────────────────────────────────────────────
  vias: {
    label: 'Vías / Pavimentos / Andenes',
    items: [
      { tipo: 'material',         nombre: 'Material granular, asfalto y concreto vial',unidad: 'glb', pct: 0.43 },
      { tipo: 'mano_obra',        nombre: 'Operador de maquinaria vial',            unidad: 'jor', pct: 0.12 },
      { tipo: 'mano_obra',        nombre: 'Oficial de vías',                        unidad: 'jor', pct: 0.10 },
      { tipo: 'equipo',           nombre: 'Compactador, finisher y equipo vial',    unidad: 'h',   pct: 0.30 },
      { tipo: 'herramienta_menor',nombre: 'Herramienta menor (5 % MO)',             unidad: 'glb', pct: 0.03 },
      { tipo: 'epp',              nombre: 'Elementos de protección personal',       unidad: 'glb', pct: 0.02 },
    ],
  },

  // ── Redes / Urbanismo / Obras exteriores ────────────────────────────────────
  redes: {
    label: 'Redes / Urbanismo',
    items: [
      { tipo: 'material',         nombre: 'Tubería, cámaras, cajas y accesorios',  unidad: 'glb', pct: 0.52 },
      { tipo: 'mano_obra',        nombre: 'Oficial de obras civiles',              unidad: 'jor', pct: 0.18 },
      { tipo: 'mano_obra',        nombre: 'Ayudante de construcción',              unidad: 'jor', pct: 0.14 },
      { tipo: 'equipo',           nombre: 'Equipo de excavación y compactación',   unidad: 'h',   pct: 0.12 },
      { tipo: 'herramienta_menor',nombre: 'Herramienta menor (5 % MO)',            unidad: 'glb', pct: 0.02 },
      { tipo: 'epp',              nombre: 'Elementos de protección personal',      unidad: 'glb', pct: 0.02 },
    ],
  },

  // ── Carpintería / Metálica / Vidrio ─────────────────────────────────────────
  carpinteria: {
    label: 'Carpintería / Metálica / Vidrio',
    items: [
      { tipo: 'material',         nombre: 'Madera, herrajes, vidrio o perfilería metálica',unidad: 'glb', pct: 0.60 },
      { tipo: 'mano_obra',        nombre: 'Oficial carpintero / metalistero',      unidad: 'jor', pct: 0.24 },
      { tipo: 'mano_obra',        nombre: 'Ayudante de obra',                      unidad: 'jor', pct: 0.10 },
      { tipo: 'equipo',           nombre: 'Sierra, pulidora y herramienta eléctrica',unidad: 'h', pct: 0.02 },
      { tipo: 'herramienta_menor',nombre: 'Herramienta menor (5 % MO)',            unidad: 'glb', pct: 0.02 },
      { tipo: 'epp',              nombre: 'Elementos de protección personal',      unidad: 'glb', pct: 0.02 },
    ],
  },

  // ── Señalización / Seguridad vial ────────────────────────────────────────────
  señalizacion: {
    label: 'Señalización / Seguridad vial',
    items: [
      { tipo: 'material',         nombre: 'Señales, demarcación y accesorios',     unidad: 'glb', pct: 0.58 },
      { tipo: 'mano_obra',        nombre: 'Oficial de señalización',               unidad: 'jor', pct: 0.22 },
      { tipo: 'mano_obra',        nombre: 'Ayudante de obra',                      unidad: 'jor', pct: 0.12 },
      { tipo: 'equipo',           nombre: 'Compresor, marcadora y herramienta',    unidad: 'h',   pct: 0.04 },
      { tipo: 'herramienta_menor',nombre: 'Herramienta menor (5 % MO)',            unidad: 'glb', pct: 0.02 },
      { tipo: 'epp',              nombre: 'Elementos de protección personal',      unidad: 'glb', pct: 0.02 },
    ],
  },

  // ── Default (aplica si ningún patrón coincide) ───────────────────────────────
  default: {
    label: 'General (default)',
    items: [
      { tipo: 'material',         nombre: 'Materiales principales',                unidad: 'glb', pct: 0.60 },
      { tipo: 'mano_obra',        nombre: 'Oficial de construcción',               unidad: 'jor', pct: 0.20 },
      { tipo: 'mano_obra',        nombre: 'Ayudante de construcción',              unidad: 'jor', pct: 0.13 },
      { tipo: 'equipo',           nombre: 'Equipo y maquinaria',                   unidad: 'h',   pct: 0.04 },
      { tipo: 'herramienta_menor',nombre: 'Herramienta menor (5 % MO)',            unidad: 'glb', pct: 0.02 },
      { tipo: 'epp',              nombre: 'Elementos de protección personal',      unidad: 'glb', pct: 0.01 },
    ],
  },
};

// ─── Lógica de selección de perfil según nombre del capítulo ─────────────────
//
// Busca la primera coincidencia en la lista de reglas (orden importa).
// Los patrones son insensibles a mayúsculas/tildes normalizando el texto.
//
const REGLAS: Array<{ patron: RegExp; perfil: string }> = [
  { patron: /prelim|campamento|cerramiento|descapote|limpieza|desmonte|tala/i,                                perfil: 'preliminar'     },
  { patron: /excav|terraplen|relleno|movimiento.*tierra|terreno|nivelac|corte.*terreno/i,                     perfil: 'excav'          },
  { patron: /pilot|ciment|zapata|viga.*cimentac|fundacion|fundament/i,                                       perfil: 'cimentacion'    },
  { patron: /concret|estruc|column|viga|losa|placa|entrepis|muros.*conc/i,                                   perfil: 'estructura'     },
  { patron: /mamposter|muro.*bloq|muro.*ladri|divisor|tabique|pared/i,                                       perfil: 'mampuesto'      },
  { patron: /cubierta|techo|teja|canal|cumbrero|estructura.*metalic.*techo/i,                                perfil: 'cubierta'       },
  { patron: /imperme|hidrofug|sello.*hidraul|membrana/i,                                                     perfil: 'imperme'        },
  { patron: /piso|enchap|baldos|ceramica|porcelan|alfombra|pared.*bano|pared.*cocina|pintura|estuco|revoque|enlucido|cielo.*raso|drywall|acabado/i,
                                                                                                              perfil: 'acabado'        },
  { patron: /electric|tomacorriente|ilumina|cable|tablero|contador|interruptor|acometida.*elec/i,             perfil: 'electric'       },
  { patron: /hidro|sanitari|acueducto|alcantaril|plomeria|tuberia.*agua|tuber.*san|desague|grifo|sanitaria/i, perfil: 'hidrosanitario' },
  { patron: /via|paviment|anden|sardinel|berma|cuneta|carretera|asfalto|concreto.*vial/i,                    perfil: 'vias'           },
  { patron: /red.*externa|red.*serv|urbanismo|alcantarillado|acueducto|gas.*domiciliario|redes/i,             perfil: 'redes'          },
  { patron: /carpinter|madera|vidrio|ventana|puerta|marco|metalic|metalica|aluminio/i,                       perfil: 'carpinteria'    },
  { patron: /señaliz|demarca|señal|valla|señalizacion/i,                                                     perfil: 'señalizacion'   },
];

function seleccionarPerfil(capNombre: string): PerfilAPU {
  const texto = capNombre.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  for (const { patron, perfil } of REGLAS) {
    if (patron.test(texto)) return PERFILES[perfil];
  }
  return PERFILES.default;
}

// ─── Construye los items a insertar para una actividad ────────────────────────
function buildItems(
  actividad_id: string,
  precio: number,
  capNombre: string,
): Record<string, unknown>[] {
  const perfil = seleccionarPerfil(capNombre);
  return perfil.items.map((tpl, idx) => {
    const precio_unitario = Math.round(precio * tpl.pct);
    return {
      catalogo_actividad_id: actividad_id,
      tipo:                  tpl.tipo,
      nombre:                tpl.nombre,
      unidad:                tpl.unidad,
      cantidad:              1,
      precio_unitario,
      orden:                 idx + 1,
    };
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) { return n.toLocaleString('es-CO'); }

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  SIPO — Seed masivo catalogo_apu_items 2026                 ║');
  console.log(`║  Modo: ${DRY ? 'DRY-RUN (no escribe)' : RESET ? 'RESET (borra + re-inserta)' : FORCE ? 'FORCE (inserta sobre existentes)' : 'NORMAL (solo actividades sin ítems)'}                            ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // 1. Obtener todas las actividades con el nombre de su capítulo ──────────────
  console.log('▸ Cargando actividades del catálogo...');
  const { data: actividades, error: errActs } = await supabase
    .from('catalogo_actividades')
    .select(`
      id,
      codigo,
      nombre,
      precio_referencia_nacional,
      catalogo_capitulos!inner(nombre, tipo_obra)
    `);

  if (errActs || !actividades) {
    console.error('✗ Error al cargar actividades:', errActs);
    process.exit(1);
  }
  console.log(`  → ${fmt(actividades.length)} actividades encontradas\n`);

  // 2. Si --reset: borrar TODOS los ítems del catálogo (es solo data de referencia) ─
  if (RESET && !DRY) {
    console.log('▸ [RESET] Vaciando catalogo_apu_items (data de referencia)...');
    // Usamos gt('id', '00000000-0000-0000-0000-000000000000') para evitar que
    // Supabase rechace un DELETE sin filtro por seguridad de la API REST.
    const { error: errDel, count } = await supabase
      .from('catalogo_apu_items')
      .delete({ count: 'exact' })
      .gt('orden', -1);
    if (errDel) {
      console.error('  ✗ Error al eliminar:', errDel);
      process.exit(1);
    }
    console.log(`  → ${fmt(count ?? 0)} ítems eliminados\n`);
  }

  // 3. Saber qué actividades YA tienen ítems (saltarlas salvo --force/--reset) ─
  let conItems = new Set<string>();
  if (!FORCE && !RESET) {
    console.log('▸ Identificando actividades que ya tienen ítems...');
    const { data: existentes, error: errEx } = await supabase
      .from('catalogo_apu_items')
      .select('catalogo_actividad_id');
    if (errEx) {
      console.error('  ✗ Error:', errEx);
      process.exit(1);
    }
    for (const e of existentes ?? []) conItems.add(e.catalogo_actividad_id);
    console.log(`  → ${fmt(conItems.size)} actividades ya tienen ítems (serán omitidas)\n`);
  }

  // 4. Filtrar pendientes ───────────────────────────────────────────────────────
  const pendientes = actividades.filter(a => !conItems.has(a.id));
  console.log(`▸ Actividades a procesar: ${fmt(pendientes.length)}`);

  if (pendientes.length === 0) {
    console.log('\n✓ Nada que hacer — todas las actividades ya tienen ítems APU.');
    console.log('  Para re-generar, usa: --reset\n');
    return;
  }

  // 5. Agrupar por perfil para estadísticas ────────────────────────────────────
  const stats: Record<string, number> = {};

  // 6. Construir todos los rows a insertar ─────────────────────────────────────
  const rows: Record<string, unknown>[] = [];

  for (const act of pendientes) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cap = (act as any).catalogo_capitulos;
    const capNombre = cap?.nombre ?? '';
    const precio    = Number(act.precio_referencia_nacional);
    const perfil    = seleccionarPerfil(capNombre);

    // Acumular estadísticas
    stats[perfil.label] = (stats[perfil.label] ?? 0) + 1;

    const items = buildItems(act.id, precio, capNombre);
    rows.push(...items);
  }

  // 7. Mostrar resumen antes de insertar ───────────────────────────────────────
  console.log('\n  Distribución por perfil:');
  for (const [label, count] of Object.entries(stats).sort((a,b) => b[1] - a[1])) {
    console.log(`    ${label.padEnd(38)} → ${String(count).padStart(3)} actividades`);
  }
  console.log(`\n  Total ítems a insertar: ${fmt(rows.length)} (${fmt(pendientes.length)} actividades × ~${(rows.length/pendientes.length).toFixed(1)} ítems)`);

  if (DRY) {
    console.log('\n⚑ DRY-RUN — No se insertó nada. Quita --dry-run para ejecutar.\n');
    return;
  }

  // 8. Insertar en lotes de 500 para no saturar el API ─────────────────────────
  const BATCH = 500;
  let insertados = 0;
  let errores    = 0;

  console.log('\n▸ Insertando...');
  for (let i = 0; i < rows.length; i += BATCH) {
    const lote = rows.slice(i, i + BATCH);
    const { error } = await supabase.from('catalogo_apu_items').insert(lote);
    if (error) {
      console.error(`  ✗ Lote ${i}–${i + lote.length} ERROR:`, error.message);
      errores += lote.length;
    } else {
      insertados += lote.length;
      process.stdout.write(`  ✓ ${fmt(insertados)} de ${fmt(rows.length)} ítems insertados\r`);
    }
  }

  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log(`║  Resultado final                                             ║`);
  console.log(`║    Actividades procesadas : ${String(pendientes.length).padStart(5)}                           ║`);
  console.log(`║    Ítems insertados       : ${String(insertados).padStart(5)}                           ║`);
  if (errores > 0)
    console.log(`║    Ítems con error        : ${String(errores).padStart(5)}  ← revisar logs            ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  if (errores === 0) {
    console.log('✓ Seed completado exitosamente.');
    console.log('  La dona de Costos Directos del Dashboard ya puede calcular % reales.\n');
  } else {
    console.log('⚠ Seed completado con errores. Revisa los mensajes anteriores.\n');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
