-- ============================================
-- SIPO — Schema Cuadrillas y Rendimientos
-- Ejecutar en la consola SQL de Supabase
-- ============================================

-- Tabla de trabajadores (jornales de referencia Colombia 2025)
CREATE TABLE IF NOT EXISTS trabajadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  especialidad VARCHAR(100) NOT NULL,
  categoria VARCHAR(50) CHECK (categoria IN (
    'director', 'residente', 'maestro', 'oficial',
    'ayudante', 'especialista'
  )),
  jornal_base DECIMAL(12,2) NOT NULL,
  nivel_riesgo INTEGER DEFAULT 4 CHECK (nivel_riesgo BETWEEN 1 AND 5),
  factor_prestacional DECIMAL(6,4) DEFAULT 1.5988,
  jornal_con_prestaciones DECIMAL(12,2) GENERATED ALWAYS AS
    (jornal_base * factor_prestacional) STORED,
  ciudad_referencia VARCHAR(50) DEFAULT 'Nacional',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de cuadrillas (sistema + usuario)
CREATE TABLE IF NOT EXISTS cuadrillas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT,
  categoria_actividad VARCHAR(100),
  es_sistema BOOLEAN DEFAULT false,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Composición de cada cuadrilla
CREATE TABLE IF NOT EXISTS cuadrilla_trabajadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuadrilla_id UUID REFERENCES cuadrillas(id) ON DELETE CASCADE,
  trabajador_id UUID REFERENCES trabajadores(id),
  cantidad DECIMAL(4,2) DEFAULT 1,
  es_fraccion BOOLEAN DEFAULT false
);

-- Rendimientos por cuadrilla y tipo de actividad
CREATE TABLE IF NOT EXISTS rendimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuadrilla_id UUID REFERENCES cuadrillas(id) ON DELETE CASCADE,
  actividad_tipo VARCHAR(150) NOT NULL,
  unidad VARCHAR(20) NOT NULL,
  rendimiento_minimo DECIMAL(10,4),
  rendimiento_normal DECIMAL(10,4) NOT NULL,
  rendimiento_optimo DECIMAL(10,4),
  condiciones TEXT,
  fuente VARCHAR(100) DEFAULT 'SIPO Colombia 2025',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============ RLS ============
ALTER TABLE trabajadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuadrillas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuadrilla_trabajadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE rendimientos ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "trabajadores_lectura_publica" ON trabajadores
  FOR SELECT USING (true);

CREATE POLICY "cuadrillas_sistema_publicas" ON cuadrillas
  FOR SELECT USING (es_sistema = true OR user_id = auth.uid());

CREATE POLICY "cuadrillas_usuario_crud" ON cuadrillas
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "cuadrilla_trabajadores_select" ON cuadrilla_trabajadores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cuadrillas c
      WHERE c.id = cuadrilla_id
      AND (c.es_sistema = true OR c.user_id = auth.uid())
    )
  );

CREATE POLICY "cuadrilla_trabajadores_crud" ON cuadrilla_trabajadores
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM cuadrillas c
      WHERE c.id = cuadrilla_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "rendimientos_select" ON rendimientos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cuadrillas c
      WHERE c.id = cuadrilla_id
      AND (c.es_sistema = true OR c.user_id = auth.uid())
    )
  );

CREATE POLICY "rendimientos_crud" ON rendimientos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM cuadrillas c
      WHERE c.id = cuadrilla_id
      AND c.user_id = auth.uid()
    )
  );

-- Índices
CREATE INDEX IF NOT EXISTS idx_cuadrillas_user_id ON cuadrillas(user_id);
CREATE INDEX IF NOT EXISTS idx_cuadrillas_categoria ON cuadrillas(categoria_actividad);
CREATE INDEX IF NOT EXISTS idx_cuadrilla_trabajadores_cuadrilla ON cuadrilla_trabajadores(cuadrilla_id);
CREATE INDEX IF NOT EXISTS idx_rendimientos_cuadrilla ON rendimientos(cuadrilla_id);
