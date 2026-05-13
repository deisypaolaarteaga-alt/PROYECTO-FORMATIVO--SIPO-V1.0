-- =============================================================
-- SIPO — Catálogo tipo obra: HOTELERO
-- Hoteles, hostales, apartahoteles, resorts
-- Precios base Bogotá 2026 (SMMLV $1.750.905)
-- =============================================================

-- ─── CAPÍTULOS ───────────────────────────────────────────────

INSERT INTO catalogo_capitulos (codigo, nombre, tipo_obra, numero)
VALUES
  ('HOT-01', 'Preliminares',                              'hotelero', 1),
  ('HOT-02', 'Cimentación y Estructura',                  'hotelero', 2),
  ('HOT-03', 'Mampostería y Divisiones',                  'hotelero', 3),
  ('HOT-04', 'Cubierta',                                  'hotelero', 4),
  ('HOT-05', 'Acabados de Alta Gama',                     'hotelero', 5),
  ('HOT-06', 'Instalaciones Hidrosanitarias Hoteleras',   'hotelero', 6),
  ('HOT-07', 'Instalaciones Eléctricas y Automatización', 'hotelero', 7),
  ('HOT-08', 'Carpintería Fina y Vidrios',                'hotelero', 8),
  ('HOT-09', 'Zonas Húmedas y Piscina',                   'hotelero', 9),
  ('HOT-10', 'Áreas Sociales y Exteriores',               'hotelero', 10)
ON CONFLICT (codigo, tipo_obra) DO NOTHING;


-- ─── ACTIVIDADES — Cap 1: Preliminares ───────────────────────

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-01-001', 'Localización y replanteo',             'm²',  3200,  2500,  4500
FROM catalogo_capitulos WHERE codigo = 'HOT-01' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-01-002', 'Cerramiento provisional en zinc',      'ml',  85000, 70000, 110000
FROM catalogo_capitulos WHERE codigo = 'HOT-01' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-01-003', 'Descapote y limpieza terreno',         'm²',  8500,  6000,  12000
FROM catalogo_capitulos WHERE codigo = 'HOT-01' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-01-004', 'Demolición mampostería existente',     'm³',  65000, 50000, 85000
FROM catalogo_capitulos WHERE codigo = 'HOT-01' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;


-- ─── ACTIVIDADES — Cap 2: Cimentación y Estructura ───────────

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-02-001', 'Excavación manual material común',           'm³',  32000,  25000,  45000
FROM catalogo_capitulos WHERE codigo = 'HOT-02' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-02-002', 'Concreto zapatas 3000 PSI',                 'm³',  485000, 420000, 550000
FROM catalogo_capitulos WHERE codigo = 'HOT-02' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-02-003', 'Acero de refuerzo figurado y colocado',     'kg',  7200,   6800,   7800
FROM catalogo_capitulos WHERE codigo = 'HOT-02' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-02-004', 'Columnas concreto 3000 PSI inc. formaleta', 'm³',  720000, 650000, 800000
FROM catalogo_capitulos WHERE codigo = 'HOT-02' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-02-005', 'Vigas concreto 3000 PSI inc. formaleta',   'm³',  710000, 640000, 790000
FROM catalogo_capitulos WHERE codigo = 'HOT-02' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-02-006', 'Placa aligerada e=25cm inc. casetón',      'm²',  210000, 185000, 240000
FROM catalogo_capitulos WHERE codigo = 'HOT-02' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-02-007', 'Escalera concreto 3500 PSI reforzada',     'm³',  850000, 720000, 980000
FROM catalogo_capitulos WHERE codigo = 'HOT-02' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;


-- ─── ACTIVIDADES — Cap 3: Mampostería y Divisiones ───────────

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-03-001', 'Muro bloque concreto 15cm',          'm²', 72000,  60000,  88000
FROM catalogo_capitulos WHERE codigo = 'HOT-03' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-03-002', 'Muro ladrillo tolete estructural',   'm²', 88000,  75000,  105000
FROM catalogo_capitulos WHERE codigo = 'HOT-03' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-03-003', 'Pañete liso muros 1:4 e=15mm',      'm²', 38000,  30000,  48000
FROM catalogo_capitulos WHERE codigo = 'HOT-03' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-03-004', 'Filos y dilataciones',               'ml', 12500,  9000,   16000
FROM catalogo_capitulos WHERE codigo = 'HOT-03' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-03-005', 'Divisiones en Superboard e=10cm',   'm²', 145000, 120000, 175000
FROM catalogo_capitulos WHERE codigo = 'HOT-03' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;


-- ─── ACTIVIDADES — Cap 4: Cubierta ───────────────────────────

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-04-001', 'Cubierta teja termoacústica inc. estructura', 'm²', 155000, 120000, 195000
FROM catalogo_capitulos WHERE codigo = 'HOT-04' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-04-002', 'Impermeabilización cubierta 2 manos', 'm²', 48000, 38000, 62000
FROM catalogo_capitulos WHERE codigo = 'HOT-04' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-04-003', 'Canaleta PVC 6"',                    'ml',  35000, 28000, 45000
FROM catalogo_capitulos WHERE codigo = 'HOT-04' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-04-004', 'Bajante PVC 4"',                     'ml',  22000, 17000, 29000
FROM catalogo_capitulos WHERE codigo = 'HOT-04' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;


