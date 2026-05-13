#!/usr/bin/env npx tsx
/**
 * SIPO — Seed de ítems APU de referencia por actividad de catálogo
 * Colombia 2025 — Precios con factor prestacional incluido (×1.64)
 *
 * Uso:
 *   npx tsx scripts/seed-apu-items.ts
 *   npx tsx scripts/seed-apu-items.ts --dry-run
 *   npx tsx scripts/seed-apu-items.ts --reset
 *
 * SMMLV 2025 = $1.423.500 | Factor prestacional = 1.64
 * Jornales con factor (costo real al contratista):
 *   Ayudante     $52.000 × 1.64 = $85.000/día
 *   Oficial      $72.000 × 1.64 = $118.000/día
 *   Maestro      $95.000 × 1.64 = $156.000/día
 *   Ferrallista  $82.000 × 1.64 = $134.000/día
 *   Electricista $88.000 × 1.64 = $144.000/día
 *   Plomero      $88.000 × 1.64 = $144.000/día
 *   Pintor       $72.000 × 1.64 = $118.000/día
 *   Topógrafo   $120.000 × 1.64 = $195.000/día
 *   Operador maq $95.000 × 1.64 = $156.000/día
 *
 * Las cantidades se expresan POR UNIDAD DE SALIDA (rendimiento = 1)
 * p.ej. para excavación en m³ → cantidad = jornada / m³
 */

import { Client } from 'pg';
import * as path from 'path';
import * as url from 'url';
import * as dotenv from 'dotenv';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

// ─── Tipos ───────────────────────────────────────────────────────────────────

type TipoItem = 'material' | 'mano_obra' | 'equipo';

interface ItemRef {
  tipo: TipoItem;
  nombre: string;
  unidad: string;
  cantidad: number;
  precio_unitario: number;
  descripcion?: string;
  orden: number;
}

interface ApuSeed {
  /** Código de la actividad en catalogo_actividades */
  actividadCodigo: string;
  items: ItemRef[];
}

// ─── CATÁLOGO DE APU DE REFERENCIA ───────────────────────────────────────────
//
// Precios materiales clave 2025 (Bogotá):
//   Concreto f'c=21MPa   $480.000/m³  |  f'c=28MPa  $520.000/m³
//   Acero fy=420MPa      $3.800/kg    |  Alambre     $5.500/kg
//   Cemento Portland     $34.000/blt  |  Arena río   $95.000/m³
//   Gravilla ½"         $120.000/m³  |  Ladrillo pr $1.800/un
//   Bloque N°4           $2.100/un    |  Bloque N°5  $2.800/un
//   Teja fibrocemento    $28.500/m²   |  PVC 4"      $28.000/ml
//   PVC ½"               $8.500/ml    |  Cable 1.5mm $3.200/ml
//   Cable 2.5mm          $4.800/ml    |  Vigueta pt  $18.500/ml
//   Loseta               $4.200/un    |  Malla ES    $28.000/m²
//   Cerámica 30×30       $38.000/m²   |  Pintura v1  $48.000/gl
//
// Equipos clave (alquiler/hr):
//   Retroexcavadora $280.000  |  Motoniveladora $325.000
//   Vibrocompactador $145.000  |  Finisher        $480.000
//   Rodillo neumático $195.000 |  Vibrador conc.    $8.500
//   Volqueta 8m³   $120.000   |  Buldózer        $220.000

