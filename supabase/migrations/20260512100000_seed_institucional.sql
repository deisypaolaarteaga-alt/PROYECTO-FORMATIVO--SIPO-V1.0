-- =============================================================
-- SIPO — Catálogo tipo obra: INSTITUCIONAL
-- Colegios, hospitales, iglesias, bibliotecas
-- Precios base Bogotá 2026 (SMMLV $1.750.905)
-- Solo capítulos + actividades. APU items en migración separada.
-- =============================================================

-- ─── CAPÍTULOS ───────────────────────────────────────────────

INSERT INTO catalogo_capitulos (codigo, nombre, tipo_obra, numero)
VALUES
  ('INS-01', 'Preliminares y Demoliciones',              'institucional', 1),
  ('INS-02', 'Cimentación y Estructura',                 'institucional', 2),
  ('INS-03', 'Mampostería y Divisiones',                 'institucional', 3),
  ('INS-04', 'Cubierta e Impermeabilización',            'institucional', 4),
  ('INS-05', 'Acabados Institucionales',                 'institucional', 5),
  ('INS-06', 'Instalaciones Hidrosanitarias',            'institucional', 6),
  ('INS-07', 'Instalaciones Eléctricas y Voz/Datos',    'institucional', 7),
  ('INS-08', 'Carpintería Metálica y Vidrios',           'institucional', 8),
  ('INS-09', 'Obras Exteriores y Urbanismo',             'institucional', 9),
  ('INS-10', 'Equipamiento Especial',                    'institucional', 10)
ON CONFLICT (codigo, tipo_obra) DO NOTHING;


-- ─── ACTIVIDADES — Cap 1: Preliminares y Demoliciones ────────

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-01-001', 'Localización y replanteo',           'm²',  3200,  2500,  4500
FROM catalogo_capitulos WHERE codigo = 'INS-01' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-01-002', 'Cerramiento provisional en zinc',    'ml',  85000, 70000, 110000
FROM catalogo_capitulos WHERE codigo = 'INS-01' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-01-003', 'Descapote y limpieza terreno',       'm²',  8500,  6000,  12000
FROM catalogo_capitulos WHERE codigo = 'INS-01' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-01-004', 'Demolición mampostería existente',   'm³',  65000, 50000, 85000
FROM catalogo_capitulos WHERE codigo = 'INS-01' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;


-- ─── ACTIVIDADES — Cap 2: Cimentación y Estructura ───────────

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-02-001', 'Excavación manual material común',          'm³',  32000,  25000,  45000
FROM catalogo_capitulos WHERE codigo = 'INS-02' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-02-002', 'Concreto zapatas 3000 PSI',                'm³',  485000, 420000, 550000
FROM catalogo_capitulos WHERE codigo = 'INS-02' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-02-003', 'Acero de refuerzo figurado y colocado',    'kg',  7200,   6800,   7800
FROM catalogo_capitulos WHERE codigo = 'INS-02' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-02-004', 'Columnas concreto 3000 PSI inc. formaleta', 'm³', 720000, 650000, 800000
FROM catalogo_capitulos WHERE codigo = 'INS-02' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-02-005', 'Vigas concreto 3000 PSI inc. formaleta',   'm³', 710000, 640000, 790000
FROM catalogo_capitulos WHERE codigo = 'INS-02' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-02-006', 'Placa aligerada e=25cm inc. casetón',      'm²', 210000, 185000, 240000
FROM catalogo_capitulos WHERE codigo = 'INS-02' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-02-007', 'Escalera concreto 3500 PSI reforzada',     'm³', 850000, 720000, 980000
FROM catalogo_capitulos WHERE codigo = 'INS-02' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;


-- ─── ACTIVIDADES — Cap 3: Mampostería y Divisiones ───────────

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-03-001', 'Muro bloque concreto 15cm',          'm²', 72000,  60000,  88000
FROM catalogo_capitulos WHERE codigo = 'INS-03' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-03-002', 'Muro ladrillo tolete estructural',   'm²', 88000,  75000,  105000
FROM catalogo_capitulos WHERE codigo = 'INS-03' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-03-003', 'Pañete liso muros 1:4 e=15mm',      'm²', 38000,  30000,  48000
FROM catalogo_capitulos WHERE codigo = 'INS-03' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-03-004', 'Filos y dilataciones',               'ml', 12500,  9000,   16000
FROM catalogo_capitulos WHERE codigo = 'INS-03' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-03-005', 'Divisiones en Superboard e=10cm',   'm²', 145000, 120000, 175000
FROM catalogo_capitulos WHERE codigo = 'INS-03' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;


-- ─── ACTIVIDADES — Cap 4: Cubierta e Impermeabilización ──────

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-04-001', 'Cubierta teja termoacústica inc. estructura', 'm²', 155000, 120000, 195000
FROM catalogo_capitulos WHERE codigo = 'INS-04' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-04-002', 'Impermeabilización cubierta 2 manos', 'm²', 48000, 38000, 62000
FROM catalogo_capitulos WHERE codigo = 'INS-04' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-04-003', 'Canaleta PVC 6"',                    'ml', 35000, 28000, 45000
FROM catalogo_capitulos WHERE codigo = 'INS-04' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-04-004', 'Bajante PVC 4"',                     'ml', 22000, 17000, 29000
FROM catalogo_capitulos WHERE codigo = 'INS-04' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;


