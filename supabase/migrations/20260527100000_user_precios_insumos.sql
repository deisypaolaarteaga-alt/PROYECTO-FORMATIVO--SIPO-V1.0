-- Override de precio de materiales de referencia por usuario
CREATE TABLE IF NOT EXISTS user_material_precios (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  precio_unitario NUMERIC(15,2) NOT NULL CHECK (precio_unitario >= 0),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, material_id)
);
ALTER TABLE user_material_precios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ump_own" ON user_material_precios;
CREATE POLICY "ump_own" ON user_material_precios
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Override de precio de equipos de referencia por usuario
-- Solo precio_diario es editable (es el que usa el Panel APU)
CREATE TABLE IF NOT EXISTS user_equipment_precios (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  precio_diario NUMERIC(15,2) NOT NULL CHECK (precio_diario >= 0),
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, equipment_id)
);
ALTER TABLE user_equipment_precios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "uep_own" ON user_equipment_precios;
CREATE POLICY "uep_own" ON user_equipment_precios
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
