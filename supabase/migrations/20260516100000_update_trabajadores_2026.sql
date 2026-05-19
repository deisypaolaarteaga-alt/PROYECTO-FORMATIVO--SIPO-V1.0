-- ============================================================
-- SIPO — Actualización jornales Colombia 2026
-- SMMLV 2026: $1.423.500/mes = $54.750/día
-- jornal_con_prestaciones es GENERATED ALWAYS AS
-- (jornal_base × factor_prestacional) — se recalcula sola.
-- Idempotente: UPDATE por especialidad es seguro de re-ejecutar.
-- ============================================================

-- Directores / Residentes
UPDATE trabajadores SET jornal_base = 250000 WHERE especialidad = 'Director de obra';
UPDATE trabajadores SET jornal_base = 200000 WHERE especialidad = 'Residente de obra';

-- Maestros
UPDATE trabajadores SET jornal_base = 180000 WHERE especialidad = 'Maestro general de obra';

-- Oficiales
UPDATE trabajadores SET jornal_base = 118000 WHERE especialidad = 'Oficial albañil';
UPDATE trabajadores SET jornal_base = 122000 WHERE especialidad = 'Oficial carpintero';
UPDATE trabajadores SET jornal_base = 130000 WHERE especialidad = 'Oficial electricista';
UPDATE trabajadores SET jornal_base = 125000 WHERE especialidad = 'Oficial plomero/fontanero';
UPDATE trabajadores SET jornal_base = 110000 WHERE especialidad = 'Oficial pintor';
UPDATE trabajadores SET jornal_base = 135000 WHERE especialidad = 'Oficial soldador';
UPDATE trabajadores SET jornal_base = 118000 WHERE especialidad = 'Oficial ceramiquero';
UPDATE trabajadores SET jornal_base = 115000 WHERE especialidad = 'Oficial estucador';
UPDATE trabajadores SET jornal_base = 120000 WHERE especialidad = 'Oficial enchapador';
UPDATE trabajadores SET jornal_base = 118000 WHERE especialidad = 'Oficial instalador drywall';
UPDATE trabajadores SET jornal_base = 122000 WHERE especialidad = 'Oficial impermeabilizador';

-- Especialistas
UPDATE trabajadores SET jornal_base = 150000 WHERE especialidad = 'Electricista matriculado';
UPDATE trabajadores SET jornal_base = 160000 WHERE especialidad = 'Técnico HVAC';
UPDATE trabajadores SET jornal_base = 185000 WHERE especialidad = 'Operador retroexcavadora';
UPDATE trabajadores SET jornal_base = 130000 WHERE especialidad = 'Operador compactador';
UPDATE trabajadores SET jornal_base = 155000 WHERE especialidad = 'Topógrafo';

-- Ayudantes — base SMMLV 2026 ($54.750/día)
UPDATE trabajadores SET jornal_base = 54750 WHERE especialidad = 'Ayudante construcción';
UPDATE trabajadores SET jornal_base = 54750 WHERE especialidad = 'Ayudante electricista';
UPDATE trabajadores SET jornal_base = 54750 WHERE especialidad = 'Ayudante plomero';
UPDATE trabajadores SET jornal_base = 54750 WHERE especialidad = 'Ayudante pintor';
UPDATE trabajadores SET jornal_base = 54750 WHERE especialidad = 'Ayudante soldador';
UPDATE trabajadores SET jornal_base = 54750 WHERE especialidad = 'Cotero/cargue descargue';
