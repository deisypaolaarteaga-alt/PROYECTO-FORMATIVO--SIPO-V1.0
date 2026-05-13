-- ============================================
-- SIPO — Datos Semilla (Colombia 2026)
-- ============================================

-- 1. MATERIALES MÁS USADOS
INSERT INTO materials (nombre, unidad, precio_referencia, categoria) VALUES
('Bloque de concreto #5', 'und', 2800, 'Mampostería'),
('Bloque de concreto #4', 'und', 2200, 'Mampostería'),
('Ladrillo tolete', 'und', 850, 'Mampostería'),
('Cemento gris x50kg', 'bul', 32000, 'Cementos'),
('Arena de pega', 'm³', 85000, 'Agregados'),
('Arena de río lavada', 'm³', 95000, 'Agregados'),
('Gravilla', 'm³', 110000, 'Agregados'),
('Acero corrugado 1/2"', 'kg', 4200, 'Aceros'),
('Acero corrugado 3/8"', 'kg', 4100, 'Aceros'),
('Malla electrosoldada', 'm²', 18500, 'Aceros'),
('Concreto premezclado 3000 psi', 'm³', 480000, 'Concretos'),
('Madera formaleta', 'm²', 35000, 'Formaletería'),
('Teja zinc cal 28', 'm²', 28000, 'Cubiertas'),
('Teja fibrocemento', 'm²', 32000, 'Cubiertas'),
('Tubería PVC 4" sanitaria', 'ml', 18500, 'Hidrosanitario'),
('Tubería PVC 2" sanitaria', 'ml', 8200, 'Hidrosanitario'),
('Tubería PVC 1/2" presión', 'ml', 4800, 'Hidrosanitario'),
('Tubería conduit 3/4"', 'ml', 3200, 'Eléctrico'),
('Cable THHN #12', 'ml', 2800, 'Eléctrico'),
('Cable THHN #10', 'ml', 3500, 'Eléctrico'),
('Piso cerámico 33x33', 'm²', 28000, 'Acabados'),
('Porcelanato 60x60', 'm²', 65000, 'Acabados'),
('Pintura vinilo tipo 1', 'gl', 48000, 'Pinturas'),
('Pintura vinilo tipo 2', 'gl', 68000, 'Pinturas'),
('Estuco plástico', 'kg', 3200, 'Acabados'),
('Pañete impermeabilizante', 'kg', 4800, 'Acabados'),
('Sikaflex', 'und', 28000, 'Aditivos'),
('Alambre negro', 'kg', 5200, 'Aceros'),
('Clavos 2"', 'kg', 4800, 'Formaletería'),
('Cal hidratada', 'bul', 18000, 'Acabados');

-- 2. MANO DE OBRA (JORNALES)
INSERT INTO labor (nombre, oficio, precio_diario, departamento) VALUES
('Maestro general', 'maestro', 110000, 'Riesgo 4'),
('Oficial albañil', 'albañil', 78000, 'Riesgo 4'),
('Oficial carpintero', 'carpintero', 80000, 'Riesgo 4'),
('Oficial electricista', 'electricista', 85000, 'Riesgo 3'),
('Oficial plomero', 'plomero', 82000, 'Riesgo 3'),
('Oficial pintor', 'pintor', 75000, 'Riesgo 2'),
('Oficial ceramiquero', 'enchapador', 78000, 'Riesgo 3'),
('Ayudante construcción', 'ayudante', 55000, 'Riesgo 4'),
('Ayudante electricista', 'ayudante', 52000, 'Riesgo 3'),
('Ayudante pintor', 'ayudante', 50000, 'Riesgo 2');

-- 3. EQUIPOS (TARIFAS)
INSERT INTO equipment (nombre, tipo, precio_diario) VALUES
('Mezcladora de concreto', 'maquinaria', 85000),
('Vibrador de concreto', 'herramienta', 45000),
('Andamio tubular (módulo)', 'andamios', 8500),
('Taladro percutor', 'herramienta', 35000),
('Amoladora', 'herramienta', 28000),
('Compactador manual', 'maquinaria', 95000),
('Nivel láser', 'herramienta', 55000),
('Formaleta metálica', 'formaletería', 4500);

-- 4. TABLAS PARA CUADRILLAS (Asegurar existencia)
CREATE TABLE IF NOT EXISTS cuadrillas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria_actividad TEXT,
  es_sistema BOOLEAN DEFAULT true,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trabajadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  especialidad TEXT NOT NULL,
  jornal_base NUMERIC NOT NULL,
  riesgo INTEGER DEFAULT 3,
  activo BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS cuadrilla_trabajadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuadrilla_id UUID REFERENCES cuadrillas(id) ON DELETE CASCADE,
  trabajador_id UUID REFERENCES trabajadores(id) ON DELETE CASCADE,
  cantidad NUMERIC DEFAULT 1
);

