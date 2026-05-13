-- ============================================================
-- SIPO — Columnas faltantes en budgets, activities y apu_items
-- Corrige la brecha entre el esquema TypeScript y la BD real.
-- ============================================================

-- ─── budgets: campos AIU detallado ───────────────────────────────────────────
ALTER TABLE budgets
  ADD COLUMN IF NOT EXISTS metodo_aiu           TEXT    DEFAULT 'porcentaje'
    CHECK (metodo_aiu IN ('porcentaje', 'detallado')),
  ADD COLUMN IF NOT EXISTS administracion_pct   NUMERIC DEFAULT 10,
  ADD COLUMN IF NOT EXISTS imprevistos_pct      NUMERIC DEFAULT 5,
  ADD COLUMN IF NOT EXISTS utilidad_pct         NUMERIC DEFAULT 10,
  ADD COLUMN IF NOT EXISTS gastos_fijos_mensuales NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duracion_meses       NUMERIC DEFAULT 1,
  ADD COLUMN IF NOT EXISTS metodo_iva           TEXT    DEFAULT 'no_aplica'
    CHECK (metodo_iva IN ('no_aplica', 'sobre_utilidad', 'sobre_aiu', 'sobre_total')),
  ADD COLUMN IF NOT EXISTS mostrar_retenciones  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS retefuente_pct       NUMERIC DEFAULT 2,
  ADD COLUMN IF NOT EXISTS ica_pct              NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reteiva_pct          NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ciudad_ica           TEXT    DEFAULT 'Bogotá D.C.',
  ADD COLUMN IF NOT EXISTS vigencia_dias        INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS fecha_elaboracion    DATE    DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS costo_directo        NUMERIC DEFAULT 0;

-- Rellenar columnas AIU con valor de aiu_porcentaje existente
-- (divide el porcentaje histórico: 40% admin, 30% imprevistos, 30% utilidad)
UPDATE budgets
SET
  administracion_pct = ROUND(aiu_porcentaje * 0.4, 2),
  imprevistos_pct    = ROUND(aiu_porcentaje * 0.3, 2),
  utilidad_pct       = ROUND(aiu_porcentaje * 0.3, 2)
WHERE administracion_pct = 10 AND aiu_porcentaje IS NOT NULL AND aiu_porcentaje <> 25;

-- ─── activities: campo precio_desde_apu ──────────────────────────────────────
ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS precio_desde_apu BOOLEAN DEFAULT false;

-- ─── apu_items: ampliar constraint tipo para incluir herramienta_menor y epp ─
ALTER TABLE apu_items DROP CONSTRAINT IF EXISTS apu_items_tipo_check;
ALTER TABLE apu_items
  ADD CONSTRAINT apu_items_tipo_check
    CHECK (tipo IN ('material', 'mano_obra', 'equipo', 'herramienta_menor', 'epp'));

-- ─── projects: alinear estados con TypeScript (cotizacion/ejecucion/terminado)
-- El schema original usaba 'activo'/'pausado'/'completado'
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_estado_check;
ALTER TABLE projects
  ADD CONSTRAINT projects_estado_check
    CHECK (estado IN ('activo', 'pausado', 'completado', 'cotizacion', 'ejecucion', 'terminado'));

-- ─── budgets: ampliar estados con los del TS Budget interface ────────────────
-- 'en_revision' viene de budget_estados migration, pero el TS usa 'revision'
-- Aceptamos ambos para compatibilidad
ALTER TABLE budgets DROP CONSTRAINT IF EXISTS check_budget_estado;
ALTER TABLE budgets
  ADD CONSTRAINT check_budget_estado
    CHECK (estado IN ('borrador', 'revision', 'en_revision', 'enviado', 'aprobado', 'rechazado', 'archivado'));
