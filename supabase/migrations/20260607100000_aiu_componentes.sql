-- ============================================================
-- SIPO — Migración: Tabla aiu_componentes
-- Detalle de gastos mensuales de Administración en AIU detallado
-- ============================================================

CREATE TABLE IF NOT EXISTS aiu_componentes (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id    UUID         NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  user_id      UUID         NOT NULL REFERENCES auth.users(id),
  nombre       TEXT         NOT NULL,
  valor_mensual NUMERIC(15,2) NOT NULL DEFAULT 0,
  orden        INTEGER      NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ  DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aiu_componentes_budget
  ON aiu_componentes(budget_id);

ALTER TABLE aiu_componentes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "aiu_componentes_crud" ON aiu_componentes;
CREATE POLICY "aiu_componentes_crud" ON aiu_componentes
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
