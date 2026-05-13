-- ============================================================================
-- SIPO — MIGRACIÓN COMPLETA EN UN SOLO SQL
-- ============================================================================
-- Ejecutar TODO en el SQL Editor de Supabase de una sola vez
-- Contiene: Schema base + todas las migraciones en orden
-- ============================================================================

-- ==================== PASO 1: SCHEMA BASE ====================

-- ============ EXTENSIONES ============
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============ TABLA: profiles ============
-- Extensión de auth.users con datos de empresa
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

-- RLS para profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_self" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_self" ON profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON profiles;

CREATE POLICY "profiles_select_self" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_self" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_self" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============ TABLA: projects ============
-- Proyectos/obras del usuario
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
DROP POLICY IF EXISTS "projects_insert_own" ON projects;
DROP POLICY IF EXISTS "projects_update_own" ON projects;
DROP POLICY IF EXISTS "projects_delete_own" ON projects;

CREATE POLICY "projects_select_own" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "projects_insert_own" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "projects_update_own" ON projects
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "projects_delete_own" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- ============ TABLA: budgets ============
-- Presupuestos por proyecto
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
DROP POLICY IF EXISTS "budgets_insert_own" ON budgets;
DROP POLICY IF EXISTS "budgets_update_own" ON budgets;
DROP POLICY IF EXISTS "budgets_delete_own" ON budgets;

CREATE POLICY "budgets_select_own" ON budgets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "budgets_insert_own" ON budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "budgets_update_own" ON budgets
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "budgets_delete_own" ON budgets
  FOR DELETE USING (auth.uid() = user_id);

-- ============ TABLA: chapters ============
-- Capítulos del presupuesto
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
DROP POLICY IF EXISTS "chapters_insert_own" ON chapters;
DROP POLICY IF EXISTS "chapters_update_own" ON chapters;
DROP POLICY IF EXISTS "chapters_delete_own" ON chapters;

CREATE POLICY "chapters_select_own" ON chapters
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "chapters_insert_own" ON chapters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chapters_update_own" ON chapters
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chapters_delete_own" ON chapters
  FOR DELETE USING (auth.uid() = user_id);

-- ============ TABLA: activities ============
-- Actividades por capítulo
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
DROP POLICY IF EXISTS "activities_insert_own" ON activities;
DROP POLICY IF EXISTS "activities_update_own" ON activities;
DROP POLICY IF EXISTS "activities_delete_own" ON activities;

CREATE POLICY "activities_select_own" ON activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "activities_insert_own" ON activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "activities_update_own" ON activities
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "activities_delete_own" ON activities
  FOR DELETE USING (auth.uid() = user_id);

-- ============ TABLA: apus ============
-- APU (Análisis de Precios Unitarios)
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
DROP POLICY IF EXISTS "apus_insert_own" ON apus;
DROP POLICY IF EXISTS "apus_update_own" ON apus;
DROP POLICY IF EXISTS "apus_delete_own" ON apus;

CREATE POLICY "apus_select_own" ON apus
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "apus_insert_own" ON apus
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "apus_update_own" ON apus
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "apus_delete_own" ON apus
  FOR DELETE USING (auth.uid() = user_id);

-- ============ TABLA: apu_items ============
-- Ítems dentro de cada APU
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
DROP POLICY IF EXISTS "apu_items_insert_own" ON apu_items;
DROP POLICY IF EXISTS "apu_items_update_own" ON apu_items;
DROP POLICY IF EXISTS "apu_items_delete_own" ON apu_items;

CREATE POLICY "apu_items_select_own" ON apu_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "apu_items_insert_own" ON apu_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "apu_items_update_own" ON apu_items
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "apu_items_delete_own" ON apu_items
  FOR DELETE USING (auth.uid() = user_id);

-- ============ TABLA: materials ============
-- Base de datos de materiales de referencia
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
-- Base de datos de mano de obra
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
-- Base de datos de equipos y alquileres
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
-- Historial de conversaciones con la IA
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
DROP POLICY IF EXISTS "ai_conversations_insert_own" ON ai_conversations;

CREATE POLICY "ai_conversations_select_own" ON ai_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ai_conversations_insert_own" ON ai_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============ TABLA: user_materials ============
-- Insumos personalizados del usuario
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
DROP POLICY IF EXISTS "user_materials_insert_own" ON user_materials;
DROP POLICY IF EXISTS "user_materials_update_own" ON user_materials;
DROP POLICY IF EXISTS "user_materials_delete_own" ON user_materials;

