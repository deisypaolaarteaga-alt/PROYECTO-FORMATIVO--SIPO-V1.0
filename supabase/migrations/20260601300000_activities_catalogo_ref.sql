-- ============================================================
-- SIPO — Trazabilidad: columna catalogo_actividad_id en activities
-- Permite saber de qué actividad del catálogo proviene cada
-- actividad de un presupuesto creado desde "Plantilla Sugerida".
-- NULL si la actividad fue creada manualmente.
-- Idempotente: seguro de re-ejecutar.
-- ============================================================

ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS catalogo_actividad_id UUID
    REFERENCES catalogo_actividades(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_activities_catalogo_actividad_id
  ON activities(catalogo_actividad_id)
  WHERE catalogo_actividad_id IS NOT NULL;
