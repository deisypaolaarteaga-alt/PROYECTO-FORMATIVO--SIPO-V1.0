-- ============================================================
-- SIPO — Actualización de estados de proyecto
-- Nuevos estados: borrador | en_progreso | finalizado | archivado
-- ============================================================

-- 1. Eliminar constraint PRIMERO para que el UPDATE no lo viole
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_estado_check;
ALTER TABLE projects DROP CONSTRAINT IF EXISTS check_project_estado;

-- 2. Migrar datos existentes al nuevo esquema
UPDATE projects SET estado = 'en_progreso' WHERE estado IN ('activo', 'pausado');
UPDATE projects SET estado = 'finalizado'  WHERE estado = 'completado';

-- 3. Normalizar cualquier valor desconocido (fallback seguro)
UPDATE projects
  SET estado = 'borrador'
  WHERE estado NOT IN ('borrador', 'en_progreso', 'finalizado', 'archivado');

-- 4. Agregar el nuevo CHECK constraint
ALTER TABLE projects ADD CONSTRAINT check_project_estado
  CHECK (estado IN ('borrador', 'en_progreso', 'finalizado', 'archivado'));

-- 5. Cambiar el valor por defecto para nuevos proyectos
ALTER TABLE projects ALTER COLUMN estado SET DEFAULT 'borrador';