CREATE POLICY "user_materials_select_own" ON user_materials
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_materials_insert_own" ON user_materials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_materials_update_own" ON user_materials
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_materials_delete_own" ON user_materials
  FOR DELETE USING (auth.uid() = user_id);

-- ============ TRIGGERS (updated_at) ============
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- ==================== PASO 2: MIGRACIÓN 1 - Parámetros Fiscales ====================

CREATE TABLE IF NOT EXISTS parametros_fiscales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  año INTEGER NOT NULL UNIQUE,
  smmlv NUMERIC NOT NULL,
  aux_transporte NUMERIC NOT NULL,
  factor_prestacional_riesgo_i NUMERIC NOT NULL DEFAULT 1.522,
  factor_prestacional_riesgo_ii NUMERIC NOT NULL DEFAULT 1.534,
  factor_prestacional_riesgo_iii NUMERIC NOT NULL DEFAULT 1.564,
  factor_prestacional_riesgo_iv NUMERIC NOT NULL DEFAULT 1.5988,
  factor_prestacional_riesgo_v NUMERIC NOT NULL DEFAULT 1.646,
  divisor_apu INTEGER NOT NULL DEFAULT 182,
  tpnl_porcentaje NUMERIC NOT NULL DEFAULT 22.5,
  herramienta_menor_porcentaje NUMERIC NOT NULL DEFAULT 3.0,
  epp_porcentaje NUMERIC NOT NULL DEFAULT 1.0,
  iva_porcentaje NUMERIC NOT NULL DEFAULT 19.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE parametros_fiscales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública para autenticados" ON parametros_fiscales;
DROP POLICY IF EXISTS "Solo admins pueden insertar" ON parametros_fiscales;
DROP POLICY IF EXISTS "Solo admins pueden actualizar" ON parametros_fiscales;

CREATE POLICY "Lectura pública para autenticados" ON parametros_fiscales
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Solo admins pueden insertar" ON parametros_fiscales
  FOR INSERT WITH CHECK (false);

CREATE POLICY "Solo admins pueden actualizar" ON parametros_fiscales
  FOR UPDATE USING (false);

INSERT INTO parametros_fiscales (
  año, smmlv, aux_transporte, factor_prestacional_riesgo_iv, divisor_apu,
  tpnl_porcentaje, herramienta_menor_porcentaje, epp_porcentaje, iva_porcentaje
) VALUES (2025, 1423500, 200000, 1.5988, 182, 22.5, 3.0, 1.0, 19.0)
ON CONFLICT (año) DO UPDATE SET
  smmlv = EXCLUDED.smmlv,
  aux_transporte = EXCLUDED.aux_transporte;

