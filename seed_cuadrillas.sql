-- ============================================
-- SIPO — Seed: Trabajadores y Cuadrillas del Sistema
-- Jornales de referencia Colombia 2025
-- Ejecutar DESPUÉS de cuadrillas_schema.sql
-- ============================================

-- ──────────────────────────────────────────
-- 1. TRABAJADORES BASE
-- ──────────────────────────────────────────
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
  ('Cotero/cargue descargue',        'ayudante',      52000, 5, 1.6249, 'Nacional');

-- ──────────────────────────────────────────
-- 2. CUADRILLAS DEL SISTEMA
-- ──────────────────────────────────────────
-- Usamos CTEs para referenciar trabajadores por nombre de forma segura

DO $$
DECLARE
  -- IDs de trabajadores
  id_oficial_albanil    UUID;
  id_oficial_carpintero UUID;
  id_oficial_electricista UUID;
  id_oficial_plomero    UUID;
  id_oficial_pintor     UUID;
  id_oficial_soldador   UUID;
  id_oficial_ceramiquero UUID;
  id_oficial_estucador  UUID;
  id_oficial_enchapador UUID;
  id_oficial_drywall    UUID;
  id_oficial_impermeabilizador UUID;
  id_esp_electricista   UUID;
  id_esp_retroexcavadora UUID;
  id_ayudante           UUID;
  id_ayudante_electricista UUID;
  id_ayudante_plomero   UUID;
  id_ayudante_pintor    UUID;
  id_ayudante_soldador  UUID;

  -- IDs de cuadrillas
  c_mam_bloque     UUID;
  c_mam_ladrillo   UUID;
  c_mam_bahareque  UUID;
  c_fundicion_placa UUID;
  c_vigas_columnas UUID;
  c_encofrado      UUID;
  c_panete         UUID;
  c_estuco_pintura UUID;
  c_piso_ceramica  UUID;
  c_enchape_muros  UUID;
  c_piso_concreto  UUID;
  c_cubierta_liviana UUID;
  c_cubierta_termica UUID;
  c_electrica_res  UUID;
  c_electrica_com  UUID;
  c_hidrosanit     UUID;
  c_excav_manual   UUID;
  c_excav_mecanica UUID;
  c_drywall        UUID;
  c_impermeabilizacion UUID;

