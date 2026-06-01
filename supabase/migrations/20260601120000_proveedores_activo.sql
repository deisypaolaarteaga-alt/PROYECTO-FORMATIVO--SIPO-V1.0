-- Columna activo para inhabilitar/habilitar proveedores sin eliminarlos.
-- deleted_at sigue representando eliminación lógica (no aparece ni activo ni inactivo).
ALTER TABLE proveedores
  ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_proveedores_activo
  ON proveedores(user_id, activo) WHERE deleted_at IS NULL;