-- ==================== PASO 3: MIGRACIÓN 2 - Configuración Fiscal ====================

ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS municipio TEXT DEFAULT 'Bogotá',
  ADD COLUMN IF NOT EXISTS nivel_riesgo_arl INTEGER DEFAULT 4 CHECK (nivel_riesgo_arl BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS aiu_admin_default NUMERIC DEFAULT 10,
  ADD COLUMN IF NOT EXISTS aiu_imprev_default NUMERIC DEFAULT 5,
  ADD COLUMN IF NOT EXISTS aiu_utilidad_default NUMERIC DEFAULT 10,
  ADD COLUMN IF NOT EXISTS razon_social TEXT,
  ADD COLUMN IF NOT EXISTS regimen_tributario TEXT DEFAULT 'no_responsable' CHECK (regimen_tributario IN ('responsable_iva', 'no_responsable')),
  ADD COLUMN IF NOT EXISTS fecha_validez_presupuesto_dias INTEGER DEFAULT 30;

CREATE TABLE IF NOT EXISTS municipios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL UNIQUE,
  departamento TEXT NOT NULL,
  reteica_pct NUMERIC NOT NULL DEFAULT 0.414,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE municipios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "municipios_select_all" ON municipios;
CREATE POLICY "municipios_select_all" ON municipios FOR SELECT USING (true);

INSERT INTO municipios (nombre, departamento, reteica_pct) VALUES
  ('Bogotá D.C.', 'Bogotá', 0.414),
  ('Medellín', 'Antioquia', 0.6),
  ('Cali', 'Valle del Cauca', 0.5),
  ('Barranquilla', 'Atlántico', 0.5),
  ('Bucaramanga', 'Santander', 0.4),
  ('Cartagena', 'Bolívar', 0.5)
ON CONFLICT (nombre) DO NOTHING;

-- ==================== PASO 4: MIGRACIÓN 3 - Auditoría y RLS ====================

ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE apus ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE OR REPLACE VIEW v_projects_activos AS SELECT * FROM projects WHERE deleted_at IS NULL;
CREATE OR REPLACE VIEW v_budgets_activos AS SELECT * FROM budgets WHERE deleted_at IS NULL;
CREATE OR REPLACE VIEW v_chapters_activos AS SELECT * FROM chapters WHERE deleted_at IS NULL;
CREATE OR REPLACE VIEW v_activities_activos AS SELECT * FROM activities WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tabla TEXT NOT NULL,
  operacion TEXT NOT NULL,
  registro_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id),
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_log_select_own" ON audit_log;
CREATE POLICY "audit_log_select_own" ON audit_log FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION fn_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO audit_log (tabla, operacion, registro_id, user_id, datos_anteriores, datos_nuevos)
    VALUES (
      TG_TABLE_NAME,
      TG_OP,
      COALESCE(NEW.id, OLD.id),
      auth.uid(),
      CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
      CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
  EXCEPTION WHEN OTHERS THEN
    RETURN COALESCE(NEW, OLD);
  END;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_budgets ON budgets;
CREATE TRIGGER trg_audit_budgets AFTER INSERT OR UPDATE OR DELETE ON budgets FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_apu_items ON apu_items;
CREATE TRIGGER trg_audit_apu_items AFTER INSERT OR UPDATE OR DELETE ON apu_items FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

-- ==================== PASO 5: MIGRACIÓN 4 - Estados de Presupuestos ====================

ALTER TABLE budgets DROP CONSTRAINT IF EXISTS check_budget_estado;
ALTER TABLE budgets ADD CONSTRAINT check_budget_estado 
  CHECK (estado IN ('borrador', 'en_revision', 'aprobado', 'rechazado', 'archivado'));

ALTER TABLE budgets 
  ADD COLUMN IF NOT EXISTS aprobado_por UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS aprobado_en TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS notas_revision TEXT;

CREATE TABLE IF NOT EXISTS budget_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  version INTEGER NOT NULL,
  datos_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE budget_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_snapshots" ON budget_snapshots;
CREATE POLICY "select_own_snapshots" ON budget_snapshots FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION fn_increment_budget_version()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado = 'aprobado' AND OLD.estado <> 'aprobado' THEN
    NEW.version := OLD.version + 1;
    NEW.aprobado_en := NOW();
    NEW.aprobado_por := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_budget_version ON budgets;
CREATE TRIGGER trg_budget_version BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION fn_increment_budget_version();

DROP POLICY IF EXISTS "budgets_update_lock" ON budgets;
CREATE POLICY "budgets_update_lock" ON budgets 
  FOR UPDATE USING (
    auth.uid() = user_id AND 
    (estado <> 'aprobado' OR auth.jwt() ->> 'role' = 'admin')
  );

-- ==================== PASO 6: MIGRACIÓN 5 - IA Security ====================

ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS anthropic_key_enc TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ia_global_enabled BOOLEAN DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  consultas_hoy INTEGER DEFAULT 0,
  consultas_mes INTEGER DEFAULT 0,
  ultima_consulta_at TIMESTAMPTZ DEFAULT NOW(),
  total_tokens BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_usage_select_own" ON ai_usage;
CREATE POLICY "ai_usage_select_own" ON ai_usage FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE ai_conversations 
  ADD COLUMN IF NOT EXISTS tiempo_respuesta_ms INTEGER,
  ADD COLUMN IF NOT EXISTS modelo TEXT DEFAULT 'claude-3-5-sonnet',
  ADD COLUMN IF NOT EXISTS costo_estimado NUMERIC DEFAULT 0;

CREATE OR REPLACE FUNCTION reset_daily_ai_usage()
RETURNS void AS $$
BEGIN
  UPDATE ai_usage SET consultas_hoy = 0;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- ✅ FIN DE MIGRACIONES — TODO LISTO PARA USAR
-- =====================================================================