BEGIN
  -- Obtener IDs de trabajadores
  SELECT id INTO id_oficial_albanil    FROM trabajadores WHERE especialidad = 'Oficial albañil' LIMIT 1;
  SELECT id INTO id_oficial_carpintero FROM trabajadores WHERE especialidad = 'Oficial carpintero' LIMIT 1;
  SELECT id INTO id_oficial_electricista FROM trabajadores WHERE especialidad = 'Oficial electricista' LIMIT 1;
  SELECT id INTO id_oficial_plomero    FROM trabajadores WHERE especialidad = 'Oficial plomero/fontanero' LIMIT 1;
  SELECT id INTO id_oficial_pintor     FROM trabajadores WHERE especialidad = 'Oficial pintor' LIMIT 1;
  SELECT id INTO id_oficial_soldador   FROM trabajadores WHERE especialidad = 'Oficial soldador' LIMIT 1;
  SELECT id INTO id_oficial_ceramiquero FROM trabajadores WHERE especialidad = 'Oficial ceramiquero' LIMIT 1;
  SELECT id INTO id_oficial_estucador  FROM trabajadores WHERE especialidad = 'Oficial estucador' LIMIT 1;
  SELECT id INTO id_oficial_enchapador FROM trabajadores WHERE especialidad = 'Oficial enchapador' LIMIT 1;
  SELECT id INTO id_oficial_drywall    FROM trabajadores WHERE especialidad = 'Oficial instalador drywall' LIMIT 1;
  SELECT id INTO id_oficial_impermeabilizador FROM trabajadores WHERE especialidad = 'Oficial impermeabilizador' LIMIT 1;
  SELECT id INTO id_esp_electricista   FROM trabajadores WHERE especialidad = 'Electricista matriculado' LIMIT 1;
  SELECT id INTO id_esp_retroexcavadora FROM trabajadores WHERE especialidad = 'Operador retroexcavadora' LIMIT 1;
  SELECT id INTO id_ayudante           FROM trabajadores WHERE especialidad = 'Ayudante construcción' LIMIT 1;
  SELECT id INTO id_ayudante_electricista FROM trabajadores WHERE especialidad = 'Ayudante electricista' LIMIT 1;
  SELECT id INTO id_ayudante_plomero   FROM trabajadores WHERE especialidad = 'Ayudante plomero' LIMIT 1;
  SELECT id INTO id_ayudante_pintor    FROM trabajadores WHERE especialidad = 'Ayudante pintor' LIMIT 1;
  SELECT id INTO id_ayudante_soldador  FROM trabajadores WHERE especialidad = 'Ayudante soldador' LIMIT 1;

  -- ── Mampostería bloque ──
  INSERT INTO cuadrillas (nombre, descripcion, categoria_actividad, es_sistema)
  VALUES ('Cuadrilla mampostería bloque', 'Muros en bloque de concreto #4, #5, #6', 'Mampostería', true)
  RETURNING id INTO c_mam_bloque;

  INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad) VALUES
    (c_mam_bloque, id_oficial_albanil, 1),
    (c_mam_bloque, id_ayudante, 1);

  INSERT INTO rendimientos (cuadrilla_id, actividad_tipo, unidad, rendimiento_minimo, rendimiento_normal, rendimiento_optimo, condiciones) VALUES
    (c_mam_bloque, 'Mampostería bloque concreto', 'm²', 6, 8, 12, 'Jornada 8h, mezcla mecánica, acceso fácil');

  -- ── Mampostería ladrillo ──
  INSERT INTO cuadrillas (nombre, descripcion, categoria_actividad, es_sistema)
  VALUES ('Cuadrilla mampostería ladrillo', 'Muros en ladrillo tolete, farol o estructural', 'Mampostería', true)
  RETURNING id INTO c_mam_ladrillo;

  INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad) VALUES
    (c_mam_ladrillo, id_oficial_albanil, 1),
    (c_mam_ladrillo, id_ayudante, 1);

  INSERT INTO rendimientos (cuadrilla_id, actividad_tipo, unidad, rendimiento_minimo, rendimiento_normal, rendimiento_optimo, condiciones) VALUES
    (c_mam_ladrillo, 'Mampostería ladrillo', 'm²', 5, 7, 10, 'Jornada 8h, mortero 1:4');

  -- ── Mampostería bahareque ──
  INSERT INTO cuadrillas (nombre, descripcion, categoria_actividad, es_sistema)
  VALUES ('Cuadrilla mampostería bahareque', 'Mampostería en bahareque o tapia pisada', 'Mampostería', true)
  RETURNING id INTO c_mam_bahareque;

  INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad) VALUES
    (c_mam_bahareque, id_oficial_albanil, 1),
    (c_mam_bahareque, id_ayudante, 2);

  INSERT INTO rendimientos (cuadrilla_id, actividad_tipo, unidad, rendimiento_minimo, rendimiento_normal, rendimiento_optimo, condiciones) VALUES
    (c_mam_bahareque, 'Mampostería bahareque', 'm²', 4, 6, 9, 'Incluye preparación de mezcla de barro');

  -- ── Fundición placas ──
  INSERT INTO cuadrillas (nombre, descripcion, categoria_actividad, es_sistema)
  VALUES ('Cuadrilla fundición placas', 'Fundición de placas entrepiso y cubierta con mezcladora', 'Concretos', true)
  RETURNING id INTO c_fundicion_placa;

  INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad) VALUES
    (c_fundicion_placa, id_oficial_albanil, 1),
    (c_fundicion_placa, id_ayudante, 3);

  INSERT INTO rendimientos (cuadrilla_id, actividad_tipo, unidad, rendimiento_minimo, rendimiento_normal, rendimiento_optimo, condiciones) VALUES
    (c_fundicion_placa, 'Fundición placa de concreto', 'm²', 12, 16, 20, 'Con mezcladora, acceso con carretilla');

  -- ── Vigas y columnas ──
  INSERT INTO cuadrillas (nombre, descripcion, categoria_actividad, es_sistema)
  VALUES ('Cuadrilla vigas y columnas', 'Fundición de elementos verticales y horizontales', 'Concretos', true)
  RETURNING id INTO c_vigas_columnas;

  INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad) VALUES
    (c_vigas_columnas, id_oficial_albanil, 1),
    (c_vigas_columnas, id_ayudante, 2);

  INSERT INTO rendimientos (cuadrilla_id, actividad_tipo, unidad, rendimiento_minimo, rendimiento_normal, rendimiento_optimo, condiciones) VALUES
    (c_vigas_columnas, 'Fundición vigas y columnas', 'm³', 0.8, 1.2, 1.8, 'Incluye formaleta, vibrado y curado');

  -- ── Encofrado madera ──
  INSERT INTO cuadrillas (nombre, descripcion, categoria_actividad, es_sistema)
  VALUES ('Cuadrilla encofrado madera', 'Formaleteo en madera para estructuras', 'Encofrados', true)
  RETURNING id INTO c_encofrado;

  INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad) VALUES
    (c_encofrado, id_oficial_carpintero, 1),
    (c_encofrado, id_ayudante, 1);

  INSERT INTO rendimientos (cuadrilla_id, actividad_tipo, unidad, rendimiento_minimo, rendimiento_normal, rendimiento_optimo, condiciones) VALUES
    (c_encofrado, 'Encofrado en madera', 'm²', 8, 10, 14, 'Incluye instalación y desencofrado');

  -- ── Pañete muros ──
  INSERT INTO cuadrillas (nombre, descripcion, categoria_actividad, es_sistema)
  VALUES ('Cuadrilla pañete muros', 'Pañete liso o rayado en muros interiores y exteriores', 'Pañetes', true)
  RETURNING id INTO c_panete;

  INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad) VALUES
    (c_panete, id_oficial_albanil, 1),
    (c_panete, id_ayudante, 1);

  INSERT INTO rendimientos (cuadrilla_id, actividad_tipo, unidad, rendimiento_minimo, rendimiento_normal, rendimiento_optimo, condiciones) VALUES
    (c_panete, 'Pañete de muros', 'm²', 8, 12, 16, 'Mortero 1:5, espesor 1.5cm');

  -- ── Estuco y pintura ──
  INSERT INTO cuadrillas (nombre, descripcion, categoria_actividad, es_sistema)
  VALUES ('Cuadrilla estuco y pintura', 'Estuco yeso y pintura vinilo en interiores', 'Acabados', true)
  RETURNING id INTO c_estuco_pintura;

  INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad) VALUES
    (c_estuco_pintura, id_oficial_estucador, 1),
    (c_estuco_pintura, id_ayudante_pintor, 1);

  INSERT INTO rendimientos (cuadrilla_id, actividad_tipo, unidad, rendimiento_minimo, rendimiento_normal, rendimiento_optimo, condiciones) VALUES
    (c_estuco_pintura, 'Estuco yeso muros y cielos', 'm²', 20, 30, 40, 'Superficie pañetada lista'),
    (c_estuco_pintura, 'Pintura vinilo 2 manos', 'm²', 25, 35, 45, 'Sobre estuco seco, incluye sellador');

  -- ── Piso cerámica ──
  INSERT INTO cuadrillas (nombre, descripcion, categoria_actividad, es_sistema)
  VALUES ('Cuadrilla piso cerámica/porcelanato', 'Instalación pisos cerámicos hasta 60x60', 'Pisos', true)
  RETURNING id INTO c_piso_ceramica;

  INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad) VALUES
    (c_piso_ceramica, id_oficial_ceramiquero, 1),
    (c_piso_ceramica, id_ayudante, 1);

  INSERT INTO rendimientos (cuadrilla_id, actividad_tipo, unidad, rendimiento_minimo, rendimiento_normal, rendimiento_optimo, condiciones) VALUES
    (c_piso_ceramica, 'Piso cerámica o porcelanato', 'm²', 6, 8, 12, 'Incluye fragüe, piezas hasta 60x60');

  -- ── Enchape muros ──
  INSERT INTO cuadrillas (nombre, descripcion, categoria_actividad, es_sistema)
  VALUES ('Cuadrilla enchape muros', 'Enchape cerámico en muros baños y cocinas', 'Pisos', true)
  RETURNING id INTO c_enchape_muros;

  INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad) VALUES
    (c_enchape_muros, id_oficial_enchapador, 1),
    (c_enchape_muros, id_ayudante, 1);

  INSERT INTO rendimientos (cuadrilla_id, actividad_tipo, unidad, rendimiento_minimo, rendimiento_normal, rendimiento_optimo, condiciones) VALUES
    (c_enchape_muros, 'Enchape cerámico en muros', 'm²', 5, 7, 10, 'Incluye fragüe, filete y cortes');

  -- ── Piso concreto ──
  INSERT INTO cuadrillas (nombre, descripcion, categoria_actividad, es_sistema)
  VALUES ('Cuadrilla piso concreto', 'Afirmado y placa de contrapiso en concreto simple', 'Pisos', true)
  RETURNING id INTO c_piso_concreto;

  INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad) VALUES
    (c_piso_concreto, id_oficial_albanil, 1),
    (c_piso_concreto, id_ayudante, 2);

  INSERT INTO rendimientos (cuadrilla_id, actividad_tipo, unidad, rendimiento_minimo, rendimiento_normal, rendimiento_optimo, condiciones) VALUES
    (c_piso_concreto, 'Placa de contrapiso concreto simple', 'm²', 10, 14, 20, 'Espesor 0.10m, incluye curado');

  -- ── Cubierta liviana ──
  INSERT INTO cuadrillas (nombre, descripcion, categoria_actividad, es_sistema)
  VALUES ('Cuadrilla cubierta teja zinc/fibrocemento', 'Instalación cubierta liviana sobre estructura metálica', 'Cubiertas', true)
  RETURNING id INTO c_cubierta_liviana;

  INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad) VALUES
    (c_cubierta_liviana, id_oficial_albanil, 1),
    (c_cubierta_liviana, id_ayudante, 1);

  INSERT INTO rendimientos (cuadrilla_id, actividad_tipo, unidad, rendimiento_minimo, rendimiento_normal, rendimiento_optimo, condiciones) VALUES
    (c_cubierta_liviana, 'Cubierta teja zinc o fibrocemento', 'm²', 15, 20, 30, 'Pendiente < 30%, incluye traslapos');

  -- ── Cubierta térmica ──
  INSERT INTO cuadrillas (nombre, descripcion, categoria_actividad, es_sistema)
  VALUES ('Cuadrilla cubierta teja térmica', 'Instalación teja termoacústica tipo Isofit o similar', 'Cubiertas', true)
  RETURNING id INTO c_cubierta_termica;

  INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad) VALUES
    (c_cubierta_termica, id_oficial_soldador, 1),
    (c_cubierta_termica, id_ayudante_soldador, 1);

  INSERT INTO rendimientos (cuadrilla_id, actividad_tipo, unidad, rendimiento_minimo, rendimiento_normal, rendimiento_optimo, condiciones) VALUES
    (c_cubierta_termica, 'Cubierta teja termoacústica', 'm²', 12, 18, 25, 'Incluye estructura de apoyo en ángulo');

  -- ── Eléctrica residencial ──
  INSERT INTO cuadrillas (nombre, descripcion, categoria_actividad, es_sistema)
  VALUES ('Cuadrilla eléctrica residencial', 'Instalaciones eléctricas residenciales en tubería conduit', 'Instalaciones eléctricas', true)
  RETURNING id INTO c_electrica_res;

  INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad) VALUES
    (c_electrica_res, id_oficial_electricista, 1),
    (c_electrica_res, id_ayudante_electricista, 1);

  INSERT INTO rendimientos (cuadrilla_id, actividad_tipo, unidad, rendimiento_minimo, rendimiento_normal, rendimiento_optimo, condiciones) VALUES
    (c_electrica_res, 'Punto eléctrico residencial', 'pto', 5, 7, 10, 'Tubería conduit, salidas tomacorrientes o iluminación');

  -- ── Eléctrica comercial ──
  INSERT INTO cuadrillas (nombre, descripcion, categoria_actividad, es_sistema)
  VALUES ('Cuadrilla eléctrica comercial/industrial', 'Con electricista matriculado para instalaciones especiales', 'Instalaciones eléctricas', true)
  RETURNING id INTO c_electrica_com;

  INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad) VALUES
    (c_electrica_com, id_esp_electricista, 1),
    (c_electrica_com, id_oficial_electricista, 1),
    (c_electrica_com, id_ayudante_electricista, 1);

  INSERT INTO rendimientos (cuadrilla_id, actividad_tipo, unidad, rendimiento_minimo, rendimiento_normal, rendimiento_optimo, condiciones) VALUES
    (c_electrica_com, 'Punto eléctrico comercial', 'pto', 4, 6, 9, 'Bandeja metálica o conduit rígido, retie vigente');

  -- ── Hidrosanitaria ──
  INSERT INTO cuadrillas (nombre, descripcion, categoria_actividad, es_sistema)
  VALUES ('Cuadrilla hidráulica y sanitaria', 'Instalación tubería PVC agua fría, caliente y sanitaria', 'Instalaciones hidrosanitarias', true)
  RETURNING id INTO c_hidrosanit;

  INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad) VALUES
    (c_hidrosanit, id_oficial_plomero, 1),
    (c_hidrosanit, id_ayudante_plomero, 1);

  INSERT INTO rendimientos (cuadrilla_id, actividad_tipo, unidad, rendimiento_minimo, rendimiento_normal, rendimiento_optimo, condiciones) VALUES
    (c_hidrosanit, 'Punto hidráulico o sanitario', 'pto', 4, 6, 8, 'PVC presión o PVC sanitario, incluye accesorios');

  -- ── Excavación manual ──
  INSERT INTO cuadrillas (nombre, descripcion, categoria_actividad, es_sistema)
  VALUES ('Cuadrilla excavación manual', 'Excavación de zanjas y apiques a mano', 'Movimiento de tierras', true)
  RETURNING id INTO c_excav_manual;

  INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad) VALUES
    (c_excav_manual, id_ayudante, 2);

  INSERT INTO rendimientos (cuadrilla_id, actividad_tipo, unidad, rendimiento_minimo, rendimiento_normal, rendimiento_optimo, condiciones) VALUES
    (c_excav_manual, 'Excavación manual zanjas y apiques', 'm³', 2, 3, 4, 'Suelo blando a semiduro, sin roca');

  -- ── Excavación mecánica ──
  INSERT INTO cuadrillas (nombre, descripcion, categoria_actividad, es_sistema)
  VALUES ('Cuadrilla excavación mecánica', 'Con retroexcavadora más cuadrilla de apoyo', 'Movimiento de tierras', true)
  RETURNING id INTO c_excav_mecanica;

  INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad) VALUES
    (c_excav_mecanica, id_esp_retroexcavadora, 1),
    (c_excav_mecanica, id_ayudante, 2);

  INSERT INTO rendimientos (cuadrilla_id, actividad_tipo, unidad, rendimiento_minimo, rendimiento_normal, rendimiento_optimo, condiciones) VALUES
    (c_excav_mecanica, 'Excavación mecánica con retro', 'm³', 40, 60, 80, 'Retroexcavadora 0.6m³, suelo normal');

  -- ── Drywall ──
  INSERT INTO cuadrillas (nombre, descripcion, categoria_actividad, es_sistema)
  VALUES ('Cuadrilla drywall', 'Instalación tabiques y cielos en drywall', 'Drywall', true)
  RETURNING id INTO c_drywall;

  INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad) VALUES
    (c_drywall, id_oficial_drywall, 1),
    (c_drywall, id_ayudante, 1);

  INSERT INTO rendimientos (cuadrilla_id, actividad_tipo, unidad, rendimiento_minimo, rendimiento_normal, rendimiento_optimo, condiciones) VALUES
    (c_drywall, 'Tabique drywall sencillo', 'm²', 8, 12, 18, 'Perfil 89mm, 2 caras, incluye estructura'),
    (c_drywall, 'Cielo falso drywall', 'm²', 6, 10, 14, 'Perfil calibre 26, placa estándar 1/2"');

  -- ── Impermeabilización ──
  INSERT INTO cuadrillas (nombre, descripcion, categoria_actividad, es_sistema)
  VALUES ('Cuadrilla impermeabilización', 'Impermeabilización con membrana asfáltica o acrílica', 'Impermeabilizaciones', true)
  RETURNING id INTO c_impermeabilizacion;

  INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad) VALUES
    (c_impermeabilizacion, id_oficial_impermeabilizador, 1),
    (c_impermeabilizacion, id_ayudante, 1);

  INSERT INTO rendimientos (cuadrilla_id, actividad_tipo, unidad, rendimiento_minimo, rendimiento_normal, rendimiento_optimo, condiciones) VALUES
    (c_impermeabilizacion, 'Impermeabilización membrana asfáltica', 'm²', 12, 18, 25, 'Membrana preformada 4mm, llama viva'),
    (c_impermeabilizacion, 'Impermeabilización acrílica', 'm²', 20, 28, 38, '3 capas, incluye malla de refuerzo en filos');

END $$;
