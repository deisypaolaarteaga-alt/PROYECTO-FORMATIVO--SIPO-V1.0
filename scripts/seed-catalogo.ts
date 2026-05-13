#!/usr/bin/env npx tsx
/**
 * SIPO — Seed del Catálogo Base de Actividades
 * Precios de referencia Colombia 2025 (aprox. mercado nacional).
 *
 * Uso:
 *   npx tsx scripts/seed-catalogo.ts
 *   npx tsx scripts/seed-catalogo.ts --dry-run   (solo valida, no inserta)
 *   npx tsx scripts/seed-catalogo.ts --reset      (borra y re-inserta todo)
 *
 * Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env
 */

import { Client } from 'pg';
import Decimal from 'decimal.js';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';
import * as dotenv from 'dotenv';

// Compatible con CJS (tsx) y ESM nativo
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

// ─── Configuración Decimal.js para valores monetarios ────────────────────────
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

// ─── Tipos internos del seed ──────────────────────────────────────────────────
interface CapituloSeed {
  codigo: string;
  nombre: string;
  tipo_obra: string;
  numero: number;
  descripcion?: string;
  actividades: ActividadSeed[];
}

interface ActividadSeed {
  codigo: string;
  nombre: string;
  unidad: string;
  /** Precio nacional de referencia COP 2025 */
  precio: number;
  /** Rango inferior (ciudad económica) */
  min: number;
  /** Rango superior (ciudad cara o zona de difícil acceso) */
  max: number;
  descripcion?: string;
}

// ─── CATÁLOGO ─────────────────────────────────────────────────────────────────
// Precios unitarios incluyen: material + mano de obra + equipo (APU completo).
// Base: Bogotá D.C. Rango: min=ciudad pequeña, max=ciudad cara/insular/Pacífico.
// SMMLV 2025 = $1,423,500 | Jornal oficial maestro ~$85,000/día
// ─────────────────────────────────────────────────────────────────────────────

