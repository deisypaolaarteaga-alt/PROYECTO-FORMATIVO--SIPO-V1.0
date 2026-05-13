-- ============================================================
-- SIPO — Fix definitivo de estados de proyecto
-- Idempotente: seguro de ejecutar aunque 130000 ya se aplicó
-- ============================================================

-- 1. Eliminar cualquier constraint existente (ambos nombres posibles)
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_estado_check;
ALTER TABLE projects DROP CONSTRAINT IF EXISTS check_project_estado;

-- 2. Migrar valores legacy al nuevo esquema
UPDATE projects SET estado = 'en_progreso' WHERE estado IN ('activo', 'pausado') OR estado IS NULL;
UPDATE projects SET estado = 'finalizado'  WHERE estado = 'completado';

-- 3. Fallback: cualquier otro valor desconocido → borrador
UPDATE projects
  SET estado = 'borrador'
  WHERE estado NOT IN ('borrador', 'en_progreso', 'finalizado', 'archivado');

-- 4. Agregar el constraint correcto
ALTER TABLE projects ADD CONSTRAINT check_project_estado
  CHECK (estado IN ('borrador', 'en_progreso', 'finalizado', 'archivado'));

-- 5. Default para nuevos proyectos
ALTER TABLE projects ALTER COLUMN estado SET DEFAULT 'borrador';
