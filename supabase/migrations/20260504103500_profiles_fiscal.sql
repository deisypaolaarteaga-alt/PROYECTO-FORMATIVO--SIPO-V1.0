-- ============================================================
-- SIPO — Configuración Fiscal de Perfil de Usuario
-- ============================================================

-- 1. Agregar columnas fiscales a la tabla 'profiles'
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS municipio TEXT DEFAULT 'Bogotá',
  ADD COLUMN IF NOT EXISTS nivel_riesgo_arl INTEGER DEFAULT 4 CHECK (nivel_riesgo_arl BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS aiu_admin_default NUMERIC DEFAULT 10,
  ADD COLUMN IF NOT EXISTS aiu_imprev_default NUMERIC DEFAULT 5,
  ADD COLUMN IF NOT EXISTS aiu_utilidad_default NUMERIC DEFAULT 10,
  ADD COLUMN IF NOT EXISTS razon_social TEXT,
  ADD COLUMN IF NOT EXISTS regimen_tributario TEXT DEFAULT 'no_responsable' CHECK (regimen_tributario IN ('responsable_iva', 'no_responsable')),
  ADD COLUMN IF NOT EXISTS fecha_validez_presupuesto_dias INTEGER DEFAULT 30;

-- 2. Asegurar que existe el campo NIT (si no existe ya en el schema original)
-- Nota: En schema.sql ya existe, pero aseguramos.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'profiles' AND column_name = 'nit') THEN
        ALTER TABLE profiles ADD COLUMN nit TEXT;
    END IF;
END $$;

-- 3. Tabla de municipios para ReteICA dinámico
CREATE TABLE IF NOT EXISTS municipios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL UNIQUE,
  departamento TEXT NOT NULL,
  reteica_pct NUMERIC NOT NULL DEFAULT 0.414,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para municipios
ALTER TABLE municipios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "municipios_select_all" ON municipios;
CREATE POLICY "municipios_select_all" ON municipios FOR SELECT USING (true);

-- 4. Seed de municipios principales con ReteICA
INSERT INTO municipios (nombre, departamento, reteica_pct) VALUES
  ('Bogotá D.C.', 'Bogotá', 0.414),
  ('Medellín', 'Antioquia', 0.6),
  ('Cali', 'Valle del Cauca', 0.5),
  ('Barranquilla', 'Atlántico', 0.5),
  ('Bucaramanga', 'Santander', 0.4),
  ('Cartagena', 'Bolívar', 0.5)
ON CONFLICT (nombre) DO UPDATE SET reteica_pct = EXCLUDED.reteica_pct;
