-- 20260526100000_trabajadores_usuario.sql
-- Agrega user_id a trabajadores y actualiza RLS para CRUD propio por usuario.
-- Los trabajadores del sistema tienen user_id IS NULL (catálogo público de referencia).
-- Los trabajadores propios del usuario tienen user_id = auth.uid().

-- 1. Columna user_id nullable (FK a auth.users, cascada al borrar usuario)
ALTER TABLE trabajadores
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Reemplazar índice único único de especialidad por dos índices parciales idempotentes.
--    El índice original idx_trabajadores_especialidad impedía que usuarios creen
--    trabajadores con el mismo nombre que los del sistema.
DROP INDEX IF EXISTS idx_trabajadores_especialidad;

-- Índice parcial para trabajadores del sistema (user_id IS NULL): único por especialidad
CREATE UNIQUE INDEX IF NOT EXISTS idx_trabajadores_esp_sistema
  ON trabajadores (especialidad)
  WHERE user_id IS NULL;

-- Índice compuesto para trabajadores de usuario: único por (especialidad, user_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_trabajadores_esp_usuario
  ON trabajadores (especialidad, user_id)
  WHERE user_id IS NOT NULL;

-- 3. Actualizar políticas RLS — reemplazar lectura pública por políticas granulares
DROP POLICY IF EXISTS "trabajadores_lectura_publica" ON trabajadores;
DROP POLICY IF EXISTS "trabajadores_select"          ON trabajadores;
DROP POLICY IF EXISTS "trabajadores_insert"          ON trabajadores;
DROP POLICY IF EXISTS "trabajadores_update"          ON trabajadores;
DROP POLICY IF EXISTS "trabajadores_delete"          ON trabajadores;

-- SELECT: catálogo sistema (user_id IS NULL) + trabajadores propios
CREATE POLICY "trabajadores_select" ON trabajadores
  FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());

-- INSERT: solo trabajadores propios (user_id debe ser el del usuario autenticado)
CREATE POLICY "trabajadores_insert" ON trabajadores
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- UPDATE: solo trabajadores propios
CREATE POLICY "trabajadores_update" ON trabajadores
  FOR UPDATE USING (user_id = auth.uid());

-- DELETE: solo trabajadores propios (preferir soft-delete vía activo=false)
CREATE POLICY "trabajadores_delete" ON trabajadores
  FOR DELETE USING (user_id = auth.uid());
