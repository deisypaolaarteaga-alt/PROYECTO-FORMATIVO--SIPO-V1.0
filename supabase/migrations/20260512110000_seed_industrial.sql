-- =============================================================
-- SIPO — Catálogo tipo obra: INDUSTRIAL
-- Bodegas, plantas, hangares, talleres
-- Precios base Bogotá 2026 (SMMLV $1.750.905)
-- =============================================================

-- ─── CAPÍTULOS ───────────────────────────────────────────────

INSERT INTO catalogo_capitulos (codigo, nombre, tipo_obra, numero)
VALUES
  ('IND-01', 'Preliminares y Movimiento de Tierras', 'industrial', 1),
  ('IND-02', 'Cimentación Industrial',               'industrial', 2),
  ('IND-03', 'Estructura Metálica',                  'industrial', 3),
  ('IND-04', 'Cubierta Metálica',                    'industrial', 4),
  ('IND-05', 'Cerramiento y Fachadas',               'industrial', 5),
  ('IND-06', 'Pisos Industriales',                   'industrial', 6),
  ('IND-07', 'Instalaciones Industriales',           'industrial', 7),
  ('IND-08', 'Accesos y Plataformas',                'industrial', 8),
  ('IND-09', 'Obras Civiles Complementarias',        'industrial', 9)
ON CONFLICT (codigo, tipo_obra) DO NOTHING;


-- ─── ACTIVIDADES — Cap 1: Preliminares y Movimiento de Tierras

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'industrial', 'IND-01-001', 'Localización y replanteo',           'm²',  2800,  2000,  4000
FROM catalogo_capitulos WHERE codigo = 'IND-01' AND tipo_obra = 'industrial'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'industrial', 'IND-01-002', 'Descapote mecanizado',               'm²',  6500,  4500,  9500
FROM catalogo_capitulos WHERE codigo = 'IND-01' AND tipo_obra = 'industrial'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'industrial', 'IND-01-003', 'Relleno compactado con recebo',      'm³',  52000, 42000, 66000
FROM catalogo_capitulos WHERE codigo = 'IND-01' AND tipo_obra = 'industrial'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'industrial', 'IND-01-004', 'Excavación mecánica',                'm³',  22000, 16000, 30000
FROM catalogo_capitulos WHERE codigo = 'IND-01' AND tipo_obra = 'industrial'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;


-- ─── ACTIVIDADES — Cap 2: Cimentación Industrial ─────────────

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'industrial', 'IND-02-001', 'Dado de cimentación concreto 3000 PSI',    'm³',  520000, 440000, 620000
FROM catalogo_capitulos WHERE codigo = 'IND-02' AND tipo_obra = 'industrial'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'industrial', 'IND-02-002', 'Placa de contrapiso e=15cm 3000 PSI',      'm²',  135000, 110000, 165000
FROM catalogo_capitulos WHERE codigo = 'IND-02' AND tipo_obra = 'industrial'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'industrial', 'IND-02-003', 'Viga de amarre perimetral 3000 PSI',       'm³',  720000, 620000, 840000
FROM catalogo_capitulos WHERE codigo = 'IND-02' AND tipo_obra = 'industrial'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'industrial', 'IND-02-004', 'Acero refuerzo figurado y colocado',       'kg',  7200,   6800,   7800
FROM catalogo_capitulos WHERE codigo = 'IND-02' AND tipo_obra = 'industrial'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;


-- ─── ACTIVIDADES — Cap 3: Estructura Metálica ────────────────

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'industrial', 'IND-03-001', 'Columna metálica perfil W inc. pintura',       'kg', 8500, 7000,  10500
FROM catalogo_capitulos WHERE codigo = 'IND-03' AND tipo_obra = 'industrial'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'industrial', 'IND-03-002', 'Viga metálica cercha prefab. inc. pintura',   'kg', 7800, 6500,  9500
FROM catalogo_capitulos WHERE codigo = 'IND-03' AND tipo_obra = 'industrial'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'industrial', 'IND-03-003', 'Correa perfil C o Z inc. pintura',            'kg', 6500, 5200,  8200
FROM catalogo_capitulos WHERE codigo = 'IND-03' AND tipo_obra = 'industrial'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'industrial', 'IND-03-004', 'Placa de anclaje inc. pernos',               'und', 285000, 220000, 360000
FROM catalogo_capitulos WHERE codigo = 'IND-03' AND tipo_obra = 'industrial'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;


-- ─── ACTIVIDADES — Cap 4: Cubierta Metálica ──────────────────

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'industrial', 'IND-04-001', 'Cubierta teja metálica termoacústica e=50mm', 'm²', 135000, 108000, 168000
FROM catalogo_capitulos WHERE codigo = 'IND-04' AND tipo_obra = 'industrial'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'industrial', 'IND-04-002', 'Translúcido policarbonato e=6mm',            'm²', 125000, 98000,  158000
FROM catalogo_capitulos WHERE codigo = 'IND-04' AND tipo_obra = 'industrial'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'industrial', 'IND-04-003', 'Canal aguas lluvias lámina cal 18',          'ml',  55000,  42000,  70000
FROM catalogo_capitulos WHERE codigo = 'IND-04' AND tipo_obra = 'industrial'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'industrial', 'IND-04-004', 'Bajante metálica 4"',                        'ml',  38000,  30000,  48000
FROM catalogo_capitulos WHERE codigo = 'IND-04' AND tipo_obra = 'industrial'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;


