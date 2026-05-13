-- ============================================================
-- SIPO — Migración: Motor de cálculo profesional colombiano
-- Ejecutar en Supabase SQL Editor
-- ============================================================
-- Este archivo corrige el schema para implementar correctamente
-- la metodología colombiana de presupuestos de obra.
-- ============================================================

-- ── 1. TABLA: projects ──────────────────────────────────────
-- Corrección: estados y tipo_obra alineados con la metodología

ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS projects_estado_check;

ALTER TABLE projects
  ADD CONSTRAINT projects_estado_check
    CHECK (estado IN ('cotizacion', 'ejecucion', 'terminado'));

-- Migrar estados existentes al nuevo formato
UPDATE projects SET estado = 'cotizacion' WHERE estado = 'activo';
UPDATE projects SET estado = 'terminado'  WHERE estado = 'completado';
UPDATE projects SET estado = 'ejecucion'  WHERE estado = 'pausado';

ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS projects_tipo_obra_check;

ALTER TABLE projects
  ADD CONSTRAINT projects_tipo_obra_check
    CHECK (tipo_obra IN (
      'residencial', 'comercial', 'industrial',
      'infraestructura', 'institucional', 'otro'
    ) OR tipo_obra IS NULL);

-- ── 2. TABLA: budgets ───────────────────────────────────────
-- AIU separado en 3 componentes, retenciones, vigencia

-- Agregar nuevas columnas
ALTER TABLE budgets
  ADD COLUMN IF NOT EXISTS fecha_elaboracion DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS vigencia_dias INT DEFAULT 30,
  ADD COLUMN IF NOT EXISTS administracion_pct NUMERIC DEFAULT 10,
  ADD COLUMN IF NOT EXISTS imprevistos_pct NUMERIC DEFAULT 5,
  ADD COLUMN IF NOT EXISTS utilidad_pct NUMERIC DEFAULT 10,
  ADD COLUMN IF NOT EXISTS retefuente_pct NUMERIC DEFAULT 2,
  ADD COLUMN IF NOT EXISTS ica_pct NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS costo_directo NUMERIC DEFAULT 0;

-- Migrar el campo aiu_porcentaje: si ya existe, distribuir como 10+5+10
-- (asumimos el valor anterior era el total AIU)
-- En caso de no existir ya administracion_pct, los defaults aplican
-- Si el usuario tenía aiu_porcentaje = 25 → admin=10, imprev=5, util=10 ✓

-- Renombrar valor_total a costo_directo conceptualmente (mantener campo para compatibilidad)
-- valor_total seguirá siendo el total final (CD + AIU + IVA)

-- ── 3. TABLA: apus ──────────────────────────────────────────
-- Agregar columnas HM y EPP

ALTER TABLE apus
  ADD COLUMN IF NOT EXISTS costo_herramienta_menor NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS costo_epp NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pct_herramienta_menor NUMERIC DEFAULT 3,
  ADD COLUMN IF NOT EXISTS pct_epp NUMERIC DEFAULT 1;

-- Recalcular costo_total para incluir HM y EPP
-- (Los APUs existentes no tenían HM/EPP, se recalculan en 0)
-- La función GENERATED necesita ser reemplazada por un campo calculable

-- Eliminar la columna generada existente y reemplazar con campo normal
ALTER TABLE apus DROP COLUMN IF EXISTS costo_total;
ALTER TABLE apus ADD COLUMN costo_total NUMERIC GENERATED ALWAYS AS 
  (costo_material + costo_mano_obra + costo_equipo + costo_herramienta_menor + costo_epp) STORED;

-- ── 4. TABLA: apu_items ─────────────────────────────────────
-- Agregar tipos herramienta_menor y epp

ALTER TABLE apu_items
  DROP CONSTRAINT IF EXISTS apu_items_tipo_check;

ALTER TABLE apu_items
  ADD CONSTRAINT apu_items_tipo_check
    CHECK (tipo IN ('material', 'mano_obra', 'equipo', 'herramienta_menor', 'epp'));

