#!/usr/bin/env npx tsx
/**
 * SIPO — Reimportación de capítulos huérfanos del catálogo
 *
 * Para cada actividad que no tiene catalogo_apu_items:
 *  1. Determina qué perfil APU corresponde según el nombre del capítulo.
 *  2. Calcula precios proporcionales desde precio_referencia_nacional.
 *  3. Inserta los items — idempotente: omite actividades que ya tienen items.
 *
 * Uso:
 *   npx tsx scripts/reimportar-capitulos-huerfanos.ts
 *   npx tsx scripts/reimportar-capitulos-huerfanos.ts --dry-run
 *   npx tsx scripts/reimportar-capitulos-huerfanos.ts --force   (reimporta incluso si ya hay items)
 *
 * Requiere en .env: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_DB_PASSWORD
 */

import { Client } from 'pg';
import Decimal    from 'decimal.js';
import * as path  from 'path';
import * as url   from 'url';
import * as dotenv from 'dotenv';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

const args   = process.argv.slice(2);
const DRY    = args.includes('--dry-run');
const FORCE  = args.includes('--force');

// ─── Tipos ────────────────────────────────────────────────────────────────────

type TipoItem = 'material' | 'mano_obra' | 'equipo' | 'herramienta_menor' | 'epp';

interface ItemTemplate {
  tipo:   TipoItem;
  nombre: string;
  unidad: string;
  /** Fracción del precio_referencia_nacional */
  pct:    number;
}

interface PerfilAPU {
  label: string;
  items: ItemTemplate[];
}

interface ActividadHuerfana {
  actividad_id:    string;
  actividad_codigo: string;
  actividad_nombre: string;
  precio_ref:      number;
  capitulo_nombre: string;
  tipo_obra:       string;
  total_items:     number;
}

// ─── Perfiles APU por categoría de capítulo ───────────────────────────────────
// Proporciones del mercado colombiano 2025 — cada perfil suma 100 %.