-- ─── ACTIVIDADES — Cap 5: Cerramiento y Fachadas ─────────────

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'industrial', 'IND-05-001', 'Panel Superboard e=11mm doble forro',    'm²', 165000, 132000, 205000
FROM catalogo_capitulos WHERE codigo = 'IND-05' AND tipo_obra = 'industrial'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'industrial', 'IND-05-002', 'Cerramiento fachada lámina metálica',    'm²', 145000, 115000, 182000
FROM catalogo_capitulos WHERE codigo = 'IND-05' AND tipo_obra = 'industrial'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'industrial', 'IND-05-003', 'Muro bloque concreto 20cm',             'm²', 88000,  72000,  108000
FROM catalogo_capitulos WHERE codigo = 'IND-05' AND tipo_obra = 'industrial'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;


-- ─── ACTIVIDADES — Cap 6: Pisos Industriales ─────────────────

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'industrial', 'IND-06-001', 'Placa piso concreto e=20cm 4000 PSI pulido', 'm²', 185000, 148000, 230000
FROM catalogo_capitulos WHERE codigo = 'IND-06' AND tipo_obra = 'industrial'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'industrial', 'IND-06-002', 'Endurecedor mineral cuarzo 5kg/m²',         'm²', 28000,  22000,  36000
FROM catalogo_capitulos WHERE codigo = 'IND-06' AND tipo_obra = 'industrial'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'industrial', 'IND-06-003', 'Juntas de dilatación metálicas',            'ml',  48000,  38000,  60000
FROM catalogo_capitulos WHERE codigo = 'IND-06' AND tipo_obra = 'industrial'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'industrial', 'IND-06-004', 'Pintura epoxi para piso industrial',        'm²',  58000,  46000,  72000
FROM catalogo_capitulos WHERE codigo = 'IND-06' AND tipo_obra = 'industrial'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;


-- ─── ACTIVIDADES — Cap 7: Instalaciones Industriales ─────────

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'industrial', 'IND-07-001', 'Punto eléctrico industrial trifásico',   'pto', 185000,  148000,  230000
FROM catalogo_capitulos WHERE codigo = 'IND-07' AND tipo_obra = 'industrial'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'industrial', 'IND-07-002', 'Tablero eléctrico 24 ctos trifásico',   'und', 4800000, 3800000, 6200000
FROM catalogo_capitulos WHERE codigo = 'IND-07' AND tipo_obra = 'industrial'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'industrial', 'IND-07-003', 'Punto hidráulico industrial 3/4"',      'pto', 125000,  98000,   158000
FROM catalogo_capitulos WHERE codigo = 'IND-07' AND tipo_obra = 'industrial'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'industrial', 'IND-07-004', 'Punto sanitario 6" PVC',               'pto', 285000,  225000,  360000
FROM catalogo_capitulos WHERE codigo = 'IND-07' AND tipo_obra = 'industrial'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'industrial', 'IND-07-005', 'Red contra incendio Sprinkler',         'pto', 285000,  220000,  360000
FROM catalogo_capitulos WHERE codigo = 'IND-07' AND tipo_obra = 'industrial'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;


-- ─── ACTIVIDADES — Cap 8: Accesos y Plataformas ──────────────

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'industrial', 'IND-08-001', 'Puerta enrollable metálica 4x4m',           'und', 5200000, 4200000, 6800000
FROM catalogo_capitulos WHERE codigo = 'IND-08' AND tipo_obra = 'industrial'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'industrial', 'IND-08-002', 'Plataforma de carga nivelable',             'und', 8500000, 6800000, 11000000
FROM catalogo_capitulos WHERE codigo = 'IND-08' AND tipo_obra = 'industrial'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'industrial', 'IND-08-003', 'Rampa vehicular concreto e=20cm',           'm²',  185000,  148000,  230000
FROM catalogo_capitulos WHERE codigo = 'IND-08' AND tipo_obra = 'industrial'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'industrial', 'IND-08-004', 'Portón metálico acceso vehicular 6m',       'und', 4200000, 3200000, 5500000
FROM catalogo_capitulos WHERE codigo = 'IND-08' AND tipo_obra = 'industrial'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;


-- ─── ACTIVIDADES — Cap 9: Obras Civiles Complementarias ──────

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'industrial', 'IND-09-001', 'Vía interna en concreto e=20cm',         'm²',  205000, 165000, 255000
FROM catalogo_capitulos WHERE codigo = 'IND-09' AND tipo_obra = 'industrial'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'industrial', 'IND-09-002', 'Cuneta trapezoidal 3000 PSI',            'ml',  95000,  75000,  118000
FROM catalogo_capitulos WHERE codigo = 'IND-09' AND tipo_obra = 'industrial'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'industrial', 'IND-09-003', 'Cerramiento malla eslabonada h=2.50m',  'ml',  148000, 118000, 185000
FROM catalogo_capitulos WHERE codigo = 'IND-09' AND tipo_obra = 'industrial'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;

INSERT INTO catalogo_actividades (catalogo_capitulo_id, tipo_obra, codigo, nombre, unidad, precio_referencia_nacional, rango_min, rango_max)
SELECT id, 'industrial', 'IND-09-004', 'Tanque almacenamiento agua 5000L',      'und', 3800000, 3000000, 4800000
FROM catalogo_capitulos WHERE codigo = 'IND-09' AND tipo_obra = 'industrial'
ON CONFLICT (codigo, tipo_obra) DO NOTHING;
