-- Migración idempotente: extiende budget_snapshots con columnas para versionado completo

ALTER TABLE budget_snapshots
  ADD COLUMN IF NOT EXISTS version       INTEGER       NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS motivo        TEXT          CHECK (motivo IN ('rechazo_cliente','reapertura_manual','aprobacion')),
  ADD COLUMN IF NOT EXISTS estado_budget TEXT,
  ADD COLUMN IF NOT EXISTS total_oferta  NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS costo_directo NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS data          JSONB;

-- Índice para listar versiones de un presupuesto ordenadas descendentemente
CREATE INDEX IF NOT EXISTS idx_budget_snapshots_budget_id
  ON budget_snapshots(budget_id, version DESC);
