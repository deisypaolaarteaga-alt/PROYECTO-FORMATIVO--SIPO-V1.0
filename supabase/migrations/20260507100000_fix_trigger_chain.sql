-- ============================================================
-- SIPO — Recrear cadena de triggers del motor de cálculo
-- Corrige: soft-delete no filtrado, triggers posiblemente ausentes
-- Idempotente: seguro de re-ejecutar.
-- ============================================================

-- ── 1. FUNCIÓN: APU → activities.precio_unitario ─────────────
-- Cuando se inserta o actualiza un APU, el precio unitario de la
-- actividad vinculada se actualiza automáticamente con costo_total.

CREATE OR REPLACE FUNCTION sync_activity_precio_from_apu()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE activities
  SET
    precio_unitario  = NEW.costo_total,
    precio_desde_apu = true,
    updated_at       = NOW()
  WHERE id = NEW.activity_id
    AND deleted_at IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_activity_precio ON apus;
CREATE TRIGGER trg_sync_activity_precio
  AFTER INSERT OR UPDATE ON apus
  FOR EACH ROW
  EXECUTE FUNCTION sync_activity_precio_from_apu();

-- ── 2. FUNCIÓN: activities → chapters.valor_subtotal ─────────
-- Cuando cambia una actividad (precio, cantidad o borrado lógico),
-- recalcula el subtotal del capítulo sumando solo las activas.

CREATE OR REPLACE FUNCTION sync_chapter_subtotal()
RETURNS TRIGGER AS $$
DECLARE
  v_chapter_id UUID;
BEGIN
  v_chapter_id := COALESCE(NEW.chapter_id, OLD.chapter_id);

  UPDATE chapters
  SET
    valor_subtotal = (
      SELECT COALESCE(SUM(cantidad * precio_unitario), 0)
      FROM   activities
      WHERE  chapter_id = v_chapter_id
        AND  deleted_at IS NULL
    ),
    updated_at = NOW()
  WHERE id         = v_chapter_id
    AND deleted_at IS NULL;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_chapter_subtotal ON activities;
CREATE TRIGGER trg_sync_chapter_subtotal
  AFTER INSERT OR UPDATE OR DELETE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION sync_chapter_subtotal();

-- ── 3. FUNCIÓN: chapters → budgets.costo_directo ─────────────
-- Cuando cambia el subtotal de un capítulo (o se borra lógicamente),
-- recalcula el costo directo del presupuesto sumando solo capítulos activos.

CREATE OR REPLACE FUNCTION sync_budget_costo_directo()
RETURNS TRIGGER AS $$
DECLARE
  v_budget_id UUID;
BEGIN
  v_budget_id := COALESCE(NEW.budget_id, OLD.budget_id);

  UPDATE budgets
  SET
    costo_directo = (
      SELECT COALESCE(SUM(valor_subtotal), 0)
      FROM   chapters
      WHERE  budget_id  = v_budget_id
        AND  deleted_at IS NULL
    ),
    updated_at = NOW()
  WHERE id         = v_budget_id
    AND deleted_at IS NULL;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_budget_costo ON chapters;
CREATE TRIGGER trg_sync_budget_costo
  AFTER INSERT OR UPDATE OR DELETE ON chapters
  FOR EACH ROW
  EXECUTE FUNCTION sync_budget_costo_directo();

-- ── 4. RECÁLCULO DE DATOS EXISTENTES ─────────────────────────
-- Recalcula en orden: capítulos primero, luego presupuestos.
-- Necesario para actividades/APUs que ya existen en BD.

-- 4a. Recalcular valor_subtotal de todos los capítulos activos
UPDATE chapters ch
SET valor_subtotal = (
  SELECT COALESCE(SUM(a.cantidad * a.precio_unitario), 0)
  FROM   activities a
  WHERE  a.chapter_id = ch.id
    AND  a.deleted_at IS NULL
),
updated_at = NOW()
WHERE ch.deleted_at IS NULL;

-- 4b. Recalcular costo_directo de todos los presupuestos activos
UPDATE budgets b
SET costo_directo = (
  SELECT COALESCE(SUM(ch.valor_subtotal), 0)
  FROM   chapters ch
  WHERE  ch.budget_id = b.id
    AND  ch.deleted_at IS NULL
),
updated_at = NOW()
WHERE b.deleted_at IS NULL;

-- ── FIN ───────────────────────────────────────────────────────
-- Verificar después de aplicar:
-- SELECT budget_id, costo_directo FROM v_resumen_presupuesto LIMIT 5;