const PERFILES: Record<string, PerfilAPU> = {
  preliminar: {
    label: 'Preliminares / Campamento',
    items: [
      { tipo: 'material',          nombre: 'Materiales temporales y consumibles',   unidad: 'glb', pct: 0.15 },
      { tipo: 'mano_obra',         nombre: 'Oficial de construcción',               unidad: 'jor', pct: 0.25 },
      { tipo: 'mano_obra',         nombre: 'Ayudante de construcción',              unidad: 'jor', pct: 0.18 },
      { tipo: 'equipo',            nombre: 'Equipo y maquinaria menor',             unidad: 'h',   pct: 0.35 },
      { tipo: 'herramienta_menor', nombre: 'Herramienta menor (5 % MO)',            unidad: 'glb', pct: 0.05 },
      { tipo: 'epp',               nombre: 'Elementos de protección personal',      unidad: 'glb', pct: 0.02 },
    ],
  },
  excav: {
    label: 'Excavaciones / Movimiento de tierras',
    items: [
      { tipo: 'material',          nombre: 'Materiales y rellenos seleccionados',   unidad: 'm³',  pct: 0.05 },
      { tipo: 'mano_obra',         nombre: 'Operador de maquinaria pesada',         unidad: 'jor', pct: 0.15 },
      { tipo: 'mano_obra',         nombre: 'Ayudante de construcción',              unidad: 'jor', pct: 0.13 },
      { tipo: 'equipo',            nombre: 'Retroexcavadora / volqueta / equipo',   unidad: 'h',   pct: 0.60 },
      { tipo: 'herramienta_menor', nombre: 'Herramienta menor (5 % MO)',            unidad: 'glb', pct: 0.04 },
      { tipo: 'epp',               nombre: 'Elementos de protección personal',      unidad: 'glb', pct: 0.03 },
    ],
  },
  cimentacion: {
    label: 'Pilotaje / Cimentación',
    items: [
      { tipo: 'material',          nombre: 'Concreto, acero y formaleta de cimentación',   unidad: 'glb', pct: 0.62 },
      { tipo: 'mano_obra',         nombre: 'Oficial maestro de obra',                      unidad: 'jor', pct: 0.16 },
      { tipo: 'mano_obra',         nombre: 'Ayudante de construcción',                     unidad: 'jor', pct: 0.12 },
      { tipo: 'equipo',            nombre: 'Vibrador de concreto / equipo de perforación', unidad: 'h',   pct: 0.06 },
      { tipo: 'herramienta_menor', nombre: 'Herramienta menor (5 % MO)',                   unidad: 'glb', pct: 0.02 },
      { tipo: 'epp',               nombre: 'Elementos de protección personal',              unidad: 'glb', pct: 0.02 },
    ],
  },
  estructura: {
    label: 'Estructura / Concretos',
    items: [
      { tipo: 'material',          nombre: 'Concreto estructural, acero y formaleta',   unidad: 'glb', pct: 0.62 },
      { tipo: 'mano_obra',         nombre: 'Oficial maestro de obra',                   unidad: 'jor', pct: 0.16 },
      { tipo: 'mano_obra',         nombre: 'Ayudante de construcción',                  unidad: 'jor', pct: 0.12 },
      { tipo: 'equipo',            nombre: 'Vibrador de concreto y formaleta metálica', unidad: 'h',   pct: 0.06 },
      { tipo: 'herramienta_menor', nombre: 'Herramienta menor (5 % MO)',                unidad: 'glb', pct: 0.02 },
      { tipo: 'epp',               nombre: 'Elementos de protección personal',           unidad: 'glb', pct: 0.02 },
    ],
  },
  mampuesto: {
    label: 'Mampostería / Muros',
    items: [
      { tipo: 'material',          nombre: 'Bloques, ladrillo, mortero y cemento',  unidad: 'glb', pct: 0.65 },
      { tipo: 'mano_obra',         nombre: 'Oficial de mampostería',                unidad: 'jor', pct: 0.18 },
      { tipo: 'mano_obra',         nombre: 'Ayudante de construcción',              unidad: 'jor', pct: 0.10 },
      { tipo: 'equipo',            nombre: 'Mezcladora de mortero',                 unidad: 'h',   pct: 0.03 },
      { tipo: 'herramienta_menor', nombre: 'Herramienta menor (5 % MO)',            unidad: 'glb', pct: 0.02 },
      { tipo: 'epp',               nombre: 'Elementos de protección personal',      unidad: 'glb', pct: 0.02 },
    ],
  },
  cubierta: {
    label: 'Cubierta / Techos',
    items: [
      { tipo: 'material',          nombre: 'Tejas, estructura metálica y accesorios', unidad: 'glb', pct: 0.63 },
      { tipo: 'mano_obra',         nombre: 'Oficial de cubierta',                     unidad: 'jor', pct: 0.20 },
      { tipo: 'mano_obra',         nombre: 'Ayudante de construcción',                unidad: 'jor', pct: 0.10 },
      { tipo: 'equipo',            nombre: 'Equipos de elevación y herramienta',      unidad: 'h',   pct: 0.03 },
      { tipo: 'herramienta_menor', nombre: 'Herramienta menor (5 % MO)',              unidad: 'glb', pct: 0.02 },
      { tipo: 'epp',               nombre: 'Elementos de protección personal',        unidad: 'glb', pct: 0.02 },
    ],
  },
  imperme: {
    label: 'Impermeabilización',
    items: [
      { tipo: 'material',          nombre: 'Membrana impermeabilizante y accesorios',    unidad: 'glb', pct: 0.68 },
      { tipo: 'mano_obra',         nombre: 'Oficial especializado en impermeabilización', unidad: 'jor', pct: 0.17 },
      { tipo: 'mano_obra',         nombre: 'Ayudante de construcción',                   unidad: 'jor', pct: 0.09 },
      { tipo: 'equipo',            nombre: 'Soplete de gas y herramientas',              unidad: 'h',   pct: 0.02 },
      { tipo: 'herramienta_menor', nombre: 'Herramienta menor (5 % MO)',                 unidad: 'glb', pct: 0.02 },
      { tipo: 'epp',               nombre: 'Elementos de protección personal',           unidad: 'glb', pct: 0.02 },
    ],
  },
  acabado: {
    label: 'Acabados / Pisos / Pintura',
    items: [
      { tipo: 'material',          nombre: 'Cerámicas, pintura, adhesivo y accesorios', unidad: 'glb', pct: 0.63 },
      { tipo: 'mano_obra',         nombre: 'Oficial de acabados',                       unidad: 'jor', pct: 0.20 },
      { tipo: 'mano_obra',         nombre: 'Ayudante de construcción',                  unidad: 'jor', pct: 0.10 },
      { tipo: 'equipo',            nombre: 'Pulidora, equipo de corte y herramienta',   unidad: 'h',   pct: 0.03 },
      { tipo: 'herramienta_menor', nombre: 'Herramienta menor (5 % MO)',                unidad: 'glb', pct: 0.02 },
      { tipo: 'epp',               nombre: 'Elementos de protección personal',          unidad: 'glb', pct: 0.02 },
    ],
  },
  electric: {
    label: 'Instalaciones Eléctricas',
    items: [
      { tipo: 'material',          nombre: 'Cable, tubería conduit, tableros y accesorios', unidad: 'glb', pct: 0.48 },
      { tipo: 'mano_obra',         nombre: 'Técnico electricista certificado RETIE',        unidad: 'jor', pct: 0.27 },
      { tipo: 'mano_obra',         nombre: 'Ayudante de electricista',                      unidad: 'jor', pct: 0.17 },
      { tipo: 'equipo',            nombre: 'Herramienta eléctrica especializada',           unidad: 'h',   pct: 0.04 },
      { tipo: 'herramienta_menor', nombre: 'Herramienta menor (5 % MO)',                    unidad: 'glb', pct: 0.02 },
      { tipo: 'epp',               nombre: 'Elementos de protección personal',              unidad: 'glb', pct: 0.02 },
    ],
  },
  hidrosanitario: {
    label: 'Instalaciones Hidrosanitarias',
    items: [
      { tipo: 'material',          nombre: 'Tubería PVC, sanitarios, grifería y accesorios', unidad: 'glb', pct: 0.50 },
      { tipo: 'mano_obra',         nombre: 'Técnico plomero / instalador sanitario',         unidad: 'jor', pct: 0.26 },
      { tipo: 'mano_obra',         nombre: 'Ayudante de plomería',                           unidad: 'jor', pct: 0.15 },
      { tipo: 'equipo',            nombre: 'Herramienta especializada (fusionadora, etc.)',  unidad: 'h',   pct: 0.05 },
      { tipo: 'herramienta_menor', nombre: 'Herramienta menor (5 % MO)',                     unidad: 'glb', pct: 0.02 },
      { tipo: 'epp',               nombre: 'Elementos de protección personal',               unidad: 'glb', pct: 0.02 },
    ],
  },
  vias: {
    label: 'Vías / Pavimentos / Andenes',
    items: [
      { tipo: 'material',          nombre: 'Material granular, asfalto y concreto vial', unidad: 'glb', pct: 0.43 },
      { tipo: 'mano_obra',         nombre: 'Operador de maquinaria vial',                unidad: 'jor', pct: 0.12 },
      { tipo: 'mano_obra',         nombre: 'Oficial de vías',                            unidad: 'jor', pct: 0.10 },
      { tipo: 'equipo',            nombre: 'Compactador, finisher y equipo vial',        unidad: 'h',   pct: 0.30 },
      { tipo: 'herramienta_menor', nombre: 'Herramienta menor (5 % MO)',                 unidad: 'glb', pct: 0.03 },
      { tipo: 'epp',               nombre: 'Elementos de protección personal',           unidad: 'glb', pct: 0.02 },
    ],
  },
  redes: {
    label: 'Redes / Urbanismo',
    items: [
      { tipo: 'material',          nombre: 'Tubería, cámaras, cajas y accesorios',  unidad: 'glb', pct: 0.52 },
      { tipo: 'mano_obra',         nombre: 'Oficial de obras civiles',              unidad: 'jor', pct: 0.18 },
      { tipo: 'mano_obra',         nombre: 'Ayudante de construcción',              unidad: 'jor', pct: 0.14 },
      { tipo: 'equipo',            nombre: 'Equipo de excavación y compactación',   unidad: 'h',   pct: 0.12 },
      { tipo: 'herramienta_menor', nombre: 'Herramienta menor (5 % MO)',            unidad: 'glb', pct: 0.02 },
      { tipo: 'epp',               nombre: 'Elementos de protección personal',      unidad: 'glb', pct: 0.02 },
    ],
  },
  carpinteria: {
    label: 'Carpintería / Metálica / Vidrio',
    items: [
      { tipo: 'material',          nombre: 'Madera, herrajes, vidrio o perfilería metálica', unidad: 'glb', pct: 0.60 },
      { tipo: 'mano_obra',         nombre: 'Oficial carpintero / metalistero',               unidad: 'jor', pct: 0.24 },
      { tipo: 'mano_obra',         nombre: 'Ayudante de obra',                               unidad: 'jor', pct: 0.10 },
      { tipo: 'equipo',            nombre: 'Sierra, pulidora y herramienta eléctrica',       unidad: 'h',   pct: 0.02 },
      { tipo: 'herramienta_menor', nombre: 'Herramienta menor (5 % MO)',                     unidad: 'glb', pct: 0.02 },
      { tipo: 'epp',               nombre: 'Elementos de protección personal',               unidad: 'glb', pct: 0.02 },
    ],
  },
  señalizacion: {
    label: 'Señalización / Seguridad vial',
    items: [
      { tipo: 'material',          nombre: 'Señales, demarcación y accesorios',  unidad: 'glb', pct: 0.58 },
      { tipo: 'mano_obra',         nombre: 'Oficial de señalización',            unidad: 'jor', pct: 0.22 },
      { tipo: 'mano_obra',         nombre: 'Ayudante de obra',                   unidad: 'jor', pct: 0.12 },
      { tipo: 'equipo',            nombre: 'Compresor, marcadora y herramienta', unidad: 'h',   pct: 0.04 },
      { tipo: 'herramienta_menor', nombre: 'Herramienta menor (5 % MO)',         unidad: 'glb', pct: 0.02 },
      { tipo: 'epp',               nombre: 'Elementos de protección personal',   unidad: 'glb', pct: 0.02 },
    ],
  },
  climatizacion: {
    label: 'Climatización / Aire Acondicionado',
    items: [
      { tipo: 'material',          nombre: 'Unidades, ductos, refrigerante y accesorios',   unidad: 'glb', pct: 0.55 },
      { tipo: 'mano_obra',         nombre: 'Técnico HVAC certificado',                      unidad: 'jor', pct: 0.25 },
      { tipo: 'mano_obra',         nombre: 'Ayudante técnico',                              unidad: 'jor', pct: 0.12 },
      { tipo: 'equipo',            nombre: 'Herramienta especializada HVAC',                unidad: 'h',   pct: 0.04 },
      { tipo: 'herramienta_menor', nombre: 'Herramienta menor (5 % MO)',                    unidad: 'glb', pct: 0.02 },
      { tipo: 'epp',               nombre: 'Elementos de protección personal',              unidad: 'glb', pct: 0.02 },
    ],
  },
  contraincendio: {
    label: 'Redes contra incendio',
    items: [
      { tipo: 'material',          nombre: 'Tubería HG, rociadores, detectores y accesorios', unidad: 'glb', pct: 0.56 },
      { tipo: 'mano_obra',         nombre: 'Técnico contra incendio NFPA',                    unidad: 'jor', pct: 0.24 },
      { tipo: 'mano_obra',         nombre: 'Ayudante técnico',                                unidad: 'jor', pct: 0.12 },
      { tipo: 'equipo',            nombre: 'Herramienta especializada',                       unidad: 'h',   pct: 0.04 },
      { tipo: 'herramienta_menor', nombre: 'Herramienta menor (5 % MO)',                      unidad: 'glb', pct: 0.02 },
      { tipo: 'epp',               nombre: 'Elementos de protección personal',                unidad: 'glb', pct: 0.02 },
    ],
  },
  default: {
    label: 'General (default)',
    items: [
      { tipo: 'material',          nombre: 'Materiales principales',      unidad: 'glb', pct: 0.60 },
      { tipo: 'mano_obra',         nombre: 'Oficial de construcción',     unidad: 'jor', pct: 0.20 },
      { tipo: 'mano_obra',         nombre: 'Ayudante de construcción',    unidad: 'jor', pct: 0.13 },
      { tipo: 'equipo',            nombre: 'Equipo y maquinaria',         unidad: 'h',   pct: 0.04 },
      { tipo: 'herramienta_menor', nombre: 'Herramienta menor (5 % MO)', unidad: 'glb', pct: 0.02 },
      { tipo: 'epp',               nombre: 'Elementos de protección personal', unidad: 'glb', pct: 0.01 },
    ],
  },
};

