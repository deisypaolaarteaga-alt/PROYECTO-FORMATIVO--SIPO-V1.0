-- Duración estimada de ejecución de la obra (distinto de vigencia_dias que es la validez de la oferta)
ALTER TABLE budgets
ADD COLUMN IF NOT EXISTS duracion_obra_meses INTEGER DEFAULT NULL
  CHECK (duracion_obra_meses IS NULL OR (duracion_obra_meses >= 1 AND duracion_obra_meses <= 60));
