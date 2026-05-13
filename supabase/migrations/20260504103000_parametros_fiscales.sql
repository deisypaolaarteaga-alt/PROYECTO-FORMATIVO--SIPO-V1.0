-- ============================================================
-- SIPO — Parámetros Fiscales Dinámicos (2025)
-- ============================================================

-- Crear tabla de parámetros fiscales
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

-- Habilitar RLS
ALTER TABLE parametros_fiscales ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "Lectura pública para autenticados" ON parametros_fiscales;
CREATE POLICY "Lectura pública para autenticados" ON parametros_fiscales
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Solo admins pueden insertar" ON parametros_fiscales;
CREATE POLICY "Solo admins pueden insertar" ON parametros_fiscales
  FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS "Solo admins pueden actualizar" ON parametros_fiscales;
CREATE POLICY "Solo admins pueden actualizar" ON parametros_fiscales
  FOR UPDATE USING (false);

-- Seed con valores reales Colombia 2025
-- SMMLV $1.423.500, aux transporte $200.000, factor riesgo IV 1.5988
INSERT INTO parametros_fiscales (
  año, 
  smmlv, 
  aux_transporte, 
  factor_prestacional_riesgo_iv,
  divisor_apu,
  tpnl_porcentaje,
  herramienta_menor_porcentaje,
  epp_porcentaje,
  iva_porcentaje
) VALUES (
  2025,
  1423500,
  200000,
  1.5988,
  182,
  22.5,
  3.0,
  1.0,
  19.0
) ON CONFLICT (año) DO UPDATE SET
  smmlv = EXCLUDED.smmlv,
  aux_transporte = EXCLUDED.aux_transporte,
  factor_prestacional_riesgo_iv = EXCLUDED.factor_prestacional_riesgo_iv;