// ─── Reglas de selección de perfil (orden importa) ────────────────────────────

const REGLAS: Array<{ patron: RegExp; perfil: string }> = [
  { patron: /prelim|campamento|cerramiento|descapote|limpieza|desmonte|tala/i,                              perfil: 'preliminar'     },
  { patron: /excav|terraplen|relleno|movimiento.*tierra|terreno|nivelac|corte.*terreno/i,                   perfil: 'excav'          },
  { patron: /pilot|ciment|zapata|viga.*cimentac|fundacion|fundament/i,                                     perfil: 'cimentacion'    },
  { patron: /concret|estruc|column|viga|losa|placa|entrepis|muros.*conc/i,                                 perfil: 'estructura'     },
  { patron: /mamposter|muro.*bloq|muro.*ladri|divisor|tabique|pared/i,                                     perfil: 'mampuesto'      },
  { patron: /cubierta|techo|teja|canal|cumbrero|estructura.*metalic.*techo/i,                              perfil: 'cubierta'       },
  { patron: /imperme|hidrofug|sello.*hidraul|membrana/i,                                                   perfil: 'imperme'        },
  { patron: /piso|enchap|baldos|ceramica|porcelan|pintura|estuco|revoque|enlucido|cielo.*raso|drywall|acabado|pañete/i, perfil: 'acabado' },
  { patron: /electric|tablero|luminaria|iluminac|tomacorr|breaker|red.*datos|red.*voz|cctv|cámara.*ip/i,  perfil: 'electric'       },
  { patron: /hidrosanitari|plomeria|agua.*potable|sanitari|desague|alcantaril|gas.*domicil|aparato.*sanit/i,perfil: 'hidrosanitario' },
  { patron: /vial|paviment|asfalto|carpeta|subbase|base.*granul|imprimac|demarcac|anden|ciclorrut|sardinel/i,perfil: 'vias'          },
  { patron: /señaliz|señal.*vertical|señal.*horizont|seguridad.*vial|tachon|reductor.*velocidad/i,         perfil: 'señalizacion'   },
  { patron: /urban|espacio.*public|mobiliario|zona.*verde|arbori/i,                                        perfil: 'redes'          },
  { patron: /red.*incend|contraincend|rociador|sprinkler|extintor|detector.*humo/i,                        perfil: 'contraincendio' },
  { patron: /climat|aire.*acondicion|hvac|vrf|split|chiller|ducto/i,                                      perfil: 'climatizacion'  },
  { patron: /carpinter|puerta|ventana|barandill|closet|meson|herreria|metalic|vidrio/i,                    perfil: 'carpinteria'    },
  { patron: /aparato|accesorio.*sanit|lavamanos|sanitario|ducha|lavaplato|calentador/i,                    perfil: 'hidrosanitario' },
  { patron: /exterior|cerramiento.*perimetral|parqueadero|sendero|jardin/i,                                perfil: 'redes'          },
  { patron: /aseo|entrega|limpieza.*final|retiro.*escombro/i,                                              perfil: 'preliminar'     },
];