-- ─── ACTIVIDADES — Cap 5: Acabados de Alta Gama ──────────────

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-05-001', 'Piso porcelanato rectificado 60x60',    'm²', 185000, 148000, 235000
FROM catalogo_capitulos WHERE codigo = 'HOT-05' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-05-002', 'Piso madera laminada 8mm',             'm²', 125000, 98000,  158000
FROM catalogo_capitulos WHERE codigo = 'HOT-05' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-05-003', 'Enchape mármol o cuarzo baño',         'm²', 285000, 225000, 360000
FROM catalogo_capitulos WHERE codigo = 'HOT-05' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-05-004', 'Estuco veneciano 2 manos',             'm²', 85000,  68000,  108000
FROM catalogo_capitulos WHERE codigo = 'HOT-05' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-05-005', 'Pintura base agua mate premium',       'm²', 32000,  26000,  40000
FROM catalogo_capitulos WHERE codigo = 'HOT-05' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-05-006', 'Cielo raso drywall curvo o diseño',    'm²', 125000, 98000,  158000
FROM catalogo_capitulos WHERE codigo = 'HOT-05' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-05-007', 'Listón madera MH o similar',           'm²', 185000, 145000, 235000
FROM catalogo_capitulos WHERE codigo = 'HOT-05' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;


-- ─── ACTIVIDADES — Cap 6: Instalaciones Hidrosanitarias ──────

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-06-001', 'Punto hidráulico 1/2" cobre',            'pto', 145000,  115000,  182000
FROM catalogo_capitulos WHERE codigo = 'HOT-06' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-06-002', 'Punto sanitario 4" PVC',               'pto', 148000,  120000,  185000
FROM catalogo_capitulos WHERE codigo = 'HOT-06' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-06-003', 'Mezclador monocomando ducha empotrar',  'und', 850000,  650000,  1100000
FROM catalogo_capitulos WHERE codigo = 'HOT-06' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-06-004', 'Sanitario pared descarga dual',         'und', 1250000, 980000,  1580000
FROM catalogo_capitulos WHERE codigo = 'HOT-06' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-06-005', 'Lavamanos sobre mesón diseño',          'und', 780000,  620000,  980000
FROM catalogo_capitulos WHERE codigo = 'HOT-06' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-06-006', 'Jacuzzi 2 personas',                   'und', 8500000, 6500000, 11500000
FROM catalogo_capitulos WHERE codigo = 'HOT-06' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;


-- ─── ACTIVIDADES — Cap 7: Instalaciones Eléctricas y Automatización

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-07-001', 'Punto eléctrico sencillo con regulador', 'pto', 125000,  98000,   158000
FROM catalogo_capitulos WHERE codigo = 'HOT-07' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-07-002', 'Sistema domótica habitación',           'hab', 2800000, 2200000, 3800000
FROM catalogo_capitulos WHERE codigo = 'HOT-07' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-07-003', 'Red voz/datos CAT6 por punto',          'pto', 195000,  155000,  245000
FROM catalogo_capitulos WHERE codigo = 'HOT-07' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-07-004', 'CCTV cámara domo inc. cableado',        'und', 850000,  680000,  1100000
FROM catalogo_capitulos WHERE codigo = 'HOT-07' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-07-005', 'Luminaria decorativa LED empotrar',     'und', 185000,  145000,  235000
FROM catalogo_capitulos WHERE codigo = 'HOT-07' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;


-- ─── ACTIVIDADES — Cap 8: Carpintería Fina y Vidrios ─────────

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-08-001', 'Ventana aluminio y vidrio templado 6mm', 'm²',  520000,  415000,  655000
FROM catalogo_capitulos WHERE codigo = 'HOT-08' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-08-002', 'Puerta madera sólida lacada',           'und', 2200000, 1750000, 2850000
FROM catalogo_capitulos WHERE codigo = 'HOT-08' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-08-003', 'Mueble baño melamina con lavamanos',    'und', 1850000, 1480000, 2380000
FROM catalogo_capitulos WHERE codigo = 'HOT-08' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-08-004', 'Closet habitación melamina 18mm',       'ml',  1250000, 980000,  1580000
FROM catalogo_capitulos WHERE codigo = 'HOT-08' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;


-- ─── ACTIVIDADES — Cap 9: Zonas Húmedas y Piscina ────────────

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-09-001', 'Piscina adultos revestida en azulejo', 'm²',  3200000,  2500000,  4200000
FROM catalogo_capitulos WHERE codigo = 'HOT-09' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-09-002', 'Cuarto de máquinas piscina',           'und', 12500000, 9800000,  16500000
FROM catalogo_capitulos WHERE codigo = 'HOT-09' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-09-003', 'Ducha exterior en PVC',               'und', 485000,   385000,   625000
FROM catalogo_capitulos WHERE codigo = 'HOT-09' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;


-- ─── ACTIVIDADES — Cap 10: Áreas Sociales y Exteriores ───────

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-10-001', 'Deck madera plástica e=28mm',        'm²',  225000, 178000, 285000
FROM catalogo_capitulos WHERE codigo = 'HOT-10' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-10-002', 'Jardinería tropical por m²',          'm²',  125000, 98000,  158000
FROM catalogo_capitulos WHERE codigo = 'HOT-10' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-10-003', 'Iluminación paisajística LED',        'und', 385000, 305000, 480000
FROM catalogo_capitulos WHERE codigo = 'HOT-10' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'hotelero', 'HOT-10-004', 'Señalización hotelera rótulo',        'und', 485000, 385000, 625000
FROM catalogo_capitulos WHERE codigo = 'HOT-10' AND tipo_obra = 'hotelero'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;
