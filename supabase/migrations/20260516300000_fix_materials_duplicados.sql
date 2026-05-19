-- Elimina duplicados en `materials` conservando el registro con mayor id
-- por (nombre, categoria). Luego agrega índice único para prevenir recurrencia.
-- Afecta 7 filas (2 de "Acero", 2 de "Cemento", 1 "Bloque", 1 "Concreto", 1 "Vinilo").

-- PASO 1: borrar duplicados (conserva el de mayor id por nombre+categoria)
DELETE FROM materials
WHERE id NOT IN (
  SELECT DISTINCT ON (nombre, categoria) id
  FROM materials
  ORDER BY nombre, categoria, id DESC
);

-- PASO 2: índice único (idempotente)
CREATE UNIQUE INDEX IF NOT EXISTS materials_nombre_categoria_unique
  ON materials (nombre, categoria);
