-- ============================================
-- SIPO — Datos semilla de referencia
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- ============ MATERIALES DE REFERENCIA ============

INSERT INTO materials (nombre, unidad, precio_referencia, departamento, categoria) VALUES
-- Concretos y cementos
('Cemento Portland Tipo I (50kg)', 'bulto', 38500, 'Bogotá', 'Concretos y cementos'),
('Cemento Portland Tipo I (50kg)', 'bulto', 37000, 'Medellín', 'Concretos y cementos'),
('Cemento Portland Tipo I (50kg)', 'bulto', 39500, 'Cali', 'Concretos y cementos'),
('Concreto premezclado 3000 PSI', 'm³', 520000, 'Bogotá', 'Concretos y cementos'),
('Concreto premezclado 3000 PSI', 'm³', 505000, 'Medellín', 'Concretos y cementos'),
('Concreto premezclado 4000 PSI', 'm³', 580000, 'Bogotá', 'Concretos y cementos'),
('Mortero de pega 1:4', 'm³', 380000, 'Bogotá', 'Concretos y cementos'),
-- Aceros y hierros
('Acero figurado 60000 PSI', 'kg', 4850, 'Bogotá', 'Aceros y hierros'),
('Acero figurado 60000 PSI', 'kg', 4700, 'Medellín', 'Aceros y hierros'),
('Acero figurado 60000 PSI', 'kg', 5000, 'Barranquilla', 'Aceros y hierros'),
('Malla electrosoldada M-131', 'un', 72000, 'Bogotá', 'Aceros y hierros'),
('Malla electrosoldada M-221', 'un', 115000, 'Bogotá', 'Aceros y hierros'),
('Alambre negro calibre 18', 'kg', 6200, 'Bogotá', 'Aceros y hierros'),
-- Ladrillos y bloques
('Bloque de concreto 10x20x40', 'un', 3200, 'Bogotá', 'Ladrillos y bloques'),
('Bloque de concreto 10x20x40', 'un', 2900, 'Medellín', 'Ladrillos y bloques'),
('Bloque de concreto 15x20x40', 'un', 4200, 'Bogotá', 'Ladrillos y bloques'),
('Ladrillo tolete común', 'un', 950, 'Bogotá', 'Ladrillos y bloques'),
('Ladrillo farol No. 4', 'un', 1100, 'Bogotá', 'Ladrillos y bloques'),
('Ladrillo rejilla 6x12x24', 'un', 850, 'Bogotá', 'Ladrillos y bloques'),
-- Arena y gravas
('Arena de peña', 'm³', 85000, 'Bogotá', 'Arena y gravas'),
('Arena lavada de río', 'm³', 95000, 'Bogotá', 'Arena y gravas'),
('Grava triturada 3/4"', 'm³', 120000, 'Bogotá', 'Arena y gravas'),
('Recebo compactado', 'm³', 55000, 'Bogotá', 'Arena y gravas'),
('Piedra rajón', 'm³', 75000, 'Bogotá', 'Arena y gravas'),
-- Maderas
('Tabla burra 3m', 'un', 22000, 'Bogotá', 'Maderas'),
('Listón 2x3 pulgadas 3m', 'un', 12000, 'Bogotá', 'Maderas'),
('Tríplex 4mm 1.22x2.44', 'un', 45000, 'Bogotá', 'Maderas'),
('Formaleta metálica (alquiler/día)', 'm²', 3500, 'Bogotá', 'Maderas'),
-- Pinturas
('Vinilo tipo 1 (5 galones)', 'un', 185000, 'Bogotá', 'Pinturas'),
('Vinilo tipo 1 (5 galones)', 'un', 178000, 'Medellín', 'Pinturas'),
('Estuco plástico (25kg)', 'bulto', 42000, 'Bogotá', 'Pinturas'),
('Anticorrosivo rojo (galón)', 'un', 65000, 'Bogotá', 'Pinturas'),
('Esmalte sintético (galón)', 'un', 72000, 'Bogotá', 'Pinturas'),
-- Eléctricos
('Cable THHN #12 AWG', 'm', 3800, 'Bogotá', 'Eléctricos'),
('Cable THHN #10 AWG', 'm', 5200, 'Bogotá', 'Eléctricos'),
('Tubería EMT 1/2"', 'un', 12500, 'Bogotá', 'Eléctricos'),
('Tubería PVC eléctrica 1/2"', 'un', 4200, 'Bogotá', 'Eléctricos'),
('Toma doble con polo a tierra', 'un', 8500, 'Bogotá', 'Eléctricos'),
('Interruptor sencillo', 'un', 7500, 'Bogotá', 'Eléctricos'),
-- Hidráulicos
('Tubería PVC presión 1/2"', 'm', 4800, 'Bogotá', 'Hidráulicos'),
('Tubería PVC presión 3/4"', 'm', 6500, 'Bogotá', 'Hidráulicos'),
('Tubería PVC sanitaria 4"', 'm', 18000, 'Bogotá', 'Hidráulicos'),
('Registro de bola 1/2"', 'un', 15000, 'Bogotá', 'Hidráulicos'),
('Sanitario completo línea económica', 'un', 280000, 'Bogotá', 'Hidráulicos'),
('Lavamanos con pedestal', 'un', 195000, 'Bogotá', 'Hidráulicos'),
-- Acabados
('Porcelanato 60x60 nacional', 'm²', 52000, 'Bogotá', 'Acabados'),
('Cerámica 33x33 pared', 'm²', 28000, 'Bogotá', 'Acabados'),
('Enchape metro grande (porcelanato)', 'm²', 65000, 'Bogotá', 'Acabados'),
-- Impermeabilizantes
('Sika 1 (galón)', 'un', 42000, 'Bogotá', 'Impermeabilizantes'),
('Manto asfáltico 3mm', 'm²', 22000, 'Bogotá', 'Impermeabilizantes'),
-- Cubiertas
('Teja termoacústica (perfil 10)', 'm', 38000, 'Bogotá', 'Cubiertas'),
('Teja de barro colonial', 'un', 2800, 'Bogotá', 'Cubiertas'),
('Estructura metálica correa C 6"', 'm', 35000, 'Bogotá', 'Cubiertas');

