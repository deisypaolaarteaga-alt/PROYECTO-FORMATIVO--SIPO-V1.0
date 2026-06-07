-- area_m2 en presupuestos: permite diferenciar el área por presupuesto
-- (ej: presupuesto solo fachada vs obra completa en el mismo proyecto).
-- projects.area_m2 NO se elimina — se mantiene por compatibilidad.

ALTER TABLE budgets
  ADD COLUMN IF NOT EXISTS area_m2 NUMERIC(10,2) NULL;

-- Retrocompatibilidad: copiar el área del proyecto a los presupuestos existentes
UPDATE budgets
SET    area_m2 = projects.area_m2
FROM   projects
WHERE  budgets.project_id = projects.id
  AND  budgets.deleted_at IS NULL
  AND  projects.area_m2   IS NOT NULL
  AND  budgets.area_m2    IS NULL;
