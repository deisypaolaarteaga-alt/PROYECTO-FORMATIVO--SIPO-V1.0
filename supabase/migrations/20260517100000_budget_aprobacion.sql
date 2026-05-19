-- ============================================================
-- SIPO — Flujo de aprobación de presupuestos
-- 20260517100000_budget_aprobacion.sql
-- ============================================================

-- 1. Columna aprobado_en — ya puede existir; ADD IF NOT EXISTS es no-op seguro
ALTER TABLE budgets
  ADD COLUMN IF NOT EXISTS aprobado_en TIMESTAMPTZ NULL;

-- 2. Normalizar constraint de estados
--    La migración 20260505200000 agregó 'revision' y 'enviado' para compatibilidad
--    pero el TS nunca los usa. Primero migramos filas huérfanas, luego ajustamos.
UPDATE budgets SET estado = 'en_revision' WHERE estado IN ('revision', 'enviado');
UPDATE budgets SET estado = 'borrador'    WHERE estado NOT IN
  ('borrador', 'en_revision', 'aprobado', 'rechazado', 'archivado');

ALTER TABLE budgets DROP CONSTRAINT IF EXISTS check_budget_estado;
ALTER TABLE budgets
  ADD CONSTRAINT check_budget_estado
    CHECK (estado IN ('borrador', 'en_revision', 'aprobado', 'rechazado', 'archivado'));

-- 3. Actualizar trigger: llenar aprobado_en al aprobar, limpiar al reabrir
--    Reemplaza fn_increment_budget_version de 20260504104500_budget_estados.sql
CREATE OR REPLACE FUNCTION fn_increment_budget_version()
RETURNS TRIGGER AS $$
BEGIN
  -- borrador/en_revision → aprobado: registrar fecha y aumentar versión
  IF NEW.estado = 'aprobado' AND OLD.estado <> 'aprobado' THEN
    NEW.version     := COALESCE(OLD.version, 1) + 1;
    NEW.aprobado_en := NOW();
  END IF;

  -- aprobado → borrador (reapertura): limpiar fecha de aprobación
  IF NEW.estado = 'borrador' AND OLD.estado = 'aprobado' THEN
    NEW.aprobado_en := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_budget_version ON budgets;
CREATE TRIGGER trg_budget_version
  BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION fn_increment_budget_version();
