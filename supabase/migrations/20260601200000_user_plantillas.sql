-- ─────────────────────────────────────────────────────────────────────────────
-- Plantillas personales de usuario
-- Permite guardar cualquier presupuesto como plantilla reutilizable
-- ─────────────────────────────────────────────────────────────────────────────

-- Tabla principal
CREATE TABLE IF NOT EXISTS user_plantillas (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre      TEXT        NOT NULL,
  tipo_obra   TEXT,
  descripcion TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Capítulos de la plantilla
CREATE TABLE IF NOT EXISTS user_plantillas_capitulos (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  plantilla_id UUID    NOT NULL REFERENCES user_plantillas(id) ON DELETE CASCADE,
  nombre       TEXT    NOT NULL,
  orden        INTEGER DEFAULT 0
);

-- Actividades de la plantilla
CREATE TABLE IF NOT EXISTS user_plantillas_actividades (
  id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  capitulo_id     UUID           NOT NULL REFERENCES user_plantillas_capitulos(id) ON DELETE CASCADE,
  nombre          TEXT           NOT NULL,
  unidad          TEXT,
  cantidad        NUMERIC(15,4)  DEFAULT 0,
  precio_unitario NUMERIC(15,2)  DEFAULT 0,
  orden           INTEGER        DEFAULT 0
);

-- APU ítems de la plantilla
CREATE TABLE IF NOT EXISTS user_plantillas_apu_items (
  id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  actividad_id    UUID           NOT NULL REFERENCES user_plantillas_actividades(id) ON DELETE CASCADE,
  tipo            TEXT           NOT NULL CHECK (tipo IN ('material','mano_obra','equipo','herramienta_menor','epp')),
  nombre          TEXT           NOT NULL,
  unidad          TEXT,
  cantidad        NUMERIC(15,4)  DEFAULT 0,
  precio_unitario NUMERIC(15,2)  DEFAULT 0,
  orden           INTEGER        DEFAULT 0
);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE user_plantillas            ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_plantillas_capitulos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_plantillas_actividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_plantillas_apu_items  ENABLE ROW LEVEL SECURITY;

-- user_plantillas: cada usuario solo ve y modifica las suyas
DROP POLICY IF EXISTS "user_plantillas_all" ON user_plantillas;
CREATE POLICY "user_plantillas_all" ON user_plantillas
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- user_plantillas_capitulos: acceso vía ownership de la plantilla padre
DROP POLICY IF EXISTS "user_plantillas_capitulos_all" ON user_plantillas_capitulos;
CREATE POLICY "user_plantillas_capitulos_all" ON user_plantillas_capitulos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_plantillas p
      WHERE p.id = plantilla_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_plantillas p
      WHERE p.id = plantilla_id AND p.user_id = auth.uid()
    )
  );

-- user_plantillas_actividades: acceso vía capítulo → plantilla
DROP POLICY IF EXISTS "user_plantillas_actividades_all" ON user_plantillas_actividades;
CREATE POLICY "user_plantillas_actividades_all" ON user_plantillas_actividades
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_plantillas_capitulos c
      JOIN user_plantillas p ON p.id = c.plantilla_id
      WHERE c.id = capitulo_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_plantillas_capitulos c
      JOIN user_plantillas p ON p.id = c.plantilla_id
      WHERE c.id = capitulo_id AND p.user_id = auth.uid()
    )
  );

-- user_plantillas_apu_items: acceso vía actividad → capítulo → plantilla
DROP POLICY IF EXISTS "user_plantillas_apu_items_all" ON user_plantillas_apu_items;
CREATE POLICY "user_plantillas_apu_items_all" ON user_plantillas_apu_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_plantillas_actividades a
      JOIN user_plantillas_capitulos c ON c.id = a.capitulo_id
      JOIN user_plantillas p ON p.id = c.plantilla_id
      WHERE a.id = actividad_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_plantillas_actividades a
      JOIN user_plantillas_capitulos c ON c.id = a.capitulo_id
      JOIN user_plantillas p ON p.id = c.plantilla_id
      WHERE a.id = actividad_id AND p.user_id = auth.uid()
    )
  );
