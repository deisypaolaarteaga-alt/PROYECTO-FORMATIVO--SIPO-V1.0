-- duracion_obra_meses fue creada por error — duracion_meses ya existía para el mismo propósito
ALTER TABLE budgets DROP COLUMN IF EXISTS duracion_obra_meses;