-- ─── ACTIVIDADES — Cap 5: Acabados Institucionales ───────────

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-05-001', 'Estuco y pintura vinilo 3 manos',          'm²',  28000,  22000,  36000
FROM catalogo_capitulos WHERE codigo = 'INS-05' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-05-002', 'Piso cerámica antideslizante 30x30',       'm²',  88000,  72000,  110000
FROM catalogo_capitulos WHERE codigo = 'INS-05' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-05-003', 'Enchape baños cerámica muro',               'm²',  95000,  78000,  118000
FROM catalogo_capitulos WHERE codigo = 'INS-05' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-05-004', 'Cielo raso drywall inc. estructura',        'm²',  88000,  72000,  108000
FROM catalogo_capitulos WHERE codigo = 'INS-05' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-05-005', 'Baldosa institucional grano mármol',        'm²',  135000, 110000, 165000
FROM catalogo_capitulos WHERE codigo = 'INS-05' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-05-006', 'Guardaescoba cerámica h=8cm',               'ml',  22000,  17000,  28000
FROM catalogo_capitulos WHERE codigo = 'INS-05' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;


-- ─── ACTIVIDADES — Cap 6: Instalaciones Hidrosanitarias ──────

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-06-001', 'Punto hidráulico 1/2" PVC',                  'pto', 95000,  80000,  115000
FROM catalogo_capitulos WHERE codigo = 'INS-06' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-06-002', 'Punto sanitario 4" PVC',                     'pto', 148000, 120000, 180000
FROM catalogo_capitulos WHERE codigo = 'INS-06' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-06-003', 'Sanitario tanque fluxómetro institucional',  'und', 850000, 680000, 1050000
FROM catalogo_capitulos WHERE codigo = 'INS-06' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-06-004', 'Lavamanos empotrar con grifería',             'und', 480000, 380000, 620000
FROM catalogo_capitulos WHERE codigo = 'INS-06' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-06-005', 'Red agua fría 1/2" PVC',                     'ml',  15000,  12000,  19000
FROM catalogo_capitulos WHERE codigo = 'INS-06' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-06-006', 'Red sanitaria 4" PVC',                       'ml',  42000,  34000,  54000
FROM catalogo_capitulos WHERE codigo = 'INS-06' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-06-007', 'Caja inspección 60x60',                      'und', 285000, 220000, 360000
FROM catalogo_capitulos WHERE codigo = 'INS-06' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;


-- ─── ACTIVIDADES — Cap 7: Instalaciones Eléctricas y Voz/Datos

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-07-001', 'Punto eléctrico sencillo tubo EMT',            'pto', 78000,   62000,   98000
FROM catalogo_capitulos WHERE codigo = 'INS-07' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-07-002', 'Salida tomacorriente doble',                   'pto', 72000,   58000,   90000
FROM catalogo_capitulos WHERE codigo = 'INS-07' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-07-003', 'Tablero distribución 12 ctos. con breakers',  'und', 1850000, 1500000, 2300000
FROM catalogo_capitulos WHERE codigo = 'INS-07' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-07-004', 'Red voz/datos categoría 6 por punto',          'pto', 185000,  145000,  235000
FROM catalogo_capitulos WHERE codigo = 'INS-07' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-07-005', 'Luminaria fluorescente 2x36W instalada',       'und', 185000,  145000,  235000
FROM catalogo_capitulos WHERE codigo = 'INS-07' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-07-006', 'Canaleta metálica troquelada 8x4cm',           'ml',  38000,   30000,   48000
FROM catalogo_capitulos WHERE codigo = 'INS-07' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;


-- ─── ACTIVIDADES — Cap 8: Carpintería Metálica y Vidrios ─────

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-08-001', 'Ventana aluminio y vidrio 4mm',       'm²', 320000, 260000, 400000
FROM catalogo_capitulos WHERE codigo = 'INS-08' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-08-002', 'Puerta metálica 0.90x2.10m',         'und', 980000, 780000, 1200000
FROM catalogo_capitulos WHERE codigo = 'INS-08' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-08-003', 'Reja seguridad tubo 1"',             'm²', 285000, 225000, 360000
FROM catalogo_capitulos WHERE codigo = 'INS-08' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-08-004', 'Pasamanos metálico tubular',          'ml', 385000, 305000, 480000
FROM catalogo_capitulos WHERE codigo = 'INS-08' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;


-- ─── ACTIVIDADES — Cap 9: Obras Exteriores y Urbanismo ───────

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-09-001', 'Andén en concreto e=10cm 2500 PSI',   'm²',  95000,  78000,  118000
FROM catalogo_capitulos WHERE codigo = 'INS-09' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-09-002', 'Sardinel prefabricado 0.40x0.20m',   'ml',  38000,  30000,  48000
FROM catalogo_capitulos WHERE codigo = 'INS-09' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-09-003', 'Zona verde siembra pasto',            'm²',  18000,  14000,  24000
FROM catalogo_capitulos WHERE codigo = 'INS-09' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-09-004', 'Señalización horizontal',             'm²',  28000,  22000,  36000
FROM catalogo_capitulos WHERE codigo = 'INS-09' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-09-005', 'Cerramiento malla eslabonada 2m',     'ml',  125000, 98000,  158000
FROM catalogo_capitulos WHERE codigo = 'INS-09' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;


-- ─── ACTIVIDADES — Cap 10: Equipamiento Especial ─────────────

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-10-001', 'Cancha múltiple tubo AN inc. tablero',  'und', 18500000, 14000000, 24000000
FROM catalogo_capitulos WHERE codigo = 'INS-10' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-10-002', 'Punto de anclaje línea de vida',       'und', 850000,   680000,   1050000
FROM catalogo_capitulos WHERE codigo = 'INS-10' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades
  (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad,
   precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'institucional', 'INS-10-003', 'Extintor CO2 5lb instalado',           'und', 285000,   225000,   360000
FROM catalogo_capitulos WHERE codigo = 'INS-10' AND tipo_obra = 'institucional'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;