const CATALOGO: CapituloSeed[] = [

  // ══════════════════════════════════════════════════════════════════════════════
  // EDIFICACIONES — RESIDENCIAL
  // ══════════════════════════════════════════════════════════════════════════════

  {
    codigo: 'RES-01',
    nombre: 'PRELIMINARES Y DESCAPOTE',
    tipo_obra: 'residencial',
    numero: 1,
    descripcion: 'Trabajos preparatorios previos a la construcción: descapote, localización, cerramiento.',
    actividades: [
      {
        codigo: 'RES-01-001',
        nombre: 'Localización y replanteo topográfico',
        unidad: 'm²',
        precio: 3_500, min: 2_800, max: 5_200,
        descripcion: 'Trazado ejes, nivelación y estacado con topógrafo.',
      },
      {
        codigo: 'RES-01-002',
        nombre: 'Descapote y limpieza terreno h=0.20m',
        unidad: 'm²',
        precio: 4_200, min: 3_000, max: 6_800,
        descripcion: 'Retiro capa vegetal e=0.20m, cargue y disposición final.',
      },
      {
        codigo: 'RES-01-003',
        nombre: 'Cerramiento provisional lámina zinc cal.26',
        unidad: 'ml',
        precio: 42_000, min: 32_000, max: 60_000,
        descripcion: 'Cerramiento en zinc sobre paral metálico h=2.0m.',
      },
      {
        codigo: 'RES-01-004',
        nombre: 'Campamento provisional y almacén (arriendo)',
        unidad: 'mes',
        precio: 4_500_000, min: 2_500_000, max: 8_500_000,
        descripcion: 'Módulo prefabricado o en madera con servicios básicos.',
      },
      {
        codigo: 'RES-01-005',
        nombre: 'Demolición de estructura existente',
        unidad: 'm³',
        precio: 95_000, min: 68_000, max: 148_000,
        descripcion: 'Demolición mampostería/concreto con equipo manual y mecánico.',
      },
      {
        codigo: 'RES-01-006',
        nombre: 'Señalización y seguridad vial en obra',
        unidad: 'gl',
        precio: 1_500_000, min: 900_000, max: 2_800_000,
        descripcion: 'Cinta, vallas, conos, señales reflectivas según decreto municipal.',
      },
      {
        codigo: 'RES-01-007',
        nombre: 'Trazado y nivelación de ejes con nivel óptico',
        unidad: 'ml',
        precio: 2_800, min: 2_000, max: 4_500,
      },
    ],
  },

  {
    codigo: 'RES-02',
    nombre: 'CIMENTACIÓN',
    tipo_obra: 'residencial',
    numero: 2,
    descripcion: 'Excavaciones, zapatas, vigas de cimentación y losa de contrapiso.',
    actividades: [
      {
        codigo: 'RES-02-001',
        nombre: 'Excavación manual para cimientos h<1.50m',
        unidad: 'm³',
        precio: 42_000, min: 32_000, max: 62_000,
        descripcion: 'Excavación en material común sin agua, cargue manual.',
      },
      {
        codigo: 'RES-02-002',
        nombre: "Concreto de limpieza e=0.05m f'c=14MPa",
        unidad: 'm²',
        precio: 28_000, min: 22_000, max: 40_000,
        descripcion: 'Solado en concreto pobre sobre terreno compactado.',
      },
      {
        codigo: 'RES-02-003',
        nombre: "Zapata aislada concreto f'c=21MPa (inc. acero)",
        unidad: 'm³',
        precio: 620_000, min: 520_000, max: 790_000,
        descripcion: 'Concreto premezclado + acero fy=420MPa + formaleta.',
      },
      {
        codigo: 'RES-02-004',
        nombre: 'Viga de amarre cimentación 25×30cm',
        unidad: 'ml',
        precio: 68_000, min: 52_000, max: 92_000,
        descripcion: 'Concreto f\'c=21MPa + acero + formaleta metálica.',
      },
      {
        codigo: 'RES-02-005',
        nombre: 'Acero de refuerzo fy=420MPa (figurado y armado)',
        unidad: 'kg',
        precio: 5_400, min: 4_200, max: 7_200,
        descripcion: 'Varilla corrugada 60.000 PSI, corte, doblado y amarre.',
      },
      {
        codigo: 'RES-02-006',
        nombre: "Concreto ciclopeo 60/40 f'c=14MPa",
        unidad: 'm³',
        precio: 445_000, min: 380_000, max: 565_000,
        descripcion: 'Concreto con 40% piedra rajón D≥10cm en cimientos corridos.',
      },
      {
        codigo: 'RES-02-007',
        nombre: 'Impermeabilización de cimientos Sika 101 o similar',
        unidad: 'm²',
        precio: 38_000, min: 28_000, max: 55_000,
        descripcion: 'Mortero impermeabilizante cristalizante sobre muro húmedo.',
      },
      {
        codigo: 'RES-02-008',
        nombre: 'Losa de contrapiso e=0.10m f\'c=21MPa',
        unidad: 'm²',
        precio: 62_000, min: 48_000, max: 82_000,
        descripcion: 'Placa sobre terreno compactado, incluye recebo y nivelación.',
      },
    ],
  },

  {
    codigo: 'RES-03',
    nombre: 'ESTRUCTURA EN CONCRETO',
    tipo_obra: 'residencial',
    numero: 3,
    descripcion: 'Columnas, vigas, placas y escaleras en concreto reforzado.',
    actividades: [
      {
        codigo: 'RES-03-001',
        nombre: "Concreto f'c=21MPa (3000 PSI) vigas y columnas",
        unidad: 'm³',
        precio: 620_000, min: 520_000, max: 785_000,
        descripcion: 'Concreto premezclado puesto en obra, incluye vibrado.',
      },
      {
        codigo: 'RES-03-002',
        nombre: "Concreto f'c=28MPa (4000 PSI) estructura especial",
        unidad: 'm³',
        precio: 698_000, min: 582_000, max: 875_000,
        descripcion: 'Para edificios >4 pisos o zonas sísmicas especiales.',
      },
      {
        codigo: 'RES-03-003',
        nombre: 'Acero de refuerzo fy=420MPa figurado y armado',
        unidad: 'kg',
        precio: 5_400, min: 4_200, max: 7_200,
        descripcion: 'Incluye alambre de amarre y ganchos de sujeción.',
      },
      {
        codigo: 'RES-03-004',
        nombre: 'Formaleta (encofrado) metálica para columnas',
        unidad: 'm²',
        precio: 42_000, min: 32_000, max: 60_000,
        descripcion: 'Encofrado metálico reutilizable, incluye aceite desmoldante.',
      },
      {
        codigo: 'RES-03-005',
        nombre: 'Placa aligerada vigueta-loseta h=0.25m',
        unidad: 'm²',
        precio: 148_000, min: 112_000, max: 192_000,
        descripcion: 'Sistema vigueta pretensada + loseta + concreto f\'c=21MPa.',
      },
      {
        codigo: 'RES-03-006',
        nombre: "Placa maciza e=0.15m f'c=21MPa",
        unidad: 'm²',
        precio: 98_000, min: 75_000, max: 128_000,
        descripcion: 'Placa maciza con formaleta recuperable.',
      },
      {
        codigo: 'RES-03-007',
        nombre: 'Escalera en concreto (incluye acero y formaleta)',
        unidad: 'ml',
        precio: 395_000, min: 285_000, max: 530_000,
        descripcion: 'Huella, contrahuella y descanso en concreto reforzado.',
      },
    ],
  },

  {
    codigo: 'RES-04',
    nombre: 'MAMPOSTERÍA',
    tipo_obra: 'residencial',
    numero: 4,
    descripcion: 'Muros en ladrillo y bloque, con elementos de confinamiento.',
    actividades: [
      {
        codigo: 'RES-04-001',
        nombre: 'Muro ladrillo prensado e=0.15m junta limpia',
        unidad: 'm²',
        precio: 98_000, min: 72_000, max: 138_000,
      },
      {
        codigo: 'RES-04-002',
        nombre: 'Muro bloque N°4 e=0.10m (divisorio interior)',
        unidad: 'm²',
        precio: 62_000, min: 48_000, max: 88_000,
      },
      {
        codigo: 'RES-04-003',
        nombre: 'Muro bloque N°5 e=0.15m (fachada / exterior)',
        unidad: 'm²',
        precio: 82_000, min: 62_000, max: 118_000,
      },
      {
        codigo: 'RES-04-004',
        nombre: 'Columneta de confinamiento 10×20cm',
        unidad: 'ml',
        precio: 42_000, min: 32_000, max: 60_000,
        descripcion: 'Concreto f\'c=17.5MPa + acero 4Ø3/8" + estribos Ø1/4"@20cm.',
      },
      {
        codigo: 'RES-04-005',
        nombre: 'Viga corona mampostería 15×20cm',
        unidad: 'ml',
        precio: 55_000, min: 42_000, max: 78_000,
        descripcion: 'Concreto f\'c=17.5MPa + acero + encofrado.',
      },
      {
        codigo: 'RES-04-006',
        nombre: 'Dintel prefabricado concreto 15×15cm',
        unidad: 'ml',
        precio: 38_000, min: 28_000, max: 55_000,
      },
    ],
  },

  {
    codigo: 'RES-05',
    nombre: 'CUBIERTA',
    tipo_obra: 'residencial',
    numero: 5,
    descripcion: 'Techado en teja, impermeabilización y canales de aguas lluvias.',
    actividades: [
      {
        codigo: 'RES-05-001',
        nombre: 'Teja fibrocemento Eternit onda 7 (inc. estructura)',
        unidad: 'm²',
        precio: 62_000, min: 45_000, max: 92_000,
      },
      {
        codigo: 'RES-05-002',
        nombre: 'Teja termoacústica metálica (panel sándwich)',
        unidad: 'm²',
        precio: 98_000, min: 72_000, max: 142_000,
      },
      {
        codigo: 'RES-05-003',
        nombre: 'Teja cerámica tipo española (inc. mortero y estructura)',
        unidad: 'm²',
        precio: 128_000, min: 95_000, max: 182_000,
      },
      {
        codigo: 'RES-05-004',
        nombre: 'Canal aguas lluvias lámina galvanizada cal.22',
        unidad: 'ml',
        precio: 48_000, min: 35_000, max: 70_000,
      },
      {
        codigo: 'RES-05-005',
        nombre: 'Bajante PVC 3" RD-41',
        unidad: 'ml',
        precio: 28_000, min: 22_000, max: 42_000,
      },
      {
        codigo: 'RES-05-006',
        nombre: 'Impermeabilización cubierta plana (Sika/Weber)',
        unidad: 'm²',
        precio: 68_000, min: 50_000, max: 98_000,
        descripcion: 'Membrana asfáltica modificada SBS 4mm o sistema cementicio.',
      },
    ],
  },

  {
    codigo: 'RES-06',
    nombre: 'INSTALACIONES HIDROSANITARIAS',
    tipo_obra: 'residencial',
    numero: 6,
    descripcion: 'Redes de agua potable, aguas residuales y gas domiciliario.',
    actividades: [
      {
        codigo: 'RES-06-001',
        nombre: 'Punto hidráulico PVC-P 1/2" RDE-13.5',
        unidad: 'pto',
        precio: 188_000, min: 145_000, max: 252_000,
        descripcion: 'Incluye tubería, codos, pegamento y rosca de conexión.',
      },
      {
        codigo: 'RES-06-002',
        nombre: 'Punto sanitario PVC 4" (inc. ventilación)',
        unidad: 'pto',
        precio: 228_000, min: 175_000, max: 315_000,
        descripcion: 'Desagüe + ventilación + sifón, PVC sanitario RDE-32.5.',
      },
      {
        codigo: 'RES-06-003',
        nombre: 'Red principal PVC 4" sanitaria enterrada',
        unidad: 'ml',
        precio: 42_000, min: 32_000, max: 60_000,
        descripcion: 'Tubería PVC alcantarillado + excavación + relleno.',
      },
      {
        codigo: 'RES-06-004',
        nombre: 'Caja de inspección 60×60cm en mampostería',
        unidad: 'un',
        precio: 488_000, min: 380_000, max: 665_000,
        descripcion: 'Incluye excavación, mortero de pega y tapa metálica.',
      },
      {
        codigo: 'RES-06-005',
        nombre: 'Instalación aparatos sanitarios (sin suministro)',
        unidad: 'un',
        precio: 128_000, min: 92_000, max: 178_000,
        descripcion: 'Mano de obra instalación sanitario, lavamanos o ducha.',
      },
      {
        codigo: 'RES-06-006',
        nombre: 'Tanque almacenamiento agua 500L (inc. instalación)',
        unidad: 'un',
        precio: 988_000, min: 750_000, max: 1_385_000,
      },
      {
        codigo: 'RES-06-007',
        nombre: 'Red gas natural polietileno 1/2" (REDES)',
        unidad: 'ml',
        precio: 68_000, min: 52_000, max: 95_000,
        descripcion: 'Tubería PEBD + prueba de hermeticidad + certificado IPSE.',
      },
      {
        codigo: 'RES-06-008',
        nombre: 'Pozo séptico 1.5m³ (zonas sin alcantarillado)',
        unidad: 'un',
        precio: 3_800_000, min: 2_800_000, max: 5_500_000,
        descripcion: 'Cámara séptica + campo dispersión + diseño aprobado.',
      },
    ],
  },

  {
    codigo: 'RES-07',
    nombre: 'INSTALACIONES ELÉCTRICAS',
    tipo_obra: 'residencial',
    numero: 7,
    descripcion: 'Redes eléctricas residenciales norma NTC 2050 / RETIE.',
    actividades: [
      {
        codigo: 'RES-07-001',
        nombre: 'Punto de iluminación (fase + neutro + tierra)',
        unidad: 'pto',
        precio: 148_000, min: 112_000, max: 198_000,
        descripcion: 'Cable THW 1.5mm² + tubería conduit 3/4" + caja octogonal.',
      },
      {
        codigo: 'RES-07-002',
        nombre: 'Punto tomacorriente doble polarizado 110V',
        unidad: 'pto',
        precio: 168_000, min: 128_000, max: 228_000,
        descripcion: 'Cable THW 2.5mm² + conduit 3/4" + caja rectangular.',
      },
      {
        codigo: 'RES-07-003',
        nombre: 'Tablero eléctrico residencial 8 circuitos',
        unidad: 'un',
        precio: 488_000, min: 380_000, max: 685_000,
        descripcion: 'Caja metálica + breakers 2P-20A + bornera de neutro y tierra.',
      },
      {
        codigo: 'RES-07-004',
        nombre: 'Red eléctrica circuito cable 2.5mm² THW',
        unidad: 'ml',
        precio: 15_500, min: 12_000, max: 22_000,
        descripcion: 'Cable THW 2.5mm² + conduit corrugado 3/4" + chicotes.',
      },
      {
        codigo: 'RES-07-005',
        nombre: 'Puesta a tierra (electrodo copperweld)',
        unidad: 'gl',
        precio: 1_250_000, min: 950_000, max: 1_785_000,
        descripcion: 'Electrodo 5/8"×2.4m + cable desnudo 6AWG + conector.',
      },
      {
        codigo: 'RES-07-006',
        nombre: 'Acometida eléctrica (conexión red pública)',
        unidad: 'gl',
        precio: 2_850_000, min: 2_200_000, max: 4_250_000,
        descripcion: 'Medidor + acometida + trámite ante operador de red.',
      },
      {
        codigo: 'RES-07-007',
        nombre: 'Interruptor simple o doble BTICINO/LEGRAND',
        unidad: 'un',
        precio: 65_000, min: 48_000, max: 95_000,
      },
    ],
  },

  {
    codigo: 'RES-08',
    nombre: 'PAÑETES Y REVOQUES',
    tipo_obra: 'residencial',
    numero: 8,
    descripcion: 'Morteros de revestimiento en muros y cielos rasos interiores y exteriores.',
    actividades: [
      {
        codigo: 'RES-08-001',
        nombre: 'Pañete liso interior mortero 1:4 (e=1.5cm)',
        unidad: 'm²',
        precio: 28_000, min: 22_000, max: 40_000,
        descripcion: 'Mortero cemento-arena + maestreado + brillado.',
      },
      {
        codigo: 'RES-08-002',
        nombre: 'Pañete exterior impermeable mortero 1:3 (e=2cm)',
        unidad: 'm²',
        precio: 32_000, min: 25_000, max: 48_000,
        descripcion: 'Incluye aditivo impermeabilizante Sika 1 o similar.',
      },
      {
        codigo: 'RES-08-003',
        nombre: 'Pañete cielo raso liso 1:4',
        unidad: 'm²',
        precio: 35_000, min: 28_000, max: 52_000,
        descripcion: 'Mayor dificultad de ejecución que muros verticales.',
      },
      {
        codigo: 'RES-08-004',
        nombre: 'Filos y dilataciones en mortero',
        unidad: 'ml',
        precio: 8_500, min: 6_500, max: 13_500,
      },
      {
        codigo: 'RES-08-005',
        nombre: 'Estucado vinílico (pasta vinílica) sobre pañete',
        unidad: 'm²',
        precio: 18_500, min: 14_000, max: 28_000,
        descripcion: 'Dos manos + lija, para recibir pintura.',
      },
    ],
  },

  {
    codigo: 'RES-09',
    nombre: 'PISOS Y ENCHAPES',
    tipo_obra: 'residencial',
    numero: 9,
    descripcion: 'Pisos en cerámica, porcelanato, madera y enchapes de pared.',
    actividades: [
      {
        codigo: 'RES-09-001',
        nombre: 'Piso cerámica 30×30 nacional (inc. mortero y boquilla)',
        unidad: 'm²',
        precio: 72_000, min: 55_000, max: 108_000,
      },
      {
        codigo: 'RES-09-002',
        nombre: 'Piso porcelanato rectificado 60×60 importado',
        unidad: 'm²',
        precio: 142_000, min: 108_000, max: 198_000,
      },
      {
        codigo: 'RES-09-003',
        nombre: 'Enchape pared cerámica 30×30 (baños y cocina)',
        unidad: 'm²',
        precio: 82_000, min: 62_000, max: 122_000,
      },
      {
        codigo: 'RES-09-004',
        nombre: 'Piso madera laminada 8mm AC4 flotante',
        unidad: 'm²',
        precio: 128_000, min: 95_000, max: 182_000,
        descripcion: 'Incluye base de espuma y molduras de terminación.',
      },
      {
        codigo: 'RES-09-005',
        nombre: 'Alistado concreto e=0.05m f\'c=14MPa (recibo de piso)',
        unidad: 'm²',
        precio: 32_000, min: 25_000, max: 48_000,
      },
      {
        codigo: 'RES-09-006',
        nombre: 'Mortero de nivelación (autonivelante) e=3cm',
        unidad: 'm²',
        precio: 18_500, min: 14_000, max: 28_000,
      },
    ],
  },

  {
    codigo: 'RES-10',
    nombre: 'PINTURA Y ACABADOS',
    tipo_obra: 'residencial',
    numero: 10,
    descripcion: 'Pinturas interiores, exteriores e impermeabilizantes.',
    actividades: [
      {
        codigo: 'RES-10-001',
        nombre: 'Pintura vinilo tipo 1 interior (2 manos + fijador)',
        unidad: 'm²',
        precio: 22_000, min: 16_500, max: 32_000,
      },
      {
        codigo: 'RES-10-002',
        nombre: 'Pintura exterior vinílica resistente (2 manos)',
        unidad: 'm²',
        precio: 28_000, min: 22_000, max: 42_000,
      },
      {
        codigo: 'RES-10-003',
        nombre: 'Pintura epóxica para pisos (2 manos)',
        unidad: 'm²',
        precio: 55_000, min: 42_000, max: 82_000,
        descripcion: 'Para garajes, bodegas o zonas húmedas.',
      },
      {
        codigo: 'RES-10-004',
        nombre: 'Barniz madera (2 manos) puertas y ventanas',
        unidad: 'm²',
        precio: 38_000, min: 28_000, max: 58_000,
      },
      {
        codigo: 'RES-10-005',
        nombre: 'Impermeabilización terrazas y losas expuestas',
        unidad: 'm²',
        precio: 68_000, min: 52_000, max: 100_000,
        descripcion: 'Manto asfáltico SBS 4mm + geotextil + capa de protección.',
      },
    ],
  },

  {
    codigo: 'RES-11',
    nombre: 'CARPINTERÍA METÁLICA Y MADERA',
    tipo_obra: 'residencial',
    numero: 11,
    descripcion: 'Puertas, ventanas, closets, escaleras metálicas y barandillas.',
    actividades: [
      {
        codigo: 'RES-11-001',
        nombre: 'Puerta madera sólida 0.90m (inc. marco y bisagras)',
        unidad: 'un',
        precio: 985_000, min: 750_000, max: 1_480_000,
      },
      {
        codigo: 'RES-11-002',
        nombre: 'Ventana aluminio vidrio 4mm serie 30',
        unidad: 'm²',
        precio: 288_000, min: 215_000, max: 425_000,
      },
      {
        codigo: 'RES-11-003',
        nombre: 'Barandilla metálica tubería 1½" h=1.0m',
        unidad: 'ml',
        precio: 188_000, min: 138_000, max: 268_000,
      },
      {
        codigo: 'RES-11-004',
        nombre: 'Closet en MDF melaminado (1.80m de frente)',
        unidad: 'un',
        precio: 1_850_000, min: 1_380_000, max: 2_850_000,
      },
      {
        codigo: 'RES-11-005',
        nombre: 'Cocina integral modular (por metro lineal)',
        unidad: 'ml',
        precio: 985_000, min: 720_000, max: 1_485_000,
        descripcion: 'Módulos altos + bajos en MDF, sin mesón de granito.',
      },
      {
        codigo: 'RES-11-006',
        nombre: 'Mesón granito natural e=3cm (cocinas y baños)',
        unidad: 'ml',
        precio: 485_000, min: 365_000, max: 725_000,
      },
    ],
  },

  {
    codigo: 'RES-12',
    nombre: 'APARATOS Y ACCESORIOS SANITARIOS',
    tipo_obra: 'residencial',
    numero: 12,
    descripcion: 'Sanitarios, lavamanos, lavaplatos y calentadores.',
    actividades: [
      {
        codigo: 'RES-12-001',
        nombre: 'Lavamanos + llave mezcladora instalado (gama media)',
        unidad: 'un',
        precio: 388_000, min: 285_000, max: 585_000,
      },
      {
        codigo: 'RES-12-002',
        nombre: 'Sanitario taza Corona/Elite + fluxómetro instalado',
        unidad: 'un',
        precio: 488_000, min: 375_000, max: 725_000,
      },
      {
        codigo: 'RES-12-003',
        nombre: 'Ducha sencilla cromada (inc. flexible y regadera)',
        unidad: 'un',
        precio: 188_000, min: 138_000, max: 285_000,
      },
      {
        codigo: 'RES-12-004',
        nombre: 'Lavaplatos acero inoxidable 1 poza instalado',
        unidad: 'un',
        precio: 488_000, min: 365_000, max: 725_000,
      },
      {
        codigo: 'RES-12-005',
        nombre: 'Calentador a gas 10L instantáneo instalado',
        unidad: 'un',
        precio: 688_000, min: 525_000, max: 985_000,
      },
    ],
  },

  {
    codigo: 'RES-13',
    nombre: 'OBRAS EXTERIORES',
    tipo_obra: 'residencial',
    numero: 13,
    descripcion: 'Cerramiento, antejardín, parqueaderos y senderos.',
    actividades: [
      {
        codigo: 'RES-13-001',
        nombre: 'Cerramiento perimetral malla eslabonada h=2m',
        unidad: 'ml',
        precio: 128_000, min: 95_000, max: 182_000,
      },
      {
        codigo: 'RES-13-002',
        nombre: 'Portón metálico corredizo (inc. motor eléctrico)',
        unidad: 'un',
        precio: 3_880_000, min: 2_850_000, max: 5_850_000,
      },
      {
        codigo: 'RES-13-003',
        nombre: "Parqueadero concreto estampado e=0.12m f'c=21MPa",
        unidad: 'm²',
        precio: 138_000, min: 105_000, max: 198_000,
      },
      {
        codigo: 'RES-13-004',
        nombre: 'Sendero adoquín de cemento e=0.06m sobre arena',
        unidad: 'm²',
        precio: 85_000, min: 62_000, max: 125_000,
      },
      {
        codigo: 'RES-13-005',
        nombre: 'Jardín y zonas verdes (grass, tierra negra)',
        unidad: 'm²',
        precio: 48_000, min: 32_000, max: 72_000,
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // EDIFICACIONES — COMERCIAL
  // ══════════════════════════════════════════════════════════════════════════════

  {
    codigo: 'COM-01',
    nombre: 'PRELIMINARES',
    tipo_obra: 'comercial',
    numero: 1,
    descripcion: 'Trabajos preparatorios para edificaciones comerciales.',
    actividades: [
      {
        codigo: 'COM-01-001',
        nombre: 'Localización y replanteo topográfico (nivel + taquímetro)',
        unidad: 'm²',
        precio: 4_500, min: 3_500, max: 6_800,
      },
      {
        codigo: 'COM-01-002',
        nombre: 'Descapote y demolición estructura existente',
        unidad: 'm²',
        precio: 12_500, min: 8_500, max: 19_500,
        descripcion: 'Incluye retiro y transporte de escombros a botadero.',
      },
      {
        codigo: 'COM-01-003',
        nombre: 'Cerramiento provisional en lámina y señalización',
        unidad: 'ml',
        precio: 68_000, min: 50_000, max: 98_000,
      },
      {
        codigo: 'COM-01-004',
        nombre: 'Campamento provisional y oficina de obra',
        unidad: 'gl',
        precio: 6_500_000, min: 4_500_000, max: 10_500_000,
      },
      {
        codigo: 'COM-01-005',
        nombre: 'Estudio de suelos + topografía predial',
        unidad: 'gl',
        precio: 4_500_000, min: 3_200_000, max: 7_500_000,
        descripcion: 'Sondeos SPT, ensayos de laboratorio e informe geotécnico.',
      },
    ],
  },

  {
    codigo: 'COM-02',
    nombre: 'ESTRUCTURA',
    tipo_obra: 'comercial',
    numero: 2,
    descripcion: 'Estructura en concreto reforzado para edificaciones comerciales.',
    actividades: [
      {
        codigo: 'COM-02-001',
        nombre: "Pilote de concreto fundido in-situ D=0.40m f'c=28MPa",
        unidad: 'ml',
        precio: 488_000, min: 380_000, max: 650_000,
      },
      {
        codigo: 'COM-02-002',
        nombre: "Columna circular D=0.40m concreto f'c=28MPa",
        unidad: 'm³',
        precio: 785_000, min: 650_000, max: 985_000,
      },
      {
        codigo: 'COM-02-003',
        nombre: "Placa maciza e=0.20m f'c=28MPa (forjado)",
        unidad: 'm²',
        precio: 148_000, min: 118_000, max: 195_000,
      },
      {
        codigo: 'COM-02-004',
        nombre: 'Acero de refuerzo fy=420MPa (kg instalado)',
        unidad: 'kg',
        precio: 5_500, min: 4_400, max: 7_400,
      },
      {
        codigo: 'COM-02-005',
        nombre: 'Estructura metálica columna HEB 200 (kg instalado)',
        unidad: 'kg',
        precio: 9_800, min: 7_500, max: 13_500,
        descripcion: 'Incluye fabricación, transporte y montaje con grúa.',
      },
      {
        codigo: 'COM-02-006',
        nombre: 'Losa colaborante deck metálico + concreto',
        unidad: 'm²',
        precio: 185_000, min: 145_000, max: 248_000,
      },
    ],
  },

  {
    codigo: 'COM-03',
    nombre: 'MAMPOSTERÍA Y DIVISORIOS',
    tipo_obra: 'comercial',
    numero: 3,
    descripcion: 'Muros fijos y divisiones livianas para uso comercial.',
    actividades: [
      {
        codigo: 'COM-03-001',
        nombre: 'Muro drywall doble cara 1 placa (tabique)',
        unidad: 'm²',
        precio: 82_000, min: 62_000, max: 118_000,
      },
      {
        codigo: 'COM-03-002',
        nombre: 'Muro drywall doble cara + lana mineral (acústico)',
        unidad: 'm²',
        precio: 115_000, min: 88_000, max: 162_000,
      },
      {
        codigo: 'COM-03-003',
        nombre: 'Divisiones en vidrio templado 10mm biselado',
        unidad: 'm²',
        precio: 488_000, min: 375_000, max: 725_000,
      },
      {
        codigo: 'COM-03-004',
        nombre: 'Muro ladrillo prensado fachada e=0.20m',
        unidad: 'm²',
        precio: 118_000, min: 90_000, max: 162_000,
      },
      {
        codigo: 'COM-03-005',
        nombre: 'Cielo raso suspendido en baldosa 60×60',
        unidad: 'm²',
        precio: 72_000, min: 55_000, max: 105_000,
      },
    ],
  },

  {
    codigo: 'COM-04',
    nombre: 'INSTALACIONES ELÉCTRICAS Y REDES',
    tipo_obra: 'comercial',
    numero: 4,
    descripcion: 'Redes eléctricas, datos, voz y seguridad electrónica.',
    actividades: [
      {
        codigo: 'COM-04-001',
        nombre: 'Punto de iluminación comercial THHN 4mm²',
        unidad: 'pto',
        precio: 188_000, min: 145_000, max: 272_000,
      },
      {
        codigo: 'COM-04-002',
        nombre: 'Tomacorriente trifásico 440V polarizado',
        unidad: 'pto',
        precio: 288_000, min: 215_000, max: 425_000,
      },
      {
        codigo: 'COM-04-003',
        nombre: 'Tablero eléctrico industrial TGD 400A',
        unidad: 'un',
        precio: 3_888_000, min: 2_880_000, max: 5_850_000,
      },
      {
        codigo: 'COM-04-004',
        nombre: 'Red de voz y datos Cat 6A (punto instalado)',
        unidad: 'pto',
        precio: 228_000, min: 175_000, max: 328_000,
      },
      {
        codigo: 'COM-04-005',
        nombre: 'Cámara IP CCTV 4K (inc. cableado y soporte)',
        unidad: 'pto',
        precio: 1_250_000, min: 950_000, max: 1_885_000,
      },
      {
        codigo: 'COM-04-006',
        nombre: 'Pararrayos ionizante + puesta a tierra malla',
        unidad: 'gl',
        precio: 4_500_000, min: 3_500_000, max: 6_850_000,
      },
    ],
  },

  {
    codigo: 'COM-05',
    nombre: 'CLIMATIZACIÓN Y AIRE ACONDICIONADO',
    tipo_obra: 'comercial',
    numero: 5,
    descripcion: 'Sistemas VRF, splits y manejo de aire para espacios comerciales.',
    actividades: [
      {
        codigo: 'COM-05-001',
        nombre: 'Unidad split tipo cassette 24.000 BTU instalado',
        unidad: 'un',
        precio: 6_500_000, min: 4_800_000, max: 9_800_000,
      },
      {
        codigo: 'COM-05-002',
        nombre: 'Unidad manejadora de aire UMA 5TR (central)',
        unidad: 'un',
        precio: 18_800_000, min: 14_500_000, max: 28_500_000,
      },
      {
        codigo: 'COM-05-003',
        nombre: 'Ducto galvanizado rectangular (liso interior)',
        unidad: 'm²',
        precio: 88_000, min: 65_000, max: 130_000,
        descripcion: 'Fabricación e instalación con aislamiento térmico.',
      },
      {
        codigo: 'COM-05-004',
        nombre: 'Rejilla de suministro/retorno 600×300mm',
        unidad: 'un',
        precio: 188_000, min: 145_000, max: 275_000,
      },
      {
        codigo: 'COM-05-005',
        nombre: 'Sistema VRF exterior + 5 unidades internas',
        unidad: 'gl',
        precio: 68_500_000, min: 52_000_000, max: 95_000_000,
        descripcion: 'Inverter, refrigerante R-410A, incluye instalación.',
      },
    ],
  },

  {
    codigo: 'COM-06',
    nombre: 'REDES CONTRA INCENDIO',
    tipo_obra: 'comercial',
    numero: 6,
    descripcion: 'Sistemas de detección, extinción y control de incendio NFPA.',
    actividades: [
      {
        codigo: 'COM-06-001',
        nombre: 'Rociador automático (sprinkler) instalado NFPA 13',
        unidad: 'un',
        precio: 288_000, min: 215_000, max: 428_000,
        descripcion: 'Incluye tubería HG y soportería.',
      },
      {
        codigo: 'COM-06-002',
        nombre: 'Gabinete contraincendio tipo I (manguera+extintor)',
        unidad: 'un',
        precio: 2_880_000, min: 2_200_000, max: 4_250_000,
      },
      {
        codigo: 'COM-06-003',
        nombre: 'Tubería HG 2" sistema rociadores (ml instalado)',
        unidad: 'ml',
        precio: 88_000, min: 65_000, max: 130_000,
      },
      {
        codigo: 'COM-06-004',
        nombre: 'Detector de humo fotoeléctrico + central',
        unidad: 'pto',
        precio: 388_000, min: 288_000, max: 580_000,
      },
      {
        codigo: 'COM-06-005',
        nombre: 'Extintor CO2 10lb instalado con soporte',
        unidad: 'un',
        precio: 388_000, min: 285_000, max: 585_000,
      },
    ],
  },

  {
    codigo: 'COM-07',
    nombre: 'ACABADOS Y PISOS COMERCIALES',
    tipo_obra: 'comercial',
    numero: 7,
    descripcion: 'Pisos de alta resistencia y cielos para usos comerciales.',
    actividades: [
      {
        codigo: 'COM-07-001',
        nombre: 'Piso porcelanato rectificado 60×60 alto tráfico',
        unidad: 'm²',
        precio: 168_000, min: 125_000, max: 248_000,
      },
      {
        codigo: 'COM-07-002',
        nombre: 'Piso LVT vinilo de lujo click 5mm AC5',
        unidad: 'm²',
        precio: 188_000, min: 140_000, max: 278_000,
      },
      {
        codigo: 'COM-07-003',
        nombre: 'Piso epóxico autonivelante 3mm sistema completo',
        unidad: 'm²',
        precio: 68_000, min: 52_000, max: 100_000,
      },
      {
        codigo: 'COM-07-004',
        nombre: 'Fachada muro cortina aluminio + vidrio 6mm',
        unidad: 'm²',
        precio: 988_000, min: 750_000, max: 1_488_000,
      },
      {
        codigo: 'COM-07-005',
        nombre: 'Panel de fachada ACM (aluminium composite)',
        unidad: 'm²',
        precio: 488_000, min: 375_000, max: 725_000,
      },
      {
        codigo: 'COM-07-006',
        nombre: 'Puerta automática corredera vidrio templado',
        unidad: 'un',
        precio: 8_500_000, min: 6_500_000, max: 13_000_000,
      },
    ],
  },

  {
    codigo: 'COM-08',
    nombre: 'ASEO Y ENTREGA',
    tipo_obra: 'comercial',
    numero: 8,
    descripcion: 'Limpieza general, retiro de escombros y entrega a satisfacción.',
    actividades: [
      {
        codigo: 'COM-08-001',
        nombre: 'Aseo general de obra (pisos + vidrios + sanitarios)',
        unidad: 'm²',
        precio: 6_500, min: 5_000, max: 9_800,
      },
      {
        codigo: 'COM-08-002',
        nombre: 'Limpieza de vidrios exteriores con equipo',
        unidad: 'm²',
        precio: 8_800, min: 6_500, max: 13_500,
      },
      {
        codigo: 'COM-08-003',
        nombre: 'Manejo y retiro escombros a botadero autorizado',
        unidad: 'm³',
        precio: 48_000, min: 35_000, max: 68_000,
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // OBRA CIVIL / VIAL — INFRAESTRUCTURA
  // ══════════════════════════════════════════════════════════════════════════════

  {
    codigo: 'VIA-01',
    nombre: 'PRELIMINARES Y LOCALIZACIÓN',
    tipo_obra: 'infraestructura',
    numero: 1,
    descripcion: 'Trabajos previos de topografía, descapote y montaje de obra.',
    actividades: [
      {
        codigo: 'VIA-01-001',
        nombre: 'Localización y replanteo vial con estación total',
        unidad: 'ml',
        precio: 5_800, min: 4_000, max: 9_000,
        descripcion: 'Estacado cada 20m, nivelación diferencial y perfiles.',
      },
      {
        codigo: 'VIA-01-002',
        nombre: 'Descapote mecánico h=0.30m con motoniveladora',
        unidad: 'm²',
        precio: 4_800, min: 3_500, max: 7_200,
      },
      {
        codigo: 'VIA-01-003',
        nombre: 'Cerramiento y señalización vial (desvío tráfico)',
        unidad: 'ml',
        precio: 58_000, min: 40_000, max: 85_000,
        descripcion: 'Vallas metálicas, conos, señales reflectivas y bandereros.',
      },
      {
        codigo: 'VIA-01-004',
        nombre: 'Campamento y oficina de obra (arriendo mensual)',
        unidad: 'mes',
        precio: 3_500_000, min: 2_500_000, max: 5_800_000,
      },
      {
        codigo: 'VIA-01-005',
        nombre: 'Movilización de maquinaria pesada (retro, buldózer)',
        unidad: 'gl',
        precio: 8_800_000, min: 5_500_000, max: 14_500_000,
        descripcion: 'Transporte en cama baja + permisos de carretera.',
      },
    ],
  },

  {
    codigo: 'VIA-02',
    nombre: 'MOVIMIENTO DE TIERRAS',
    tipo_obra: 'infraestructura',
    numero: 2,
    descripcion: 'Excavaciones, rellenos, compactación y manejo de materiales.',
    actividades: [
      {
        codigo: 'VIA-02-001',
        nombre: 'Excavación mecánica material común (retroexcavadora)',
        unidad: 'm³',
        precio: 22_000, min: 14_000, max: 35_000,
        descripcion: 'Sin presencia de agua, profundidad < 3m, cargue en volqueta.',
      },
      {
        codigo: 'VIA-02-002',
        nombre: 'Excavación manual zanjas y pozos h<1.50m',
        unidad: 'm³',
        precio: 48_000, min: 35_000, max: 70_000,
      },
      {
        codigo: 'VIA-02-003',
        nombre: 'Relleno y compactación material propio (Proctor >95%)',
        unidad: 'm³',
        precio: 28_000, min: 20_000, max: 45_000,
        descripcion: 'Compactación por capas de 0.20m con vibrocompactador.',
      },
      {
        codigo: 'VIA-02-004',
        nombre: 'Relleno material seleccionado importado (zarandeado)',
        unidad: 'm³',
        precio: 80_000, min: 58_000, max: 118_000,
        descripcion: 'Material sin cohesión, granulometría controlada, CBR>10%.',
      },
      {
        codigo: 'VIA-02-005',
        nombre: 'Acarreo sobrantes (volqueta 8m³ × km recorrido)',
        unidad: 'm³km',
        precio: 9_800, min: 7_000, max: 15_000,
        descripcion: 'Precio por m³ por km hasta botadero autorizado.',
      },
      {
        codigo: 'VIA-02-006',
        nombre: 'Perfilado y compactación subrasante (IGC>95%)',
        unidad: 'm²',
        precio: 9_800, min: 6_500, max: 15_000,
        descripcion: 'Motoniveladora + vibrocompactador + ensayo densidad in situ.',
      },
      {
        codigo: 'VIA-02-007',
        nombre: 'Terraplén compactado por capas h=0.30m',
        unidad: 'm³',
        precio: 42_000, min: 32_000, max: 65_000,
        descripcion: 'Material de préstamo + tendido + humectación + compactación.',
      },
      {
        codigo: 'VIA-02-008',
        nombre: 'Estabilización subrasante con cal viva al 3%',
        unidad: 'm²',
        precio: 22_000, min: 15_000, max: 34_000,
        descripcion: 'Para CBR < 3%, incluye mezclado y compactación.',
      },
    ],
  },

  {
    codigo: 'VIA-03',
    nombre: 'OBRAS DE ARTE Y DRENAJE',
    tipo_obra: 'infraestructura',
    numero: 3,
    descripcion: 'Cunetas, alcantarillas, cajas y estructuras hidráulicas.',
    actividades: [
      {
        codigo: 'VIA-03-001',
        nombre: "Cuneta revestida concreto f'c=21MPa e=0.10m",
        unidad: 'ml',
        precio: 188_000, min: 145_000, max: 272_000,
        descripcion: 'Cuneta triangular o trapezoidal con formaleta metálica.',
      },
      {
        codigo: 'VIA-03-002',
        nombre: 'Alcantarilla PVC 36" (inc. excavación y relleno)',
        unidad: 'ml',
        precio: 488_000, min: 380_000, max: 725_000,
      },
      {
        codigo: 'VIA-03-003',
        nombre: "Caja de inspección 1×1m concreto f'c=21MPa",
        unidad: 'un',
        precio: 988_000, min: 750_000, max: 1_488_000,
        descripcion: 'Con marco y tapa en hierro fundido.',
      },
      {
        codigo: 'VIA-03-004',
        nombre: "Box culvert 1.0×1.0m concreto reforzado f'c=28MPa",
        unidad: 'ml',
        precio: 1_880_000, min: 1_400_000, max: 2_800_000,
        descripcion: 'Prefabricado o fundido in-situ, inc. excavación.',
      },
      {
        codigo: 'VIA-03-005',
        nombre: 'Geotextil NT-1600 separación subrasante-subbase',
        unidad: 'm²',
        precio: 9_800, min: 7_200, max: 14_500,
      },
      {
        codigo: 'VIA-03-006',
        nombre: 'Tubería corrugada HDPE 24" (drenaje lateral)',
        unidad: 'ml',
        precio: 288_000, min: 215_000, max: 425_000,
      },
    ],
  },

  {
    codigo: 'VIA-04',
    nombre: 'SUB-BASE Y BASE GRANULAR',
    tipo_obra: 'infraestructura',
    numero: 4,
    descripcion: 'Capas granulares de soporte estructural del pavimento.',
    actividades: [
      {
        codigo: 'VIA-04-001',
        nombre: 'Sub-base granular compactada (CBR>50%, Proctor>100%)',
        unidad: 'm³',
        precio: 90_000, min: 65_000, max: 132_000,
        descripcion: 'Material SBG-1 INVIAS, esp. según diseño (típico 0.20m).',
      },
      {
        codigo: 'VIA-04-002',
        nombre: 'Base granular compactada (CBR>80%, Proctor>100%)',
        unidad: 'm³',
        precio: 118_000, min: 88_000, max: 172_000,
        descripcion: 'Material BG-1 INVIAS, capa típica 0.15-0.20m.',
      },
      {
        codigo: 'VIA-04-003',
        nombre: 'Imprimación asfáltica MC-30 (riego)',
        unidad: 'm²',
        precio: 4_800, min: 3_500, max: 7_200,
        descripcion: 'Tasa de aplicación 1.0-1.5 l/m², incluye barrido previo.',
      },
      {
        codigo: 'VIA-04-004',
        nombre: 'Riego de liga emulsión asfáltica CRR-1',
        unidad: 'm²',
        precio: 3_600, min: 2_500, max: 5_500,
        descripcion: 'Tasa 0.5-0.8 l/m², entre capas de carpeta.',
      },
      {
        codigo: 'VIA-04-005',
        nombre: 'Estabilización base con cemento al 4%',
        unidad: 'm²',
        precio: 28_000, min: 20_000, max: 42_000,
        descripcion: 'Para subrasante de baja capacidad portante.',
      },
    ],
  },

  {
    codigo: 'VIA-05',
    nombre: 'PAVIMENTO Y ASFALTO',
    tipo_obra: 'infraestructura',
    numero: 5,
    descripcion: 'Carpetas asfálticas, pavimento rígido y adoquines.',
    actividades: [
      {
        codigo: 'VIA-05-001',
        nombre: 'Carpeta asfáltica MDC-19 e=0.07m (planta+extensión)',
        unidad: 'ton',
        precio: 328_000, min: 268_000, max: 428_000,
        descripcion: 'Mezcla densa en caliente, compactación >98% Marshall.',
      },
      {
        codigo: 'VIA-05-002',
        nombre: 'Mezcla densa MDC-10 e=0.05m (capa rodadura)',
        unidad: 'ton',
        precio: 358_000, min: 288_000, max: 468_000,
      },
      {
        codigo: 'VIA-05-003',
        nombre: "Pavimento rígido concreto f'c=28MPa e=0.20m",
        unidad: 'm²',
        precio: 188_000, min: 148_000, max: 268_000,
        descripcion: 'Incluye junta de dilatación, sellante y curado.',
      },
      {
        codigo: 'VIA-05-004',
        nombre: 'Pavimento adoquín concreto e=0.08m sobre arena',
        unidad: 'm²',
        precio: 98_000, min: 72_000, max: 142_000,
        descripcion: 'Adoquín f\'c>40MPa + cama arena e=3cm + sardineles.',
      },
      {
        codigo: 'VIA-05-005',
        nombre: 'Slurry seal (lechada asfáltica) mantenimiento',
        unidad: 'm²',
        precio: 15_800, min: 11_500, max: 23_000,
        descripcion: 'Emulsión CRL-1 + gravilla + aditivos, 2 manos.',
      },
      {
        codigo: 'VIA-05-006',
        nombre: 'Sello de fisuras con emulsión + arena gruesa',
        unidad: 'ml',
        precio: 8_500, min: 6_000, max: 13_000,
      },
    ],
  },

  {
    codigo: 'VIA-06',
    nombre: 'SEÑALIZACIÓN VIAL',
    tipo_obra: 'infraestructura',
    numero: 6,
    descripcion: 'Demarcación horizontal y señalización vertical según Manual de Señalización.',
    actividades: [
      {
        codigo: 'VIA-06-001',
        nombre: 'Demarcación línea central (pintura termoplástica)',
        unidad: 'ml',
        precio: 12_800, min: 9_500, max: 19_000,
        descripcion: 'Microesferas de vidrio retroreflectivas, e=3mm.',
      },
      {
        codigo: 'VIA-06-002',
        nombre: 'Demarcación línea de borde / carril (termoplástica)',
        unidad: 'ml',
        precio: 8_800, min: 6_500, max: 13_500,
      },
      {
        codigo: 'VIA-06-003',
        nombre: 'Señal vertical preventiva (SP) poste + placa',
        unidad: 'un',
        precio: 288_000, min: 215_000, max: 428_000,
        descripcion: 'Poste galvanizado + placa reflectiva Tipo III, inst. incluida.',
      },
      {
        codigo: 'VIA-06-004',
        nombre: 'Señal vertical reglamentaria (SR) instalada',
        unidad: 'un',
        precio: 328_000, min: 248_000, max: 488_000,
      },
      {
        codigo: 'VIA-06-005',
        nombre: 'Tachón reflectivo tipo I (ojo de gato)',
        unidad: 'un',
        precio: 38_000, min: 28_000, max: 58_000,
      },
      {
        codigo: 'VIA-06-006',
        nombre: 'Reductor de velocidad (policía acostado) prefab.',
        unidad: 'un',
        precio: 1_880_000, min: 1_380_000, max: 2_800_000,
        descripcion: 'Caucho reciclado modular, incluye señalización.',
      },
    ],
  },

  {
    codigo: 'VIA-07',
    nombre: 'URBANISMO Y ESPACIO PÚBLICO',
    tipo_obra: 'infraestructura',
    numero: 7,
    descripcion: 'Andenes, ciclorrutas, sardineles y mobiliario urbano.',
    actividades: [
      {
        codigo: 'VIA-07-001',
        nombre: "Andén en concreto e=0.10m f'c=21MPa (inc. base)",
        unidad: 'm²',
        precio: 98_000, min: 72_000, max: 142_000,
      },
      {
        codigo: 'VIA-07-002',
        nombre: 'Sardinel prefabricado concreto 15×35×60cm',
        unidad: 'ml',
        precio: 48_000, min: 36_000, max: 70_000,
        descripcion: 'Incluye excavación, mortero de asiento y sellado.',
      },
      {
        codigo: 'VIA-07-003',
        nombre: 'Ciclorruta adoquín concreto e=0.06m',
        unidad: 'm²',
        precio: 85_000, min: 62_000, max: 125_000,
      },
      {
        codigo: 'VIA-07-004',
        nombre: 'Zonas verdes (grass tipo bermuda + tierra negra)',
        unidad: 'm²',
        precio: 38_000, min: 28_000, max: 58_000,
      },
      {
        codigo: 'VIA-07-005',
        nombre: 'Arborización (árboles nativos d≥5cm, inst. incluida)',
        unidad: 'un',
        precio: 288_000, min: 215_000, max: 428_000,
      },
      {
        codigo: 'VIA-07-006',
        nombre: 'Banca en concreto prefabricada (parque/andén)',
        unidad: 'un',
        precio: 988_000, min: 750_000, max: 1_488_000,
      },
    ],
  },
];

// ─── Lógica de inserción ──────────────────────────────────────────────────────

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
  const connStr   = `postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/postgres`;

  const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
  await client.connect();
  return client;
}

function validarPrecios(act: ActividadSeed): void {
  const precio = new Decimal(act.precio);
  const min    = new Decimal(act.min);
  const max    = new Decimal(act.max);

  if (min.greaterThan(precio)) {
    throw new Error(`${act.codigo}: rango_min (${act.min}) > precio (${act.precio})`);
  }
  if (precio.greaterThan(max)) {
    throw new Error(`${act.codigo}: precio (${act.precio}) > rango_max (${act.max})`);
  }
}

async function seed(client: Client, isDryRun: boolean, isReset: boolean): Promise<void> {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   SIPO — Seed Catálogo Base Colombia 2025  ║');
  console.log('╚════════════════════════════════════════════╝\n');

  // ── Validación de datos antes de tocar la BD ──
  console.log('🔍 Validando datos del catálogo...');
  let totalActividades = 0;
  for (const cap of CATALOGO) {
    for (const act of cap.actividades) {
      validarPrecios(act);
      totalActividades++;
    }
  }
  console.log(`✅ ${CATALOGO.length} capítulos, ${totalActividades} actividades — datos válidos\n`);

  if (isDryRun) {
    console.log('🏃 Modo DRY-RUN: sin cambios en la base de datos.');
    return;
  }

  await client.query('BEGIN');

  try {
    if (isReset) {
      console.log('🗑️  --reset: eliminando catálogo existente...');
      await client.query('DELETE FROM catalogo_actividades');
      await client.query('DELETE FROM catalogo_capitulos');
      console.log('   Tablas vaciadas.\n');
    }

    let capInsertados = 0;
    let actInsertadas = 0;

    for (const cap of CATALOGO) {
      // ── Insertar / actualizar capítulo ──
      const resCAP = await client.query<{ id: string }>(
        `INSERT INTO catalogo_capitulos (codigo, nombre, tipo_obra, numero, descripcion)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (codigo, tipo_obra) DO UPDATE
           SET nombre = EXCLUDED.nombre,
               numero = EXCLUDED.numero,
               descripcion = EXCLUDED.descripcion
         RETURNING id`,
        [cap.codigo, cap.nombre, cap.tipo_obra, cap.numero, cap.descripcion ?? null],
      );
      const capId = resCAP.rows[0].id;
      capInsertados++;

      for (const act of cap.actividades) {
        const precio = new Decimal(act.precio).toFixed(2);
        const min    = new Decimal(act.min).toFixed(2);
        const max    = new Decimal(act.max).toFixed(2);

        await client.query(
          `INSERT INTO catalogo_actividades
             (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
              precio_referencia_nacional, rango_min, rango_max, descripcion)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (codigo, tipo_obra) DO UPDATE
             SET nombre                     = EXCLUDED.nombre,
                 unidad                     = EXCLUDED.unidad,
                 precio_referencia_nacional = EXCLUDED.precio_referencia_nacional,
                 rango_min                  = EXCLUDED.rango_min,
                 rango_max                  = EXCLUDED.rango_max,
                 descripcion                = EXCLUDED.descripcion`,
          [capId, cap.tipo_obra, act.codigo, act.nombre, act.unidad,
           precio, min, max, act.descripcion ?? null],
        );
        actInsertadas++;
      }

      const tipoLabel = cap.tipo_obra.toUpperCase().padEnd(14);
      console.log(`  ✓ [${tipoLabel}] ${cap.nombre} (${cap.actividades.length} actividades)`);
    }

    await client.query('COMMIT');

    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║              RESUMEN FINAL                 ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log(`  Capítulos insertados/actualizados : ${capInsertados}`);
    console.log(`  Actividades insertadas/actualizadas: ${actInsertadas}`);
    console.log('\n🎉 Catálogo base listo para usar en SIPO.\n');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

// ─── Entry point ──────────────────────────────────────────────────────────────

const args      = process.argv.slice(2);
const isDryRun  = args.includes('--dry-run');
const isReset   = args.includes('--reset');

(async () => {
  const client = await conectar();
  try {
    await seed(client, isDryRun, isReset);
  } catch (err) {
    console.error('\n❌ Error durante el seed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