-- ── 5. TABLA: activities ────────────────────────────────────
-- precio_unitario viene del APU — agregar columna para bloquear edición manual

ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS precio_desde_apu BOOLEAN DEFAULT false;

-- ── 6. TRIGGER: actualizar precio_unitario desde APU ────────
-- Cuando se modifica el APU, actualizar precio_unitario de la actividad

CREATE OR REPLACE FUNCTION sync_activity_precio_from_apu()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE activities
  SET
    precio_unitario = NEW.costo_total,
    precio_desde_apu = true,
    updated_at = NOW()
  WHERE id = NEW.activity_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_activity_precio ON apus;
CREATE TRIGGER trg_sync_activity_precio
  AFTER INSERT OR UPDATE ON apus
  FOR EACH ROW
  EXECUTE FUNCTION sync_activity_precio_from_apu();

-- ── 7. TRIGGER: actualizar valor_subtotal en chapters ───────

CREATE OR REPLACE FUNCTION sync_chapter_subtotal()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chapters
  SET
    valor_subtotal = (
      SELECT COALESCE(SUM(cantidad * precio_unitario), 0)
      FROM activities
      WHERE chapter_id = COALESCE(NEW.chapter_id, OLD.chapter_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.chapter_id, OLD.chapter_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_chapter_subtotal ON activities;
CREATE TRIGGER trg_sync_chapter_subtotal
  AFTER INSERT OR UPDATE OR DELETE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION sync_chapter_subtotal();

-- ── 8. TRIGGER: actualizar costo_directo en budgets ─────────

CREATE OR REPLACE FUNCTION sync_budget_costo_directo()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE budgets
  SET
    costo_directo = (
      SELECT COALESCE(SUM(valor_subtotal), 0)
      FROM chapters
      WHERE budget_id = COALESCE(NEW.budget_id, OLD.budget_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.budget_id, OLD.budget_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_budget_costo ON chapters;
CREATE TRIGGER trg_sync_budget_costo
  AFTER INSERT OR UPDATE OR DELETE ON chapters
  FOR EACH ROW
  EXECUTE FUNCTION sync_budget_costo_directo();

-- ── 9. VISTA: resumen_presupuesto ───────────────────────────
-- Vista conveniente para calcular el resumen financiero

CREATE OR REPLACE VIEW v_resumen_presupuesto AS
SELECT
  b.id AS budget_id,
  b.titulo,
  b.costo_directo AS costo_directo,
  -- AIU
  b.costo_directo * (b.administracion_pct / 100) AS administracion,
  b.costo_directo * (b.imprevistos_pct    / 100) AS imprevistos,
  b.costo_directo * (b.utilidad_pct       / 100) AS utilidad,
  b.costo_directo * ((b.administracion_pct + b.imprevistos_pct + b.utilidad_pct) / 100) AS aiu,
  -- Subtotal con AIU
  b.costo_directo * (1 + (b.administracion_pct + b.imprevistos_pct + b.utilidad_pct) / 100) AS subtotal_con_aiu,
  -- IVA sobre (CD + AIU)
  b.costo_directo * (1 + (b.administracion_pct + b.imprevistos_pct + b.utilidad_pct) / 100)
    * (b.iva_porcentaje / 100) AS iva,
  -- Total oferta
  b.costo_directo * (1 + (b.administracion_pct + b.imprevistos_pct + b.utilidad_pct) / 100)
    * (1 + b.iva_porcentaje / 100) AS total_oferta,
  -- Retenciones
  b.costo_directo * (b.retefuente_pct / 100) AS retefuente,
  b.costo_directo * (1 + (b.administracion_pct + b.imprevistos_pct + b.utilidad_pct) / 100)
    * (b.ica_pct / 100) AS ica
FROM budgets b;

-- ── FIN MIGRACIÓN ────────────────────────────────────────────
-- Verifica que todo quedó bien:
-- SELECT * FROM v_resumen_presupuesto LIMIT 5;