-- 5. POBLAR TRABAJADORES BASE
INSERT INTO trabajadores (especialidad, jornal_base, riesgo) VALUES
('Oficial albañil', 78000, 4),
('Oficial carpintero', 80000, 4),
('Oficial electricista', 85000, 3),
('Oficial plomero', 82000, 3),
('Oficial pintor', 75000, 2),
('Oficial ceramiquero', 78000, 3),
('Ayudante construcción', 55000, 4);

-- 6. POBLAR CUADRILLAS DEL SISTEMA
DO $$
DECLARE
  oficial_alba_id UUID;
  ayudante_id UUID;
  oficial_elec_id UUID;
  oficial_plom_id UUID;
  oficial_pint_id UUID;
  oficial_cera_id UUID;
  c_mamp_id UUID;
  c_conc_id UUID;
  c_pane_id UUID;
  c_elec_id UUID;
  c_hidr_id UUID;
  c_piso_id UUID;
  c_pint_id UUID;
BEGIN
  -- Obtener IDs de trabajadores
  SELECT id INTO oficial_alba_id FROM trabajadores WHERE especialidad = 'Oficial albañil' LIMIT 1;
  SELECT id INTO ayudante_id FROM trabajadores WHERE especialidad = 'Ayudante construcción' LIMIT 1;
  SELECT id INTO oficial_elec_id FROM trabajadores WHERE especialidad = 'Oficial electricista' LIMIT 1;
  SELECT id INTO oficial_plom_id FROM trabajadores WHERE especialidad = 'Oficial plomero' LIMIT 1;
  SELECT id INTO oficial_pint_id FROM trabajadores WHERE especialidad = 'Oficial pintor' LIMIT 1;
  SELECT id INTO oficial_cera_id FROM trabajadores WHERE especialidad = 'Oficial ceramiquero' LIMIT 1;

  -- Insertar Cuadrillas
  INSERT INTO cuadrillas (nombre, categoria_actividad, descripcion) VALUES 
  ('Cuadrilla mampostería bloque', 'Mampostería', '1 Oficial + 1 Ayudante (8 m²/día)') RETURNING id INTO c_mamp_id;
  
  INSERT INTO cuadrillas (nombre, categoria_actividad, descripcion) VALUES 
  ('Cuadrilla concretos', 'Concretos', '1 Oficial + 2 Ayudantes (15 m²/día)') RETURNING id INTO c_conc_id;

  INSERT INTO cuadrillas (nombre, categoria_actividad, descripcion) VALUES 
  ('Cuadrilla pañetes', 'Pañetes', '1 Oficial + 1 Ayudante (12 m²/día)') RETURNING id INTO c_pane_id;

  INSERT INTO cuadrillas (nombre, categoria_actividad, descripcion) VALUES 
  ('Cuadrilla eléctrica', 'Eléctrica', '1 Oficial + 1 Ayudante (7 puntos/día)') RETURNING id INTO c_elec_id;

  INSERT INTO cuadrillas (nombre, categoria_actividad, descripcion) VALUES 
  ('Cuadrilla hidráulica', 'Hidráulica', '1 Oficial + 1 Ayudante (6 puntos/día)') RETURNING id INTO c_hidr_id;

  INSERT INTO cuadrillas (nombre, categoria_actividad, descripcion) VALUES 
  ('Cuadrilla pisos cerámicos', 'Pisos', '1 Oficial + 1 Ayudante (8 m²/día)') RETURNING id INTO c_piso_id;

  INSERT INTO cuadrillas (nombre, categoria_actividad, descripcion) VALUES 
  ('Cuadrilla pintura', 'Acabados', '1 Oficial + 1 Ayudante (35 m²/día)') RETURNING id INTO c_pint_id;

  -- Relacionar trabajadores con cuadrillas
  INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad) VALUES
  (c_mamp_id, oficial_alba_id, 1), (c_mamp_id, ayudante_id, 1),
  (c_conc_id, oficial_alba_id, 1), (c_conc_id, ayudante_id, 2),
  (c_pane_id, oficial_alba_id, 1), (c_pane_id, ayudante_id, 1),
  (c_elec_id, oficial_elec_id, 1), (c_elec_id, ayudante_id, 1),
  (c_hidr_id, oficial_plom_id, 1), (c_hidr_id, ayudante_id, 1),
  (c_piso_id, oficial_cera_id, 1), (c_piso_id, ayudante_id, 1),
  (c_pint_id, oficial_pint_id, 1), (c_pint_id, ayudante_id, 1);
END $$;
