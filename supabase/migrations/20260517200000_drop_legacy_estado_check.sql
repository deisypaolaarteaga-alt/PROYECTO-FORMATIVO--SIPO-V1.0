-- ============================================================
-- SIPO — Eliminar constraint de estado legado
-- 20260517200000_drop_legacy_estado_check.sql
-- ============================================================

-- El constraint original `budgets_estado_check` no incluye 'en_revision'
-- y bloquea la transición borrador → en_revision.
-- El constraint correcto `check_budget_estado` ya fue creado en
-- 20260517100000_budget_aprobacion.sql.
ALTER TABLE budgets
  DROP CONSTRAINT IF EXISTS budgets_estado_check;
