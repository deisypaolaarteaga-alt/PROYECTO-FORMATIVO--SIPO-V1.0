-- Agrega 'hotelero' al CHECK constraint de projects.tipo_obra
-- Primero normaliza cualquier valor legacy que no esté en la lista válida.

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_tipo_obra_check;

-- Normalizar valores legacy → valor canónico más cercano
UPDATE projects SET tipo_obra = 'residencial'    WHERE tipo_obra IN ('vivienda','remodelacion','remodelación');
UPDATE projects SET tipo_obra = 'comercial'      WHERE tipo_obra IN ('oficina','bodega','local');
UPDATE projects SET tipo_obra = 'infraestructura' WHERE tipo_obra IN ('vial','urbanismo');
-- Cualquier otro valor desconocido → 'otro'
UPDATE projects
  SET tipo_obra = 'otro'
  WHERE tipo_obra IS NOT NULL
    AND tipo_obra NOT IN (
      'residencial','comercial','industrial',
      'infraestructura','institucional','hotelero','otro'
    );

ALTER TABLE projects
  ADD CONSTRAINT projects_tipo_obra_check
    CHECK (tipo_obra IN (
      'residencial', 'comercial', 'industrial',
      'infraestructura', 'institucional', 'hotelero', 'otro'
    ) OR tipo_obra IS NULL);