function seleccionarPerfil(capituloNombre: string): PerfilAPU {
  const nombreNorm = capituloNombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

  for (const regla of REGLAS) {
    if (regla.patron.test(nombreNorm)) {
      return PERFILES[regla.perfil];
    }
  }
  return PERFILES.default;
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

// ─── Lógica principal ─────────────────────────────────────────────────────────

async function reimportar(client: Client): Promise<void> {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║   SIPO — Reimportación Capítulos Huérfanos         ║');
  if (DRY) {
    console.log('║   ⚠️  MODO DRY-RUN — sin cambios en BD             ║');
  }
  if (FORCE) {
    console.log('║   ⚠️  MODO --force — reimporta aunque ya haya items ║');
  }
  console.log('╚════════════════════════════════════════════════════╝\n');

  // ── 1. Obtener actividades candidatas ─────────────────────────────────────
  const condicionItems = FORCE
    ? 'TRUE'
    : 'COUNT(cai.id) = 0';

  const { rows: actividades } = await client.query<ActividadHuerfana>(`
    SELECT
      ca.id                              AS actividad_id,
      ca.codigo                          AS actividad_codigo,
      ca.nombre                          AS actividad_nombre,
      COALESCE(ca.precio_referencia_nacional, 0) AS precio_ref,
      cc.nombre                          AS capitulo_nombre,
      cc.tipo_obra,
      COUNT(cai.id)::int                 AS total_items
    FROM catalogo_actividades ca
    JOIN catalogo_capitulos cc ON cc.id = ca.catalogo_capitulo_id
    LEFT JOIN catalogo_apu_items cai ON cai.catalogo_actividad_id = ca.id
    GROUP BY ca.id, ca.codigo, ca.nombre, ca.precio_referencia_nacional,
             cc.nombre, cc.tipo_obra
    HAVING ${condicionItems}
    ORDER BY cc.tipo_obra, ca.codigo
  `);

  if (actividades.length === 0) {
    if (FORCE) {
      console.log('ℹ️  No hay actividades en el catálogo.\n');
    } else {
      console.log('✅ No hay actividades huérfanas — el catálogo está completo.\n');
    }
    return;
  }

  const labelCandidatas = FORCE ? 'actividades a reimportar' : 'actividades huérfanas';
  console.log(`🔍 Encontradas ${actividades.length} ${labelCandidatas}\n`);

  // ── 2. Procesar cada actividad ────────────────────────────────────────────
  let totalInsertadas   = 0;
  let actProcesadas     = 0;
  let actConPrecioZero  = 0;
  const PRECIO_FALLBACK = 50_000;

  await client.query('BEGIN');
  try {
    for (const act of actividades) {
      const perfil = seleccionarPerfil(act.capitulo_nombre);

      // Usar precio de referencia o fallback si es 0
      const precioBase = act.precio_ref > 0 ? act.precio_ref : PRECIO_FALLBACK;
      if (act.precio_ref === 0) {
        actConPrecioZero++;
      }

      const priceDecimal = new Decimal(precioBase);

      if (!DRY) {
        // Borrar items existentes si --force
        if (FORCE && act.total_items > 0) {
          await client.query(
            'DELETE FROM catalogo_apu_items WHERE catalogo_actividad_id = $1',
            [act.actividad_id]
          );
        }

        // Insertar items del perfil
        for (let i = 0; i < perfil.items.length; i++) {
          const tpl   = perfil.items[i];
          const precio = priceDecimal
            .mul(new Decimal(tpl.pct))
            .toDecimalPlaces(2)
            .toNumber();

          // precio_unitario debe ser > 0 — protección ante precios extremadamente pequeños
          const precioFinal = precio < 1 ? 1 : precio;

          await client.query(
            `INSERT INTO catalogo_apu_items
               (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [act.actividad_id, tpl.tipo, tpl.nombre, tpl.unidad, 1, precioFinal, i + 1]
          );
          totalInsertadas++;
        }
      }

      actProcesadas++;

      const icon     = act.precio_ref === 0 ? '⚠️ ' : '✅';
      const precioFmt = act.precio_ref > 0
        ? `$${act.precio_ref.toLocaleString('es-CO')}`
        : `fallback $${PRECIO_FALLBACK.toLocaleString('es-CO')}`;
      const modoStr  = DRY ? '[DRY] ' : '';
      console.log(
        `  ${icon} ${modoStr}${act.actividad_codigo.padEnd(16)} ` +
        `| ${perfil.label.padEnd(32)} ` +
        `| ${precioFmt}`
      );
    }

    if (!DRY) {
      await client.query('COMMIT');
    } else {
      await client.query('ROLLBACK');
    }

    // ── 3. Resumen ──────────────────────────────────────────────────────────
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║                  RESUMEN                           ║');
    console.log('╚════════════════════════════════════════════════════╝');
    console.log(`  Actividades procesadas : ${actProcesadas}`);
    if (!DRY) {
      console.log(`  Items insertados      : ${totalInsertadas}`);
    }
    if (actConPrecioZero > 0) {
      console.log(`  ⚠️  Con precio=0 (fallback $${PRECIO_FALLBACK.toLocaleString('es-CO')}): ${actConPrecioZero}`);
      console.log(`     → Corrige precios con: npx tsx scripts/master-fill-all-prices.ts`);
    }

    if (DRY) {
      console.log('\n  (Sin cambios en BD — modo dry-run)');
      console.log('  Para aplicar: npx tsx scripts/reimportar-capitulos-huerfanos.ts');
    } else {
      console.log('\n🎉 Reimportación completada.');
      console.log('   Verifica con: npx tsx scripts/diagnostico-capitulos-huerfanos.ts\n');
    }

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

// ─── Entry point ──────────────────────────────────────────────────────────────

(async () => {
  const client = await conectar();
  try {
    await reimportar(client);
  } catch (err) {
    console.error('\n❌ Error durante la reimportación:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