-- ============ MANO DE OBRA ============

INSERT INTO labor (nombre, oficio, precio_diario, prestaciones_porcentaje, departamento) VALUES
('Director de obra', 'Director', 450000, 55.68, 'Bogotá'),
('Residente de obra', 'Residente', 280000, 55.68, 'Bogotá'),
('Maestro general', 'Maestro', 180000, 55.68, 'Bogotá'),
('Oficial de construcción', 'Oficial', 120000, 55.68, 'Bogotá'),
('Oficial de construcción', 'Oficial', 110000, 55.68, 'Medellín'),
('Oficial de construcción', 'Oficial', 105000, 55.68, 'Cali'),
('Ayudante de construcción', 'Ayudante', 75000, 55.68, 'Bogotá'),
('Ayudante de construcción', 'Ayudante', 70000, 55.68, 'Medellín'),
('Electricista certificado', 'Electricista', 140000, 55.68, 'Bogotá'),
('Plomero / Instalador hidráulico', 'Plomero', 130000, 55.68, 'Bogotá'),
('Pintor de obra', 'Pintor', 110000, 55.68, 'Bogotá'),
('Soldador calificado', 'Soldador', 150000, 55.68, 'Bogotá'),
('Carpintero de obra', 'Carpintero', 120000, 55.68, 'Bogotá'),
('Ceramiquero / Enchapador', 'Ceramiquero', 130000, 55.68, 'Bogotá'),
('Operador de maquinaria', 'Operador', 160000, 55.68, 'Bogotá');

-- ============ EQUIPOS ============

INSERT INTO equipment (nombre, tipo, precio_diario, precio_semanal, precio_mensual, departamento) VALUES
('Mezcladora de concreto (1 bulto)', 'Mezcladora', 85000, 450000, 1500000, 'Bogotá'),
('Vibrador de concreto', 'Vibrador', 65000, 350000, 1200000, 'Bogotá'),
('Andamio colgante (sección)', 'Andamio', 15000, 80000, 250000, 'Bogotá'),
('Compresor de aire', 'Compresor', 120000, 650000, 2200000, 'Bogotá'),
('Taladro percutor', 'Taladro', 35000, 180000, 600000, 'Bogotá'),
('Amoladora / Pulidora 7"', 'Amoladora', 30000, 150000, 500000, 'Bogotá'),
('Pulidora de pisos', 'Pulidora', 85000, 450000, 1500000, 'Bogotá'),
('Formaleta metálica (juego completo)', 'Formaleta', 45000, 250000, 800000, 'Bogotá'),
('Retroexcavadora CAT 420', 'Retroexcavadora', 850000, NULL, NULL, 'Bogotá'),
('Volqueta 7m³', 'Volqueta', 450000, NULL, NULL, 'Bogotá'),
('Compactador tipo rana', 'Compactador', 95000, 500000, 1700000, 'Bogotá'),
('Nivel láser', 'Nivel láser', 45000, 220000, 750000, 'Bogotá'),
('Estación total topográfica', 'Estación total', 250000, 1200000, 4000000, 'Bogotá');
