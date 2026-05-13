-- ============================================================
-- SIPO — Seed trabajadores referencia Colombia 2025
-- Agrega índice único en especialidad para idempotencia.
-- ON CONFLICT (especialidad) DO NOTHING: seguro de re-ejecutar.
-- ============================================================

-- Índice único en especialidad (hace posible ON CONFLICT)
CREATE UNIQUE INDEX IF NOT EXISTS idx_trabajadores_especialidad
  ON trabajadores (especialidad);

-- Limpia duplicados anteriores si el seed se corrió sin índice
-- (conserva el registro más antiguo por especialidad)
DELETE FROM trabajadores
WHERE id NOT IN (
  SELECT DISTINCT ON (especialidad) id
  FROM trabajadores
  ORDER BY especialidad, created_at ASC
);

-- Trabajadores de referencia — jornales Colombia 2025
INSERT INTO trabajadores (especialidad, categoria, jornal_base, nivel_riesgo, factor_prestacional, ciudad_referencia) VALUES
  -- Dirección
  ('Director de obra',               'director',    250000, 3, 1.5521, 'Nacional'),
  ('Residente de obra',              'residente',   180000, 3, 1.5521, 'Nacional'),
  ('Maestro general de obra',        'maestro',     110000, 4, 1.5988, 'Nacional'),
  -- Oficiales
  ('Oficial albañil',                'oficial',      78000, 4, 1.5988, 'Nacional'),
  ('Oficial carpintero',             'oficial',      80000, 4, 1.5988, 'Nacional'),
  ('Oficial electricista',           'oficial',      85000, 3, 1.5521, 'Nacional'),
  ('Oficial plomero/fontanero',      'oficial',      82000, 3, 1.5521, 'Nacional'),
  ('Oficial pintor',                 'oficial',      75000, 2, 1.5253, 'Nacional'),
  ('Oficial soldador',               'oficial',      90000, 4, 1.5988, 'Nacional'),
  ('Oficial ceramiquero',            'oficial',      78000, 3, 1.5521, 'Nacional'),
  ('Oficial estucador',              'oficial',      76000, 3, 1.5521, 'Nacional'),
  ('Oficial enchapador',             'oficial',      80000, 3, 1.5521, 'Nacional'),
  ('Oficial instalador drywall',     'oficial',      78000, 3, 1.5521, 'Nacional'),
  ('Oficial impermeabilizador',      'oficial',      80000, 4, 1.5988, 'Nacional'),
  -- Especialistas
  ('Electricista matriculado',       'especialista', 120000, 3, 1.5521, 'Nacional'),
  ('Técnico HVAC',                   'especialista', 130000, 3, 1.5521, 'Nacional'),
  ('Operador retroexcavadora',       'especialista', 150000, 5, 1.6249, 'Nacional'),
  ('Operador compactador',           'especialista', 100000, 5, 1.6249, 'Nacional'),
  ('Topógrafo',                      'especialista', 140000, 2, 1.5253, 'Nacional'),
  -- Ayudantes
  ('Ayudante construcción',          'ayudante',      55000, 4, 1.5988, 'Nacional'),
  ('Ayudante electricista',          'ayudante',      52000, 3, 1.5521, 'Nacional'),
  ('Ayudante plomero',               'ayudante',      52000, 3, 1.5521, 'Nacional'),
  ('Ayudante pintor',                'ayudante',      50000, 2, 1.5253, 'Nacional'),
  ('Ayudante soldador',              'ayudante',      52000, 4, 1.5988, 'Nacional'),
  ('Cotero/cargue descargue',        'ayudante',      52000, 5, 1.6249, 'Nacional')
ON CONFLICT (especialidad) DO NOTHING;
