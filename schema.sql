-- ============================================
-- SIPO — Schema SQL Completo para Supabase
-- Versión idempotente: seguro de re-ejecutar
-- ============================================

-- ============ EXTENSIONES ============
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============ TABLA: profiles ============
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  nombre_completo TEXT,
  empresa TEXT,
  ciudad TEXT,
  nit TEXT,
  logo_url TEXT,
  suscripcion TEXT DEFAULT 'gratis' CHECK (suscripcion IN ('gratis', 'pro')),
  consultas_ia_este_mes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_self" ON profiles;
CREATE POLICY "profiles_select_self" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_self" ON profiles;
CREATE POLICY "profiles_insert_self" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_self" ON profiles;
CREATE POLICY "profiles_update_self" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============ TABLA: projects ============
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  ubicacion TEXT,
  area_m2 NUMERIC,
  tipo_obra TEXT,
  cliente_nombre TEXT,
  cliente_email TEXT,
  cliente_telefono TEXT,
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'pausado', 'completado')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_select_own" ON projects;
CREATE POLICY "projects_select_own" ON projects
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "projects_insert_own" ON projects;
CREATE POLICY "projects_insert_own" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "projects_update_own" ON projects;
CREATE POLICY "projects_update_own" ON projects
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "projects_delete_own" ON projects;
CREATE POLICY "projects_delete_own" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- ============ TABLA: budgets ============
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  numero_presupuesto TEXT UNIQUE,
  descripcion TEXT,
  estado TEXT DEFAULT 'borrador' CHECK (estado IN ('borrador', 'revision', 'enviado', 'aprobado')),
  valor_total NUMERIC DEFAULT 0,
  aiu_porcentaje NUMERIC DEFAULT 25,
  iva_porcentaje NUMERIC DEFAULT 19,
  moneda TEXT DEFAULT 'COP',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_budgets_project_id ON budgets(project_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "budgets_select_own" ON budgets;
CREATE POLICY "budgets_select_own" ON budgets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "budgets_insert_own" ON budgets;
CREATE POLICY "budgets_insert_own" ON budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "budgets_update_own" ON budgets;
CREATE POLICY "budgets_update_own" ON budgets
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "budgets_delete_own" ON budgets;
CREATE POLICY "budgets_delete_own" ON budgets
  FOR DELETE USING (auth.uid() = user_id);

-- ============ TABLA: chapters ============
CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  numero INT,
  valor_subtotal NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chapters_budget_id ON chapters(budget_id);
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chapters_select_own" ON chapters;
CREATE POLICY "chapters_select_own" ON chapters
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "chapters_insert_own" ON chapters;
CREATE POLICY "chapters_insert_own" ON chapters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "chapters_update_own" ON chapters;
CREATE POLICY "chapters_update_own" ON chapters
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "chapters_delete_own" ON chapters;
CREATE POLICY "chapters_delete_own" ON chapters
  FOR DELETE USING (auth.uid() = user_id);

-- ============ TABLA: activities ============
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  unidad TEXT NOT NULL,
  cantidad NUMERIC NOT NULL,
  precio_unitario NUMERIC NOT NULL,
  subtotal NUMERIC GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
  numero INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_chapter_id ON activities(chapter_id);
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activities_select_own" ON activities;
CREATE POLICY "activities_select_own" ON activities
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "activities_insert_own" ON activities;
CREATE POLICY "activities_insert_own" ON activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "activities_update_own" ON activities;
CREATE POLICY "activities_update_own" ON activities
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "activities_delete_own" ON activities;
CREATE POLICY "activities_delete_own" ON activities
  FOR DELETE USING (auth.uid() = user_id);

-- ============ TABLA: apus ============
CREATE TABLE IF NOT EXISTS apus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  codigo_apu TEXT,
  descripcion TEXT,
  rendimiento NUMERIC DEFAULT 1,
  costo_material NUMERIC DEFAULT 0,
  costo_mano_obra NUMERIC DEFAULT 0,
  costo_equipo NUMERIC DEFAULT 0,
  costo_total NUMERIC GENERATED ALWAYS AS (costo_material + costo_mano_obra + costo_equipo) STORED,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apus_activity_id ON apus(activity_id);
ALTER TABLE apus ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "apus_select_own" ON apus;
CREATE POLICY "apus_select_own" ON apus
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "apus_insert_own" ON apus;
CREATE POLICY "apus_insert_own" ON apus
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "apus_update_own" ON apus;
CREATE POLICY "apus_update_own" ON apus
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "apus_delete_own" ON apus;
CREATE POLICY "apus_delete_own" ON apus
  FOR DELETE USING (auth.uid() = user_id);

-- ============ TABLA: apu_items ============
CREATE TABLE IF NOT EXISTS apu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  apu_id UUID NOT NULL REFERENCES apus(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('material', 'mano_obra', 'equipo')),
  unidad TEXT NOT NULL,
  cantidad NUMERIC NOT NULL,
  precio_unitario NUMERIC NOT NULL,
  subtotal NUMERIC GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apu_items_apu_id ON apu_items(apu_id);
ALTER TABLE apu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "apu_items_select_own" ON apu_items;
CREATE POLICY "apu_items_select_own" ON apu_items
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "apu_items_insert_own" ON apu_items;
CREATE POLICY "apu_items_insert_own" ON apu_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "apu_items_update_own" ON apu_items;
CREATE POLICY "apu_items_update_own" ON apu_items
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "apu_items_delete_own" ON apu_items;
CREATE POLICY "apu_items_delete_own" ON apu_items
  FOR DELETE USING (auth.uid() = user_id);

-- ============ TABLA: materials ============
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  unidad TEXT NOT NULL,
  precio_referencia NUMERIC NOT NULL,
  departamento TEXT,
  categoria TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "materials_select_all" ON materials;
CREATE POLICY "materials_select_all" ON materials
  FOR SELECT USING (true);

-- ============ TABLA: labor ============
CREATE TABLE IF NOT EXISTS labor (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  oficio TEXT,
  precio_diario NUMERIC NOT NULL,
  prestaciones_porcentaje NUMERIC DEFAULT 50,
  departamento TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE labor ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "labor_select_all" ON labor;
CREATE POLICY "labor_select_all" ON labor
  FOR SELECT USING (true);

-- ============ TABLA: equipment ============
CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT,
  precio_diario NUMERIC NOT NULL,
  precio_semanal NUMERIC,
  precio_mensual NUMERIC,
  departamento TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "equipment_select_all" ON equipment;
CREATE POLICY "equipment_select_all" ON equipment
  FOR SELECT USING (true);

-- ============ TABLA: ai_conversations ============
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mensaje_usuario TEXT NOT NULL,
  respuesta_ia TEXT NOT NULL,
  respuesta_estructurada JSONB,
  tokens_utilizados INT,
  costo_usd NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_project_id ON ai_conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_conversations_select_own" ON ai_conversations;
CREATE POLICY "ai_conversations_select_own" ON ai_conversations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ai_conversations_insert_own" ON ai_conversations;
CREATE POLICY "ai_conversations_insert_own" ON ai_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============ TABLA: user_materials ============
CREATE TABLE IF NOT EXISTS user_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT,
  unidad TEXT NOT NULL,
  precio_unitario NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_materials_user_id ON user_materials(user_id);
ALTER TABLE user_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_materials_select_own" ON user_materials;
CREATE POLICY "user_materials_select_own" ON user_materials
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_materials_insert_own" ON user_materials;
CREATE POLICY "user_materials_insert_own" ON user_materials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_materials_update_own" ON user_materials;
CREATE POLICY "user_materials_update_own" ON user_materials
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_materials_delete_own" ON user_materials;
CREATE POLICY "user_materials_delete_own" ON user_materials
  FOR DELETE USING (auth.uid() = user_id);

-- ============ FUNCIÓN: updated_at ============
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============ TRIGGERS (idempotentes) ============
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_chapters_updated_at ON chapters;
CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_activities_updated_at ON activities;
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_apus_updated_at ON apus;
CREATE TRIGGER update_apus_updated_at BEFORE UPDATE ON apus
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_apu_items_updated_at ON apu_items;
CREATE TRIGGER update_apu_items_updated_at BEFORE UPDATE ON apu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_user_materials_updated_at ON user_materials;
CREATE TRIGGER update_user_materials_updated_at BEFORE UPDATE ON user_materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============ ÍNDICES ADICIONALES ============
CREATE INDEX IF NOT EXISTS idx_chapters_numero ON chapters(numero);
CREATE INDEX IF NOT EXISTS idx_activities_numero ON activities(numero);
CREATE INDEX IF NOT EXISTS idx_budgets_created_at ON budgets(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
