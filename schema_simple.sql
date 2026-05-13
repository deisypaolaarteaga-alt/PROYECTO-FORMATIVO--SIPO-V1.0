-- Verificar que las tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN (
  'budgets', 'chapters', 'activities', 'profiles', 'projects'
);

-- Si budgets no existe, créala o actualízala:
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  nombre VARCHAR(200) NOT NULL DEFAULT 'Nuevo presupuesto',
  estado VARCHAR(50) DEFAULT 'borrador',
  aiu_porcentaje DECIMAL(5,2) DEFAULT 25.0,
  iva_porcentaje DECIMAL(5,2) DEFAULT 0.0,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Asegurar campos en budgets si ya existe
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='budgets' AND COLUMN_NAME='aiu_porcentaje') THEN
    ALTER TABLE budgets ADD COLUMN aiu_porcentaje DECIMAL(5,2) DEFAULT 25.0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='budgets' AND COLUMN_NAME='iva_porcentaje') THEN
    ALTER TABLE budgets ADD COLUMN iva_porcentaje DECIMAL(5,2) DEFAULT 0.0;
  END IF;
END $$;

-- Si chapters no existe, créala:
CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  nombre VARCHAR(200) NOT NULL DEFAULT 'Nuevo capítulo',
  numero INTEGER DEFAULT 1,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Si activities no existe, créala:
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  descripcion VARCHAR(300) NOT NULL DEFAULT 'Nueva actividad',
  unidad VARCHAR(20) DEFAULT 'm²',
  cantidad DECIMAL(12,4) DEFAULT 1,
  precio_unitario DECIMAL(14,2) DEFAULT 0,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Activar RLS en todas
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (usuario ve solo sus datos)
DROP POLICY IF EXISTS "budgets_policy" ON budgets;
CREATE POLICY "budgets_policy" ON budgets
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "chapters_policy" ON chapters;
CREATE POLICY "chapters_policy" ON chapters
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "activities_policy" ON activities;
CREATE POLICY "activities_policy" ON activities
  FOR ALL USING (user_id = auth.uid());