const CATALOGO_APU: ApuSeed[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // RESIDENCIAL — PRELIMINARES
  // ══════════════════════════════════════════════════════════════════════════

  {
    actividadCodigo: 'RES-01-001', // Localización y replanteo topográfico (m²)
    items: [
      { tipo: 'equipo',    nombre: 'Estación total / nivel óptico',     unidad: 'hr',     cantidad: 0.005,  precio_unitario: 45_000,  orden: 1 },
      { tipo: 'mano_obra', nombre: 'Topógrafo (c/ prestaciones)',        unidad: 'jornal', cantidad: 0.007,  precio_unitario: 195_000, orden: 2 },
      { tipo: 'mano_obra', nombre: 'Cadenero (c/ prestaciones)',         unidad: 'jornal', cantidad: 0.007,  precio_unitario: 102_000, orden: 3 },
      { tipo: 'material',  nombre: 'Estacas madera + pintura fluoresc.', unidad: 'gl',     cantidad: 0.01,   precio_unitario: 35_000,  orden: 4 },
    ],
  },

  {
    actividadCodigo: 'RES-01-002', // Descapote h=0.20m (m²)
    items: [
      { tipo: 'equipo',    nombre: 'Miniexcavadora / Buldózer',         unidad: 'hr',     cantidad: 0.003,  precio_unitario: 220_000, orden: 1 },
      { tipo: 'equipo',    nombre: 'Volqueta 8m³ (retiro)',             unidad: 'hr',     cantidad: 0.003,  precio_unitario: 120_000, orden: 2 },
      { tipo: 'mano_obra', nombre: 'Operador maquinaria (c/ prest.)',   unidad: 'jornal', cantidad: 0.003,  precio_unitario: 156_000, orden: 3 },
      { tipo: 'mano_obra', nombre: 'Ayudante (c/ prestaciones)',        unidad: 'jornal', cantidad: 0.015,  precio_unitario: 85_000,  orden: 4 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // RESIDENCIAL — CIMENTACIÓN
  // ══════════════════════════════════════════════════════════════════════════

  {
    actividadCodigo: 'RES-02-001', // Excavación manual h<1.50m (m³) — 8 m³/día/cuadrilla
    items: [
      { tipo: 'mano_obra', nombre: 'Oficial construcción (c/ prest.)',  unidad: 'jornal', cantidad: 0.125, precio_unitario: 118_000, orden: 1 },
      { tipo: 'mano_obra', nombre: 'Ayudante (c/ prestaciones)',        unidad: 'jornal', cantidad: 0.125, precio_unitario: 85_000,  orden: 2 },
      { tipo: 'equipo',    nombre: 'Herramienta menor (pica/pala/barra)', unidad: 'gl',   cantidad: 0.02,  precio_unitario: 85_000,  orden: 3 },
    ],
  },

  {
    actividadCodigo: 'RES-02-003', // Zapata aislada f'c=21MPa — precio por m³ de concreto (sin acero)
    items: [
      { tipo: 'material',  nombre: "Concreto premezclado f'c=21MPa",   unidad: 'm³',     cantidad: 1.05, precio_unitario: 480_000, orden: 1 },
      { tipo: 'material',  nombre: 'Formaleta metálica (amort./uso)',   unidad: 'm²',     cantidad: 3.0,  precio_unitario: 5_500,   orden: 2 },
      { tipo: 'material',  nombre: 'Curador acrílico',                  unidad: 'l',      cantidad: 0.4,  precio_unitario: 18_000,  orden: 3 },
      { tipo: 'mano_obra', nombre: 'Maestro de obra (c/ prest.)',       unidad: 'jornal', cantidad: 0.2,  precio_unitario: 156_000, orden: 4 },
      { tipo: 'mano_obra', nombre: 'Oficial construcción (c/ prest.)',  unidad: 'jornal', cantidad: 0.3,  precio_unitario: 118_000, orden: 5 },
      { tipo: 'mano_obra', nombre: 'Ayudante (c/ prestaciones)',        unidad: 'jornal', cantidad: 0.5,  precio_unitario: 85_000,  orden: 6 },
      { tipo: 'equipo',    nombre: 'Vibrador eléctrico de concreto',    unidad: 'hr',     cantidad: 2.0,  precio_unitario: 8_500,   orden: 7 },
    ],
  },

  {
    actividadCodigo: 'RES-02-004', // Viga de amarre cimentación 25×30cm (ml)
    items: [
      { tipo: 'material',  nombre: "Concreto premezclado f'c=21MPa",   unidad: 'm³',     cantidad: 0.085, precio_unitario: 480_000, orden: 1 },
      { tipo: 'material',  nombre: "Acero fy=420MPa 3/8\"",            unidad: 'kg',     cantidad: 7.5,   precio_unitario: 3_800,   orden: 2 },
      { tipo: 'material',  nombre: 'Alambre negro recocido',            unidad: 'kg',     cantidad: 0.12,  precio_unitario: 5_500,   orden: 3 },
      { tipo: 'material',  nombre: 'Formaleta metálica (amort.)',       unidad: 'm²',     cantidad: 0.6,   precio_unitario: 5_500,   orden: 4 },
      { tipo: 'mano_obra', nombre: 'Oficial construcción (c/ prest.)',  unidad: 'jornal', cantidad: 0.125, precio_unitario: 118_000, orden: 5 },
      { tipo: 'mano_obra', nombre: 'Ayudante (c/ prestaciones)',        unidad: 'jornal', cantidad: 0.125, precio_unitario: 85_000,  orden: 6 },
      { tipo: 'equipo',    nombre: 'Vibrador eléctrico de concreto',    unidad: 'hr',     cantidad: 0.5,   precio_unitario: 8_500,   orden: 7 },
    ],
  },

  {
    actividadCodigo: 'RES-02-005', // Acero de refuerzo fy=420MPa (kg)
    items: [
      { tipo: 'material',  nombre: 'Varilla corrugada fy=420MPa (c/desperdicios)', unidad: 'kg', cantidad: 1.05, precio_unitario: 3_800, orden: 1 },
      { tipo: 'material',  nombre: 'Alambre negro recocido',            unidad: 'kg',     cantidad: 0.02,  precio_unitario: 5_500,   orden: 2 },
      { tipo: 'mano_obra', nombre: 'Ferrallista (c/ prestaciones)',     unidad: 'jornal', cantidad: 0.007, precio_unitario: 134_000, orden: 3 },
      { tipo: 'mano_obra', nombre: 'Ayudante (c/ prestaciones)',        unidad: 'jornal', cantidad: 0.004, precio_unitario: 85_000,  orden: 4 },
    ],
  },

  {
    actividadCodigo: 'RES-02-008', // Losa de contrapiso e=0.10m f'c=21MPa (m²)
    items: [
      { tipo: 'material',  nombre: "Concreto premezclado f'c=21MPa",   unidad: 'm³',     cantidad: 0.11,  precio_unitario: 480_000, orden: 1 },
      { tipo: 'material',  nombre: 'Recebo compactado base',            unidad: 'm³',     cantidad: 0.12,  precio_unitario: 65_000,  orden: 2 },
      { tipo: 'material',  nombre: 'Polietileno 6 mil (barrera humedad)', unidad: 'm²',   cantidad: 1.05,  precio_unitario: 2_800,   orden: 3 },
      { tipo: 'mano_obra', nombre: 'Oficial construcción (c/ prest.)',  unidad: 'jornal', cantidad: 0.05,  precio_unitario: 118_000, orden: 4 },
      { tipo: 'mano_obra', nombre: 'Ayudante (c/ prestaciones)',        unidad: 'jornal', cantidad: 0.08,  precio_unitario: 85_000,  orden: 5 },
      { tipo: 'equipo',    nombre: 'Vibrador eléctrico de concreto',    unidad: 'hr',     cantidad: 0.3,   precio_unitario: 8_500,   orden: 6 },
      { tipo: 'equipo',    nombre: 'Regla vibratoria metálica',         unidad: 'hr',     cantidad: 0.3,   precio_unitario: 12_000,  orden: 7 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // RESIDENCIAL — ESTRUCTURA
  // ══════════════════════════════════════════════════════════════════════════

  {
    actividadCodigo: 'RES-03-001', // Concreto f'c=21MPa vigas y columnas (m³)
    items: [
      { tipo: 'material',  nombre: "Concreto premezclado f'c=21MPa",   unidad: 'm³',     cantidad: 1.05,  precio_unitario: 480_000, orden: 1 },
      { tipo: 'material',  nombre: 'Formaleta metálica (amort.)',       unidad: 'm²',     cantidad: 6.0,   precio_unitario: 5_500,   orden: 2 },
      { tipo: 'mano_obra', nombre: 'Maestro de obra (c/ prest.)',       unidad: 'jornal', cantidad: 0.2,   precio_unitario: 156_000, orden: 3 },
      { tipo: 'mano_obra', nombre: 'Oficial construcción (c/ prest.)',  unidad: 'jornal', cantidad: 0.4,   precio_unitario: 118_000, orden: 4 },
      { tipo: 'mano_obra', nombre: 'Ayudante (c/ prestaciones)',        unidad: 'jornal', cantidad: 0.6,   precio_unitario: 85_000,  orden: 5 },
      { tipo: 'equipo',    nombre: 'Vibrador eléctrico de concreto',    unidad: 'hr',     cantidad: 3.0,   precio_unitario: 8_500,   orden: 6 },
    ],
  },

  {
    actividadCodigo: 'RES-03-003', // Acero de refuerzo fy=420MPa — estructura (kg)
    items: [
      { tipo: 'material',  nombre: 'Varilla corrugada fy=420MPa (c/desperdicios)', unidad: 'kg', cantidad: 1.05, precio_unitario: 3_800, orden: 1 },
      { tipo: 'material',  nombre: 'Alambre negro recocido',            unidad: 'kg',     cantidad: 0.02,  precio_unitario: 5_500,   orden: 2 },
      { tipo: 'mano_obra', nombre: 'Ferrallista (c/ prestaciones)',     unidad: 'jornal', cantidad: 0.007, precio_unitario: 134_000, orden: 3 },
      { tipo: 'mano_obra', nombre: 'Ayudante (c/ prestaciones)',        unidad: 'jornal', cantidad: 0.004, precio_unitario: 85_000,  orden: 4 },
    ],
  },

  {
    actividadCodigo: 'RES-03-005', // Placa aligerada vigueta-loseta h=0.25m (m²)
    items: [
      { tipo: 'material',  nombre: 'Vigueta pretensada 0.10×0.25m',    unidad: 'ml',     cantidad: 8.0,   precio_unitario: 18_500,  orden: 1 },
      { tipo: 'material',  nombre: 'Loseta 50×25×5cm',                  unidad: 'un',     cantidad: 32.0,  precio_unitario: 4_200,   orden: 2 },
      { tipo: 'material',  nombre: "Concreto f'c=21MPa (capa compres.)", unidad: 'm³',    cantidad: 0.08,  precio_unitario: 480_000, orden: 3 },
      { tipo: 'material',  nombre: 'Malla electrosoldada Ø6 15×15cm',   unidad: 'm²',    cantidad: 1.05,  precio_unitario: 28_000,  orden: 4 },
      { tipo: 'mano_obra', nombre: 'Oficial construcción (c/ prest.)',  unidad: 'jornal', cantidad: 0.08,  precio_unitario: 118_000, orden: 5 },
      { tipo: 'mano_obra', nombre: 'Ayudante (c/ prestaciones)',        unidad: 'jornal', cantidad: 0.12,  precio_unitario: 85_000,  orden: 6 },
      { tipo: 'equipo',    nombre: 'Vibrador eléctrico de concreto',    unidad: 'hr',     cantidad: 0.5,   precio_unitario: 8_500,   orden: 7 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // RESIDENCIAL — MAMPOSTERÍA
  // ══════════════════════════════════════════════════════════════════════════

  {
    actividadCodigo: 'RES-04-001', // Muro ladrillo prensado e=0.15m (m²) — 12 m²/día
    items: [
      { tipo: 'material',  nombre: 'Ladrillo prensado 7×14×28cm',      unidad: 'un',     cantidad: 42.0,  precio_unitario: 1_800,   orden: 1 },
      { tipo: 'material',  nombre: 'Cemento Portland gris 50kg',        unidad: 'bulto',  cantidad: 0.2,   precio_unitario: 34_000,  orden: 2 },
      { tipo: 'material',  nombre: 'Arena de pega lavada',              unidad: 'm³',     cantidad: 0.025, precio_unitario: 95_000,  orden: 3 },
      { tipo: 'mano_obra', nombre: 'Oficial mampostería (c/ prest.)',   unidad: 'jornal', cantidad: 0.083, precio_unitario: 118_000, orden: 4 },
      { tipo: 'mano_obra', nombre: 'Ayudante (c/ prestaciones)',        unidad: 'jornal', cantidad: 0.083, precio_unitario: 85_000,  orden: 5 },
    ],
  },

  {
    actividadCodigo: 'RES-04-002', // Muro bloque N°4 e=0.10m (m²) — 15 m²/día
    items: [
      { tipo: 'material',  nombre: 'Bloque hueco N°4 (10×20×40cm)',    unidad: 'un',     cantidad: 12.5,  precio_unitario: 2_100,   orden: 1 },
      { tipo: 'material',  nombre: 'Cemento Portland gris 50kg',        unidad: 'bulto',  cantidad: 0.15,  precio_unitario: 34_000,  orden: 2 },
      { tipo: 'material',  nombre: 'Arena de pega lavada',              unidad: 'm³',     cantidad: 0.018, precio_unitario: 95_000,  orden: 3 },
      { tipo: 'mano_obra', nombre: 'Oficial mampostería (c/ prest.)',   unidad: 'jornal', cantidad: 0.067, precio_unitario: 118_000, orden: 4 },
      { tipo: 'mano_obra', nombre: 'Ayudante (c/ prestaciones)',        unidad: 'jornal', cantidad: 0.067, precio_unitario: 85_000,  orden: 5 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // RESIDENCIAL — CUBIERTA
  // ══════════════════════════════════════════════════════════════════════════

  {
    actividadCodigo: 'RES-05-001', // Teja fibrocemento Eternit onda 7 (m²)
    items: [
      { tipo: 'material',  nombre: 'Teja fibrocemento onda 7 (c/ traslape 15%)', unidad: 'm²', cantidad: 1.15, precio_unitario: 28_500, orden: 1 },
      { tipo: 'material',  nombre: 'Correa madera 4×8cm',              unidad: 'ml',     cantidad: 2.5,   precio_unitario: 5_800,   orden: 2 },
      { tipo: 'material',  nombre: 'Tornillos autorroscantes c/ caucho', unidad: 'un',    cantidad: 8.0,   precio_unitario: 380,     orden: 3 },
      { tipo: 'mano_obra', nombre: 'Oficial cubierta (c/ prestaciones)', unidad: 'jornal', cantidad: 0.07, precio_unitario: 118_000, orden: 4 },
      { tipo: 'mano_obra', nombre: 'Ayudante (c/ prestaciones)',        unidad: 'jornal', cantidad: 0.07,  precio_unitario: 85_000,  orden: 5 },
    ],
  },

  {
    actividadCodigo: 'RES-05-006', // Impermeabilización cubierta plana (m²)
    items: [
      { tipo: 'material',  nombre: 'Membrana asfáltica SBS 4mm',       unidad: 'm²',     cantidad: 1.10,  precio_unitario: 38_000,  orden: 1 },
      { tipo: 'material',  nombre: 'Imprimante asfáltico',              unidad: 'l',      cantidad: 0.30,  precio_unitario: 8_500,   orden: 2 },
      { tipo: 'material',  nombre: 'Geotextil NT-1600 (protección)',    unidad: 'm²',     cantidad: 1.05,  precio_unitario: 9_800,   orden: 3 },
      { tipo: 'mano_obra', nombre: 'Oficial impermeabilización (c/ prest.)', unidad: 'jornal', cantidad: 0.10, precio_unitario: 118_000, orden: 4 },
      { tipo: 'mano_obra', nombre: 'Ayudante (c/ prestaciones)',        unidad: 'jornal', cantidad: 0.08,  precio_unitario: 85_000,  orden: 5 },
      { tipo: 'equipo',    nombre: 'Soplete gas propano',               unidad: 'hr',     cantidad: 0.8,   precio_unitario: 4_500,   orden: 6 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // RESIDENCIAL — HIDROSANITARIAS
  // ══════════════════════════════════════════════════════════════════════════

  {
    actividadCodigo: 'RES-06-001', // Punto hidráulico PVC-P 1/2" (pto)
    items: [
      { tipo: 'material',  nombre: 'Tubería PVC-P 1/2" RDE-13.5',     unidad: 'ml',     cantidad: 3.5,   precio_unitario: 8_500,   orden: 1 },
      { tipo: 'material',  nombre: 'Codo PVC 1/2" 90°',               unidad: 'un',     cantidad: 3.0,   precio_unitario: 850,     orden: 2 },
      { tipo: 'material',  nombre: 'Tee PVC 1/2"',                    unidad: 'un',     cantidad: 1.0,   precio_unitario: 950,     orden: 3 },
      { tipo: 'material',  nombre: 'Pegamento PVC 200cc',              unidad: 'fco',    cantidad: 0.1,   precio_unitario: 22_000,  orden: 4 },
      { tipo: 'material',  nombre: 'Válvula de paso 1/2" metálica',   unidad: 'un',     cantidad: 0.5,   precio_unitario: 35_000,  orden: 5 },
      { tipo: 'mano_obra', nombre: 'Plomero oficial (c/ prestaciones)', unidad: 'jornal', cantidad: 0.25, precio_unitario: 144_000, orden: 6 },
      { tipo: 'mano_obra', nombre: 'Ayudante (c/ prestaciones)',        unidad: 'jornal', cantidad: 0.12, precio_unitario: 85_000,  orden: 7 },
    ],
  },

  {
    actividadCodigo: 'RES-06-002', // Punto sanitario PVC 4" (pto)
    items: [
      { tipo: 'material',  nombre: 'Tubería PVC sanitaria 4" RDE-32.5', unidad: 'ml',   cantidad: 3.0,   precio_unitario: 28_000,  orden: 1 },
      { tipo: 'material',  nombre: 'Tubería ventilación PVC 2"',       unidad: 'ml',     cantidad: 1.5,   precio_unitario: 12_500,  orden: 2 },
      { tipo: 'material',  nombre: 'Sifón PVC 4"',                     unidad: 'un',     cantidad: 1.0,   precio_unitario: 18_000,  orden: 3 },
      { tipo: 'material',  nombre: 'Codo PVC 4" 90°',                  unidad: 'un',     cantidad: 2.0,   precio_unitario: 9_500,   orden: 4 },
      { tipo: 'material',  nombre: 'Pegamento PVC 200cc',              unidad: 'fco',    cantidad: 0.15,  precio_unitario: 22_000,  orden: 5 },
      { tipo: 'mano_obra', nombre: 'Plomero oficial (c/ prestaciones)', unidad: 'jornal', cantidad: 0.30, precio_unitario: 144_000, orden: 6 },
      { tipo: 'mano_obra', nombre: 'Ayudante (c/ prestaciones)',        unidad: 'jornal', cantidad: 0.15, precio_unitario: 85_000,  orden: 7 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // RESIDENCIAL — ELÉCTRICAS
  // ══════════════════════════════════════════════════════════════════════════

  {
    actividadCodigo: 'RES-07-001', // Punto de iluminación (pto)
    items: [
      { tipo: 'material',  nombre: 'Cable THW 1.5mm² (F+N+T)',         unidad: 'ml',     cantidad: 4.5,   precio_unitario: 3_200,   orden: 1 },
      { tipo: 'material',  nombre: 'Tubería conduit PVC 3/4"',         unidad: 'ml',     cantidad: 3.0,   precio_unitario: 4_500,   orden: 2 },
      { tipo: 'material',  nombre: 'Caja octogonal 4"',                unidad: 'un',     cantidad: 1.0,   precio_unitario: 4_800,   orden: 3 },
      { tipo: 'material',  nombre: 'Conector conduit 3/4"',            unidad: 'un',     cantidad: 2.0,   precio_unitario: 1_200,   orden: 4 },
      { tipo: 'mano_obra', nombre: 'Electricista oficial (c/ prest.)', unidad: 'jornal', cantidad: 0.25,  precio_unitario: 144_000, orden: 5 },
      { tipo: 'mano_obra', nombre: 'Ayudante (c/ prestaciones)',        unidad: 'jornal', cantidad: 0.12, precio_unitario: 85_000,  orden: 6 },
    ],
  },

  {
    actividadCodigo: 'RES-07-002', // Punto tomacorriente doble polarizado (pto)
    items: [
      { tipo: 'material',  nombre: 'Cable THW 2.5mm² (F+N+T)',         unidad: 'ml',     cantidad: 4.5,   precio_unitario: 4_800,   orden: 1 },
      { tipo: 'material',  nombre: 'Tubería conduit PVC 3/4"',         unidad: 'ml',     cantidad: 3.0,   precio_unitario: 4_500,   orden: 2 },
      { tipo: 'material',  nombre: 'Caja rectangular 2"×4"',           unidad: 'un',     cantidad: 1.0,   precio_unitario: 3_500,   orden: 3 },
      { tipo: 'material',  nombre: 'Tomacorriente doble polarizado',   unidad: 'un',     cantidad: 1.0,   precio_unitario: 28_000,  orden: 4 },
      { tipo: 'mano_obra', nombre: 'Electricista oficial (c/ prest.)', unidad: 'jornal', cantidad: 0.25,  precio_unitario: 144_000, orden: 5 },
      { tipo: 'mano_obra', nombre: 'Ayudante (c/ prestaciones)',        unidad: 'jornal', cantidad: 0.12, precio_unitario: 85_000,  orden: 6 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // RESIDENCIAL — PAÑETES
  // ══════════════════════════════════════════════════════════════════════════

  {
    actividadCodigo: 'RES-08-001', // Pañete liso interior mortero 1:4 e=1.5cm (m²) — 12 m²/día
    items: [
      { tipo: 'material',  nombre: 'Cemento Portland gris 50kg',        unidad: 'bulto',  cantidad: 0.20,  precio_unitario: 34_000,  orden: 1 },
      { tipo: 'material',  nombre: 'Arena de pega lavada',              unidad: 'm³',     cantidad: 0.025, precio_unitario: 95_000,  orden: 2 },
      { tipo: 'material',  nombre: 'Agua (m³)',                         unidad: 'm³',     cantidad: 0.012, precio_unitario: 5_000,   orden: 3 },
      { tipo: 'mano_obra', nombre: 'Pañetero oficial (c/ prestaciones)', unidad: 'jornal', cantidad: 0.083, precio_unitario: 118_000, orden: 4 },
      { tipo: 'mano_obra', nombre: 'Ayudante (c/ prestaciones)',        unidad: 'jornal', cantidad: 0.083, precio_unitario: 85_000,  orden: 5 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // RESIDENCIAL — PISOS
  // ══════════════════════════════════════════════════════════════════════════

  {
    actividadCodigo: 'RES-09-001', // Piso cerámica 30×30 nacional (m²) — 8 m²/día
    items: [
      { tipo: 'material',  nombre: 'Cerámica 30×30cm (c/ desperdicios)', unidad: 'm²',   cantidad: 1.08,  precio_unitario: 38_000,  orden: 1 },
      { tipo: 'material',  nombre: 'Adhesivo cerámico Pegacor 25kg',    unidad: 'bulto',  cantidad: 0.30,  precio_unitario: 85_000,  orden: 2 },
      { tipo: 'material',  nombre: 'Boquilla cerámica',                 unidad: 'kg',     cantidad: 0.40,  precio_unitario: 4_200,   orden: 3 },
      { tipo: 'material',  nombre: 'Crucetas 2mm (paquete)',            unidad: 'gl',     cantidad: 0.02,  precio_unitario: 8_500,   orden: 4 },
      { tipo: 'mano_obra', nombre: 'Enchapador oficial (c/ prest.)',    unidad: 'jornal', cantidad: 0.125, precio_unitario: 118_000, orden: 5 },
      { tipo: 'mano_obra', nombre: 'Ayudante (c/ prestaciones)',        unidad: 'jornal', cantidad: 0.10,  precio_unitario: 85_000,  orden: 6 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // RESIDENCIAL — PINTURA
  // ══════════════════════════════════════════════════════════════════════════

  {
    actividadCodigo: 'RES-10-001', // Pintura vinilo tipo 1 interior 2 manos (m²) — 25 m²/día
    items: [
      { tipo: 'material',  nombre: 'Pintura vinílica tipo 1 (galón)',   unidad: 'gl',     cantidad: 0.085, precio_unitario: 48_000,  orden: 1 },
      { tipo: 'material',  nombre: 'Sellador fijador (galón)',          unidad: 'gl',     cantidad: 0.04,  precio_unitario: 38_000,  orden: 2 },
      { tipo: 'mano_obra', nombre: 'Pintor oficial (c/ prestaciones)',  unidad: 'jornal', cantidad: 0.04,  precio_unitario: 118_000, orden: 3 },
      { tipo: 'mano_obra', nombre: 'Ayudante (c/ prestaciones)',        unidad: 'jornal', cantidad: 0.03,  precio_unitario: 85_000,  orden: 4 },
      { tipo: 'equipo',    nombre: 'Compresor + pistola pulverizadora', unidad: 'hr',     cantidad: 0.30,  precio_unitario: 18_000,  orden: 5 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // INFRAESTRUCTURA — MOVIMIENTO DE TIERRAS
  // ══════════════════════════════════════════════════════════════════════════

  {
    actividadCodigo: 'VIA-02-001', // Excavación mecánica material común (m³) — 200 m³/día
    items: [
      { tipo: 'equipo',    nombre: 'Retroexcavadora CAT 320',          unidad: 'hr',     cantidad: 0.05,  precio_unitario: 280_000, orden: 1 },
      { tipo: 'equipo',    nombre: 'Volqueta 8m³',                     unidad: 'hr',     cantidad: 0.10,  precio_unitario: 120_000, orden: 2 },
      { tipo: 'mano_obra', nombre: 'Operador retroexcavadora (c/ prest.)', unidad: 'jornal', cantidad: 0.05, precio_unitario: 156_000, orden: 3 },
      { tipo: 'mano_obra', nombre: 'Conductor volqueta (c/ prest.)',   unidad: 'jornal', cantidad: 0.05,  precio_unitario: 134_000, orden: 4 },
    ],
  },

  {
    actividadCodigo: 'VIA-02-003', // Relleno y compactación material propio (m³)
    items: [
      { tipo: 'equipo',    nombre: 'Vibrocompactador de suelos',       unidad: 'hr',     cantidad: 0.05,  precio_unitario: 145_000, orden: 1 },
      { tipo: 'mano_obra', nombre: 'Operador compactador (c/ prest.)', unidad: 'jornal', cantidad: 0.05,  precio_unitario: 134_000, orden: 2 },
      { tipo: 'mano_obra', nombre: 'Ayudante (c/ prestaciones)',        unidad: 'jornal', cantidad: 0.05, precio_unitario: 85_000,  orden: 3 },
      { tipo: 'material',  nombre: 'Agua para humectación',             unidad: 'm³',     cantidad: 0.08,  precio_unitario: 5_000,   orden: 4 },
    ],
  },

  {
    actividadCodigo: 'VIA-02-006', // Perfilado y compactación subrasante (m²)
    items: [
      { tipo: 'equipo',    nombre: 'Motoniveladora 140G',              unidad: 'hr',     cantidad: 0.006, precio_unitario: 325_000, orden: 1 },
      { tipo: 'equipo',    nombre: 'Vibrocompactador pata de cabra',   unidad: 'hr',     cantidad: 0.006, precio_unitario: 145_000, orden: 2 },
      { tipo: 'mano_obra', nombre: 'Operador motoniveladora (c/ prest.)', unidad: 'jornal', cantidad: 0.006, precio_unitario: 156_000, orden: 3 },
      { tipo: 'mano_obra', nombre: 'Topógrafo nivelación (c/ prest.)', unidad: 'jornal', cantidad: 0.006, precio_unitario: 195_000, orden: 4 },
      { tipo: 'material',  nombre: 'Agua para humectación',             unidad: 'm³',     cantidad: 0.02,  precio_unitario: 5_000,   orden: 5 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // INFRAESTRUCTURA — DRENAJE
  // ══════════════════════════════════════════════════════════════════════════

  {
    actividadCodigo: 'VIA-03-001', // Cuneta revestida concreto f'c=21MPa (ml)
    items: [
      { tipo: 'material',  nombre: "Concreto premezclado f'c=21MPa",   unidad: 'm³',     cantidad: 0.09,  precio_unitario: 480_000, orden: 1 },
      { tipo: 'material',  nombre: 'Formaleta metálica (amort.)',       unidad: 'm²',     cantidad: 0.8,   precio_unitario: 5_500,   orden: 2 },
      { tipo: 'mano_obra', nombre: 'Maestro de obra (c/ prest.)',       unidad: 'jornal', cantidad: 0.05,  precio_unitario: 156_000, orden: 3 },
      { tipo: 'mano_obra', nombre: 'Oficial construcción (c/ prest.)',  unidad: 'jornal', cantidad: 0.12,  precio_unitario: 118_000, orden: 4 },
      { tipo: 'mano_obra', nombre: 'Ayudante (c/ prestaciones)',        unidad: 'jornal', cantidad: 0.12,  precio_unitario: 85_000,  orden: 5 },
      { tipo: 'equipo',    nombre: 'Vibrador de concreto',              unidad: 'hr',     cantidad: 0.5,   precio_unitario: 8_500,   orden: 6 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // INFRAESTRUCTURA — SUB-BASE Y BASE GRANULAR
  // ══════════════════════════════════════════════════════════════════════════

  {
    actividadCodigo: 'VIA-04-001', // Sub-base granular compactada (m³)
    items: [
      { tipo: 'material',  nombre: 'Material SBG-1 INVIAS (cantera)',  unidad: 'm³',     cantidad: 1.25,  precio_unitario: 42_000,  orden: 1 },
      { tipo: 'material',  nombre: 'Agua para humectación',             unidad: 'm³',     cantidad: 0.12,  precio_unitario: 5_000,   orden: 2 },
      { tipo: 'equipo',    nombre: 'Motoniveladora 140G',               unidad: 'hr',     cantidad: 0.02,  precio_unitario: 325_000, orden: 3 },
      { tipo: 'equipo',    nombre: 'Vibrocompactador pata de cabra',   unidad: 'hr',     cantidad: 0.02,  precio_unitario: 145_000, orden: 4 },
      { tipo: 'equipo',    nombre: 'Volqueta 8m³ (transporte)',        unidad: 'hr',     cantidad: 0.015, precio_unitario: 120_000, orden: 5 },
      { tipo: 'mano_obra', nombre: 'Operador motoniveladora (c/ prest.)', unidad: 'jornal', cantidad: 0.02, precio_unitario: 156_000, orden: 6 },
    ],
  },

  {
    actividadCodigo: 'VIA-04-002', // Base granular compactada (m³)
    items: [
      { tipo: 'material',  nombre: 'Material BG-1 INVIAS triturado',   unidad: 'm³',     cantidad: 1.25,  precio_unitario: 58_000,  orden: 1 },
      { tipo: 'material',  nombre: 'Agua para humectación',             unidad: 'm³',     cantidad: 0.10,  precio_unitario: 5_000,   orden: 2 },
      { tipo: 'equipo',    nombre: 'Motoniveladora 140G',               unidad: 'hr',     cantidad: 0.025, precio_unitario: 325_000, orden: 3 },
      { tipo: 'equipo',    nombre: 'Vibrocompactador pata de cabra',   unidad: 'hr',     cantidad: 0.025, precio_unitario: 145_000, orden: 4 },
      { tipo: 'equipo',    nombre: 'Volqueta 8m³ (transporte)',        unidad: 'hr',     cantidad: 0.02,  precio_unitario: 120_000, orden: 5 },
      { tipo: 'mano_obra', nombre: 'Operador maquinaria (c/ prest.)',  unidad: 'jornal', cantidad: 0.025, precio_unitario: 156_000, orden: 6 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // INFRAESTRUCTURA — PAVIMENTO
  // ══════════════════════════════════════════════════════════════════════════

  {
    actividadCodigo: 'VIA-05-001', // Carpeta asfáltica MDC-19 e=0.07m (ton)
    items: [
      { tipo: 'material',  nombre: 'Mezcla densa MDC-19 en planta',    unidad: 'ton',    cantidad: 1.02,  precio_unitario: 195_000, orden: 1 },
      { tipo: 'equipo',    nombre: 'Finisher asfáltico',               unidad: 'hr',     cantidad: 0.006, precio_unitario: 480_000, orden: 2 },
      { tipo: 'equipo',    nombre: 'Rodillo neumático 10 ton',         unidad: 'hr',     cantidad: 0.006, precio_unitario: 195_000, orden: 3 },
      { tipo: 'equipo',    nombre: 'Rodillo liso vibratorio',          unidad: 'hr',     cantidad: 0.006, precio_unitario: 165_000, orden: 4 },
      { tipo: 'equipo',    nombre: 'Volqueta termosellada',            unidad: 'hr',     cantidad: 0.008, precio_unitario: 120_000, orden: 5 },
      { tipo: 'mano_obra', nombre: 'Operador finisher (c/ prest.)',    unidad: 'jornal', cantidad: 0.006, precio_unitario: 156_000, orden: 6 },
      { tipo: 'mano_obra', nombre: 'Operador rodillo (c/ prest.)',     unidad: 'jornal', cantidad: 0.006, precio_unitario: 134_000, orden: 7 },
      { tipo: 'mano_obra', nombre: 'Ayudante palero (c/ prest.)',       unidad: 'jornal', cantidad: 0.012, precio_unitario: 85_000,  orden: 8 },
    ],
  },

  {
    actividadCodigo: 'VIA-05-003', // Pavimento rígido f'c=28MPa e=0.20m (m²)
    items: [
      { tipo: 'material',  nombre: "Concreto premezclado f'c=28MPa",   unidad: 'm³',     cantidad: 0.22,  precio_unitario: 520_000, orden: 1 },
      { tipo: 'material',  nombre: 'Dowel barra 1" lisa (junta transv.)', unidad: 'un',  cantidad: 0.5,   precio_unitario: 18_000,  orden: 2 },
      { tipo: 'material',  nombre: 'Sello de junta poliuretano',       unidad: 'ml',     cantidad: 0.5,   precio_unitario: 12_000,  orden: 3 },
      { tipo: 'material',  nombre: 'Curador acrílico',                  unidad: 'l',      cantidad: 0.15,  precio_unitario: 18_000,  orden: 4 },
      { tipo: 'mano_obra', nombre: 'Maestro de obra (c/ prest.)',       unidad: 'jornal', cantidad: 0.02,  precio_unitario: 156_000, orden: 5 },
      { tipo: 'mano_obra', nombre: 'Oficial construcción (c/ prest.)',  unidad: 'jornal', cantidad: 0.05,  precio_unitario: 118_000, orden: 6 },
      { tipo: 'mano_obra', nombre: 'Ayudante (c/ prestaciones)',        unidad: 'jornal', cantidad: 0.08,  precio_unitario: 85_000,  orden: 7 },
      { tipo: 'equipo',    nombre: 'Vibrador de concreto',              unidad: 'hr',     cantidad: 0.5,   precio_unitario: 8_500,   orden: 8 },
      { tipo: 'equipo',    nombre: 'Regla vibratoria metálica',         unidad: 'hr',     cantidad: 0.5,   precio_unitario: 12_000,  orden: 9 },
      { tipo: 'equipo',    nombre: 'Cortadora de disco (junta)',        unidad: 'hr',     cantidad: 0.1,   precio_unitario: 45_000,  orden: 10 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // INFRAESTRUCTURA — SEÑALIZACIÓN
  // ══════════════════════════════════════════════════════════════════════════

  {
    actividadCodigo: 'VIA-06-001', // Demarcación línea central termoplástica (ml)
    items: [
      { tipo: 'material',  nombre: 'Termoplástico blanco',              unidad: 'kg',     cantidad: 0.40,  precio_unitario: 9_800,   orden: 1 },
      { tipo: 'material',  nombre: 'Microesferas de vidrio retroreflect.', unidad: 'kg',  cantidad: 0.08,  precio_unitario: 12_000,  orden: 2 },
      { tipo: 'equipo',    nombre: 'Máquina termoplástica autopropulsada', unidad: 'hr',  cantidad: 0.005, precio_unitario: 185_000, orden: 3 },
      { tipo: 'mano_obra', nombre: 'Operador demarcación (c/ prest.)',  unidad: 'jornal', cantidad: 0.005, precio_unitario: 134_000, orden: 4 },
      { tipo: 'mano_obra', nombre: 'Ayudante señalización (c/ prest.)', unidad: 'jornal', cantidad: 0.005, precio_unitario: 85_000,  orden: 5 },
    ],
  },

  {
    actividadCodigo: 'VIA-06-003', // Señal vertical preventiva poste+placa (un)
    items: [
      { tipo: 'material',  nombre: 'Placa aluminio lámina Tipo III reflectiva', unidad: 'un', cantidad: 1.0, precio_unitario: 145_000, orden: 1 },
      { tipo: 'material',  nombre: 'Poste galvanizado 2" × 2.5m',      unidad: 'un',     cantidad: 1.0,   precio_unitario: 65_000,  orden: 2 },
      { tipo: 'material',  nombre: 'Anclaje concreto base poste',       unidad: 'gl',     cantidad: 1.0,   precio_unitario: 18_000,  orden: 3 },
      { tipo: 'mano_obra', nombre: 'Oficial señalización (c/ prest.)',  unidad: 'jornal', cantidad: 0.25,  precio_unitario: 118_000, orden: 4 },
      { tipo: 'mano_obra', nombre: 'Ayudante (c/ prestaciones)',        unidad: 'jornal', cantidad: 0.25,  precio_unitario: 85_000,  orden: 5 },
    ],
  },
];

// ─── Conexión ────────────────────────────────────────────────────────────────

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

// ─── Runner ──────────────────────────────────────────────────────────────────

async function seed(client: Client, isDryRun: boolean, isReset: boolean): Promise<void> {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║   SIPO — Seed APU Items de Referencia 2025     ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  // Validar que los códigos de actividad existen
  console.log('🔍 Validando códigos de actividad...');
  const codigos = CATALOGO_APU.map(a => a.actividadCodigo);
  const { rows: found } = await client.query(
    'SELECT codigo FROM catalogo_actividades WHERE codigo = ANY($1)',
    [codigos]
  );
  const foundSet = new Set(found.map((r: any) => r.codigo));
  const missing  = codigos.filter(c => !foundSet.has(c));

  if (missing.length > 0) {
    console.error(`\n❌ Actividades no encontradas en BD: ${missing.join(', ')}`);
    console.error('   Ejecuta primero: npm run seed:catalogo\n');
    process.exit(1);
  }
  console.log(`✅ ${codigos.length} códigos validados\n`);

  if (isDryRun) {
    console.log('🏃 Modo DRY-RUN — sin cambios en BD.');
    return;
  }

  await client.query('BEGIN');
  try {
    if (isReset) {
      console.log('🗑️  --reset: eliminando APU items existentes...');
      await client.query('DELETE FROM catalogo_apu_items');
    }

    let totalItems = 0;

    for (const apuSeed of CATALOGO_APU) {
      // Obtener el ID de la actividad
      const { rows } = await client.query<{ id: string }>(
        'SELECT id FROM catalogo_actividades WHERE codigo = $1 LIMIT 1',
        [apuSeed.actividadCodigo]
      );
      if (!rows[0]) continue;
      const actividadId = rows[0].id;

      // Borrar items previos para esta actividad (upsert by deletion)
      await client.query(
        'DELETE FROM catalogo_apu_items WHERE catalogo_actividad_id = $1',
        [actividadId]
      );

      // Insertar los nuevos items
      for (const item of apuSeed.items) {
        await client.query(
          `INSERT INTO catalogo_apu_items
             (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [actividadId, item.tipo, item.nombre, item.unidad,
           item.cantidad, item.precio_unitario, item.orden]
        );
        totalItems++;
      }

      const directCost = apuSeed.items.reduce(
        (acc, i) => acc + i.cantidad * i.precio_unitario, 0
      );
      const moTotal = apuSeed.items
        .filter(i => i.tipo === 'mano_obra')
        .reduce((acc, i) => acc + i.cantidad * i.precio_unitario, 0);
      const withHmEpp = directCost + moTotal * 0.04;

      console.log(
        `  ✓ ${apuSeed.actividadCodigo.padEnd(14)} — ${apuSeed.items.length} ítems ` +
        `| costo directo ≈ $${Math.round(withHmEpp).toLocaleString('es-CO')}`
      );
    }

    await client.query('COMMIT');

    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║                  RESUMEN                       ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log(`  Actividades con APU : ${CATALOGO_APU.length}`);
    console.log(`  Ítems insertados    : ${totalItems}`);
    console.log('\n🎉 APU de referencia listos. Los próximos imports precargan el APU.\n');

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

// ─── Entry point ─────────────────────────────────────────────────────────────

const args     = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isReset  = args.includes('--reset');

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
