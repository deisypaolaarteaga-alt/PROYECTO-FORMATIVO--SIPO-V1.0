-- ============================================================
-- SIPO — Sistema de roles de usuario
-- Fase 1: columna rol en profiles + políticas RLS en catálogo
-- ============================================================

-- 1. Agregar columna rol a profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS rol TEXT DEFAULT 'usuario'
  CHECK (rol IN ('usuario', 'super_admin'));

-- ============================================================
-- 2. Políticas RLS para catalogo_capitulos
-- ============================================================

-- SELECT público (mantener como está)
DROP POLICY IF EXISTS "catalogo_capitulos_select_public" ON catalogo_capitulos;
CREATE POLICY "catalogo_capitulos_select_public"
  ON catalogo_capitulos
  FOR SELECT
  USING (true);

-- INSERT solo super_admin
DROP POLICY IF EXISTS "catalogo_capitulos_insert_super_admin" ON catalogo_capitulos;
CREATE POLICY "catalogo_capitulos_insert_super_admin"
  ON catalogo_capitulos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND rol = 'super_admin'
    )
  );

-- UPDATE solo super_admin
DROP POLICY IF EXISTS "catalogo_capitulos_update_super_admin" ON catalogo_capitulos;
CREATE POLICY "catalogo_capitulos_update_super_admin"
  ON catalogo_capitulos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND rol = 'super_admin'
    )
  );

-- DELETE solo super_admin
DROP POLICY IF EXISTS "catalogo_capitulos_delete_super_admin" ON catalogo_capitulos;
CREATE POLICY "catalogo_capitulos_delete_super_admin"
  ON catalogo_capitulos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND rol = 'super_admin'
    )
  );

-- ============================================================
-- 3. Políticas RLS para catalogo_actividades
-- ============================================================

DROP POLICY IF EXISTS "catalogo_actividades_select_public" ON catalogo_actividades;
CREATE POLICY "catalogo_actividades_select_public"
  ON catalogo_actividades
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "catalogo_actividades_insert_super_admin" ON catalogo_actividades;
CREATE POLICY "catalogo_actividades_insert_super_admin"
  ON catalogo_actividades
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND rol = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "catalogo_actividades_update_super_admin" ON catalogo_actividades;
CREATE POLICY "catalogo_actividades_update_super_admin"
  ON catalogo_actividades
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND rol = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "catalogo_actividades_delete_super_admin" ON catalogo_actividades;
CREATE POLICY "catalogo_actividades_delete_super_admin"
  ON catalogo_actividades
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND rol = 'super_admin'
    )
  );

-- ============================================================
-- 4. Políticas RLS para catalogo_apu_items
-- ============================================================

DROP POLICY IF EXISTS "catalogo_apu_items_select_public" ON catalogo_apu_items;
CREATE POLICY "catalogo_apu_items_select_public"
  ON catalogo_apu_items
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "catalogo_apu_items_insert_super_admin" ON catalogo_apu_items;
CREATE POLICY "catalogo_apu_items_insert_super_admin"
  ON catalogo_apu_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND rol = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "catalogo_apu_items_update_super_admin" ON catalogo_apu_items;
CREATE POLICY "catalogo_apu_items_update_super_admin"
  ON catalogo_apu_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND rol = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "catalogo_apu_items_delete_super_admin" ON catalogo_apu_items;
CREATE POLICY "catalogo_apu_items_delete_super_admin"
  ON catalogo_apu_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND rol = 'super_admin'
    )
  );
