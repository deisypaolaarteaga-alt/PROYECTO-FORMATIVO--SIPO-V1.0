-- ============================================================
-- SIPO: Seed cuadrillas base de sistema — Colombia 2026
-- Fuente de rendimientos: INVIAS/IDU 2025
-- Idempotente: usa SELECT INTO + WHERE NOT EXISTS, sin UUIDs hardcodeados
-- ============================================================

DO $$
DECLARE
  -- Trabajadores (lookup por especialidad exacta, sin hardcodear UUIDs)
  v_albanil          UUID;
  v_estucador        UUID;
  v_plomero          UUID;
  v_electricista     UUID;
  v_pintor           UUID;
  v_soldador         UUID;
  v_enchapador       UUID;
  v_topografo        UUID;
  v_ay_construccion  UUID;
  v_ay_plomero       UUID;
  v_ay_electricista  UUID;
  v_ay_pintor        UUID;
  v_ay_soldador      UUID;

  v_cuadrilla_id UUID;

BEGIN

  -- ── Buscar trabajadores por especialidad ────────────────────────────────────
  SELECT id INTO v_albanil         FROM trabajadores WHERE especialidad ILIKE '%albanil%'         AND activo = true LIMIT 1;
  SELECT id INTO v_estucador       FROM trabajadores WHERE especialidad ILIKE '%estucador%'       AND activo = true LIMIT 1;
  SELECT id INTO v_plomero         FROM trabajadores WHERE especialidad ILIKE '%plomero%'         AND activo = true LIMIT 1;
  SELECT id INTO v_electricista    FROM trabajadores WHERE especialidad ILIKE '%electricista%'    AND categoria = 'oficial' AND activo = true LIMIT 1;
  SELECT id INTO v_pintor          FROM trabajadores WHERE especialidad ILIKE '%pintor%'          AND categoria = 'oficial' AND activo = true LIMIT 1;
  SELECT id INTO v_soldador        FROM trabajadores WHERE especialidad ILIKE '%soldador%'        AND categoria = 'oficial' AND activo = true LIMIT 1;
  SELECT id INTO v_enchapador      FROM trabajadores WHERE especialidad ILIKE '%enchapador%'      AND activo = true LIMIT 1;
  SELECT id INTO v_topografo       FROM trabajadores WHERE especialidad ILIKE '%topografo%'       AND activo = true LIMIT 1;
  SELECT id INTO v_ay_construccion FROM trabajadores WHERE especialidad ILIKE '%ayudante%construccion%' AND activo = true LIMIT 1;
  SELECT id INTO v_ay_plomero      FROM trabajadores WHERE especialidad ILIKE '%ayudante%plomero%'      AND activo = true LIMIT 1;
  SELECT id INTO v_ay_electricista FROM trabajadores WHERE especialidad ILIKE '%ayudante%electricista%' AND activo = true LIMIT 1;
  SELECT id INTO v_ay_pintor       FROM trabajadores WHERE especialidad ILIKE '%ayudante%pintor%'       AND activo = true LIMIT 1;
  SELECT id INTO v_ay_soldador     FROM trabajadores WHERE especialidad ILIKE '%ayudante%soldador%'     AND activo = true LIMIT 1;

  -- Avisar trabajadores no encontrados
  IF v_albanil         IS NULL THEN RAISE NOTICE 'SKIP: No se encontró Oficial albanil'; END IF;
  IF v_estucador       IS NULL THEN RAISE NOTICE 'SKIP: No se encontró Oficial estucador'; END IF;
  IF v_plomero         IS NULL THEN RAISE NOTICE 'SKIP: No se encontró Oficial plomero'; END IF;
  IF v_electricista    IS NULL THEN RAISE NOTICE 'SKIP: No se encontró Oficial electricista'; END IF;
  IF v_pintor          IS NULL THEN RAISE NOTICE 'SKIP: No se encontró Oficial pintor'; END IF;
  IF v_soldador        IS NULL THEN RAISE NOTICE 'SKIP: No se encontró Oficial soldador'; END IF;
  IF v_enchapador      IS NULL THEN RAISE NOTICE 'SKIP: No se encontró Oficial enchapador'; END IF;
  IF v_topografo       IS NULL THEN RAISE NOTICE 'SKIP: No se encontró Topógrafo'; END IF;
  IF v_ay_construccion IS NULL THEN RAISE NOTICE 'SKIP: No se encontró Ayudante construcción'; END IF;
  IF v_ay_plomero      IS NULL THEN RAISE NOTICE 'SKIP: No se encontró Ayudante plomero'; END IF;
  IF v_ay_electricista IS NULL THEN RAISE NOTICE 'SKIP: No se encontró Ayudante electricista'; END IF;
  IF v_ay_pintor       IS NULL THEN RAISE NOTICE 'SKIP: No se encontró Ayudante pintor'; END IF;
  IF v_ay_soldador     IS NULL THEN RAISE NOTICE 'SKIP: No se encontró Ayudante soldador'; END IF;


  -- ════════════════════════════════════════════════════════════
  -- 1. MAMPOSTERÍA
  --    1 oficial albanil + 2 ayudantes | Rend: 8 m²/día
  -- ════════════════════════════════════════════════════════════
  SELECT id INTO v_cuadrilla_id FROM cuadrillas
  WHERE nombre = 'Cuadrilla Mampostería' AND es_sistema = true LIMIT 1;

  IF v_cuadrilla_id IS NULL THEN
    INSERT INTO cuadrillas (nombre, descripcion, categoria_actividad, es_sistema, activa, user_id)
    VALUES (
      'Cuadrilla Mampostería',
      'Mampostería estructural y no estructural — ladrillo, bloque concreto',
      'Mampostería', true, true, NULL
    ) RETURNING id INTO v_cuadrilla_id;
  END IF;

  IF v_albanil IS NOT NULL THEN
    INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad)
    SELECT v_cuadrilla_id, v_albanil, 1
    WHERE NOT EXISTS (
      SELECT 1 FROM cuadrilla_trabajadores
      WHERE cuadrilla_id = v_cuadrilla_id AND trabajador_id = v_albanil
    );
  END IF;

  IF v_ay_construccion IS NOT NULL THEN
    INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad)
    SELECT v_cuadrilla_id, v_ay_construccion, 2
    WHERE NOT EXISTS (
      SELECT 1 FROM cuadrilla_trabajadores
      WHERE cuadrilla_id = v_cuadrilla_id AND trabajador_id = v_ay_construccion
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM rendimientos WHERE cuadrilla_id = v_cuadrilla_id) THEN
    INSERT INTO rendimientos (cuadrilla_id, actividad_tipo, unidad, rendimiento_normal, rendimiento_minimo, rendimiento_optimo, fuente)
    VALUES (v_cuadrilla_id, 'Mampostería', 'm²', 8, 5, 12, 'INVIAS/IDU Colombia 2025');
  END IF;


  -- ════════════════════════════════════════════════════════════
  -- 2. CONCRETO / VACIADO
  --    1 oficial + 3 ayudantes | Rend: 6 m³/día
  -- ════════════════════════════════════════════════════════════
  SELECT id INTO v_cuadrilla_id FROM cuadrillas
  WHERE nombre = 'Cuadrilla Concreto / Vaciado' AND es_sistema = true LIMIT 1;

  IF v_cuadrilla_id IS NULL THEN
    INSERT INTO cuadrillas (nombre, descripcion, categoria_actividad, es_sistema, activa, user_id)
    VALUES (
      'Cuadrilla Concreto / Vaciado',
      'Vaciado de concreto — vigas, columnas, losas, zapatas',
      'Concreto', true, true, NULL
    ) RETURNING id INTO v_cuadrilla_id;
  END IF;

  IF v_albanil IS NOT NULL THEN
    INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad)
    SELECT v_cuadrilla_id, v_albanil, 1
    WHERE NOT EXISTS (
      SELECT 1 FROM cuadrilla_trabajadores
      WHERE cuadrilla_id = v_cuadrilla_id AND trabajador_id = v_albanil
    );
  END IF;

  IF v_ay_construccion IS NOT NULL THEN
    INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad)
    SELECT v_cuadrilla_id, v_ay_construccion, 3
    WHERE NOT EXISTS (
      SELECT 1 FROM cuadrilla_trabajadores
      WHERE cuadrilla_id = v_cuadrilla_id AND trabajador_id = v_ay_construccion
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM rendimientos WHERE cuadrilla_id = v_cuadrilla_id) THEN
    INSERT INTO rendimientos (cuadrilla_id, actividad_tipo, unidad, rendimiento_normal, rendimiento_minimo, rendimiento_optimo, fuente)
    VALUES (v_cuadrilla_id, 'Concreto / Vaciado', 'm³', 6, 3, 9, 'INVIAS/IDU Colombia 2025');
  END IF;


  -- ════════════════════════════════════════════════════════════
  -- 3. PAÑETE Y REVOQUE
  --    1 oficial estucador + 1 ayudante | Rend: 12 m²/día
  -- ════════════════════════════════════════════════════════════
  SELECT id INTO v_cuadrilla_id FROM cuadrillas
  WHERE nombre = 'Cuadrilla Pañete y Revoque' AND es_sistema = true LIMIT 1;

  IF v_cuadrilla_id IS NULL THEN
    INSERT INTO cuadrillas (nombre, descripcion, categoria_actividad, es_sistema, activa, user_id)
    VALUES (
      'Cuadrilla Pañete y Revoque',
      'Pañete y revoque de muros interiores y exteriores',
      'Pañete y Revoque', true, true, NULL
    ) RETURNING id INTO v_cuadrilla_id;
  END IF;

  IF v_estucador IS NOT NULL THEN
    INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad)
    SELECT v_cuadrilla_id, v_estucador, 1
    WHERE NOT EXISTS (
      SELECT 1 FROM cuadrilla_trabajadores
      WHERE cuadrilla_id = v_cuadrilla_id AND trabajador_id = v_estucador
    );
  END IF;

  IF v_ay_construccion IS NOT NULL THEN
    INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad)
    SELECT v_cuadrilla_id, v_ay_construccion, 1
    WHERE NOT EXISTS (
      SELECT 1 FROM cuadrilla_trabajadores
      WHERE cuadrilla_id = v_cuadrilla_id AND trabajador_id = v_ay_construccion
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM rendimientos WHERE cuadrilla_id = v_cuadrilla_id) THEN
    INSERT INTO rendimientos (cuadrilla_id, actividad_tipo, unidad, rendimiento_normal, rendimiento_minimo, rendimiento_optimo, fuente)
    VALUES (v_cuadrilla_id, 'Pañete y Revoque', 'm²', 12, 8, 18, 'INVIAS/IDU Colombia 2025');
  END IF;


  -- ════════════════════════════════════════════════════════════
  -- 4. INSTALACIONES HIDROSANITARIAS
  --    1 oficial plomero + 1 ayudante | Rend: 4 pto/día
  -- ════════════════════════════════════════════════════════════
  SELECT id INTO v_cuadrilla_id FROM cuadrillas
  WHERE nombre = 'Cuadrilla Hidrosanitaria' AND es_sistema = true LIMIT 1;

  IF v_cuadrilla_id IS NULL THEN
    INSERT INTO cuadrillas (nombre, descripcion, categoria_actividad, es_sistema, activa, user_id)
    VALUES (
      'Cuadrilla Hidrosanitaria',
      'Instalaciones hidráulicas y sanitarias — tuberías, accesorios, aparatos',
      'Instalaciones Hidrosanitarias', true, true, NULL
    ) RETURNING id INTO v_cuadrilla_id;
  END IF;

  IF v_plomero IS NOT NULL THEN
    INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad)
    SELECT v_cuadrilla_id, v_plomero, 1
    WHERE NOT EXISTS (
      SELECT 1 FROM cuadrilla_trabajadores
      WHERE cuadrilla_id = v_cuadrilla_id AND trabajador_id = v_plomero
    );
  END IF;

  IF v_ay_plomero IS NOT NULL THEN
    INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad)
    SELECT v_cuadrilla_id, v_ay_plomero, 1
    WHERE NOT EXISTS (
      SELECT 1 FROM cuadrilla_trabajadores
      WHERE cuadrilla_id = v_cuadrilla_id AND trabajador_id = v_ay_plomero
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM rendimientos WHERE cuadrilla_id = v_cuadrilla_id) THEN
    INSERT INTO rendimientos (cuadrilla_id, actividad_tipo, unidad, rendimiento_normal, rendimiento_minimo, rendimiento_optimo, fuente)
    VALUES (v_cuadrilla_id, 'Instalaciones Hidrosanitarias', 'pto', 4, 2, 6, 'INVIAS/IDU Colombia 2025');
  END IF;


  -- ════════════════════════════════════════════════════════════
  -- 5. INSTALACIONES ELÉCTRICAS
  --    1 oficial electricista + 1 ayudante | Rend: 5 pto/día
  -- ════════════════════════════════════════════════════════════
  SELECT id INTO v_cuadrilla_id FROM cuadrillas
  WHERE nombre = 'Cuadrilla Eléctrica' AND es_sistema = true LIMIT 1;

  IF v_cuadrilla_id IS NULL THEN
    INSERT INTO cuadrillas (nombre, descripcion, categoria_actividad, es_sistema, activa, user_id)
    VALUES (
      'Cuadrilla Eléctrica',
      'Instalaciones eléctricas — canalización, acometidas, tomacorrientes, puntos de iluminación',
      'Instalaciones Eléctricas', true, true, NULL
    ) RETURNING id INTO v_cuadrilla_id;
  END IF;

  IF v_electricista IS NOT NULL THEN
    INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad)
    SELECT v_cuadrilla_id, v_electricista, 1
    WHERE NOT EXISTS (
      SELECT 1 FROM cuadrilla_trabajadores
      WHERE cuadrilla_id = v_cuadrilla_id AND trabajador_id = v_electricista
    );
  END IF;

  IF v_ay_electricista IS NOT NULL THEN
    INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad)
    SELECT v_cuadrilla_id, v_ay_electricista, 1
    WHERE NOT EXISTS (
      SELECT 1 FROM cuadrilla_trabajadores
      WHERE cuadrilla_id = v_cuadrilla_id AND trabajador_id = v_ay_electricista
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM rendimientos WHERE cuadrilla_id = v_cuadrilla_id) THEN
    INSERT INTO rendimientos (cuadrilla_id, actividad_tipo, unidad, rendimiento_normal, rendimiento_minimo, rendimiento_optimo, fuente)
    VALUES (v_cuadrilla_id, 'Instalaciones Eléctricas', 'pto', 5, 3, 8, 'INVIAS/IDU Colombia 2025');
  END IF;


  -- ════════════════════════════════════════════════════════════
  -- 6. EXCAVACIÓN MANUAL
  --    1 oficial + 2 ayudantes | Rend: 4 m³/día
  -- ════════════════════════════════════════════════════════════
  SELECT id INTO v_cuadrilla_id FROM cuadrillas
  WHERE nombre = 'Cuadrilla Excavación Manual' AND es_sistema = true LIMIT 1;

  IF v_cuadrilla_id IS NULL THEN
    INSERT INTO cuadrillas (nombre, descripcion, categoria_actividad, es_sistema, activa, user_id)
    VALUES (
      'Cuadrilla Excavación Manual',
      'Excavación manual para cimentaciones, zanjas y apiques',
      'Excavación', true, true, NULL
    ) RETURNING id INTO v_cuadrilla_id;
  END IF;

  -- Usa albanil como oficial de excavación (no existe especialista específico en el catálogo)
  IF v_albanil IS NOT NULL THEN
    INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad)
    SELECT v_cuadrilla_id, v_albanil, 1
    WHERE NOT EXISTS (
      SELECT 1 FROM cuadrilla_trabajadores
      WHERE cuadrilla_id = v_cuadrilla_id AND trabajador_id = v_albanil
    );
  END IF;

  IF v_ay_construccion IS NOT NULL THEN
    INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad)
    SELECT v_cuadrilla_id, v_ay_construccion, 2
    WHERE NOT EXISTS (
      SELECT 1 FROM cuadrilla_trabajadores
      WHERE cuadrilla_id = v_cuadrilla_id AND trabajador_id = v_ay_construccion
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM rendimientos WHERE cuadrilla_id = v_cuadrilla_id) THEN
    INSERT INTO rendimientos (cuadrilla_id, actividad_tipo, unidad, rendimiento_normal, rendimiento_minimo, rendimiento_optimo, fuente)
    VALUES (v_cuadrilla_id, 'Excavación Manual', 'm³', 4, 2, 6, 'INVIAS/IDU Colombia 2025');
  END IF;


  -- ════════════════════════════════════════════════════════════
  -- 7. PISOS Y ENCHAPES
  --    1 oficial enchapador + 1 ayudante | Rend: 10 m²/día
  -- ════════════════════════════════════════════════════════════
  SELECT id INTO v_cuadrilla_id FROM cuadrillas
  WHERE nombre = 'Cuadrilla Pisos y Enchapes' AND es_sistema = true LIMIT 1;

  IF v_cuadrilla_id IS NULL THEN
    INSERT INTO cuadrillas (nombre, descripcion, categoria_actividad, es_sistema, activa, user_id)
    VALUES (
      'Cuadrilla Pisos y Enchapes',
      'Instalación de pisos en cerámica, porcelanato, granito, madera y similares',
      'Pisos y Enchapes', true, true, NULL
    ) RETURNING id INTO v_cuadrilla_id;
  END IF;

  IF v_enchapador IS NOT NULL THEN
    INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad)
    SELECT v_cuadrilla_id, v_enchapador, 1
    WHERE NOT EXISTS (
      SELECT 1 FROM cuadrilla_trabajadores
      WHERE cuadrilla_id = v_cuadrilla_id AND trabajador_id = v_enchapador
    );
  END IF;

  IF v_ay_construccion IS NOT NULL THEN
    INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad)
    SELECT v_cuadrilla_id, v_ay_construccion, 1
    WHERE NOT EXISTS (
      SELECT 1 FROM cuadrilla_trabajadores
      WHERE cuadrilla_id = v_cuadrilla_id AND trabajador_id = v_ay_construccion
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM rendimientos WHERE cuadrilla_id = v_cuadrilla_id) THEN
    INSERT INTO rendimientos (cuadrilla_id, actividad_tipo, unidad, rendimiento_normal, rendimiento_minimo, rendimiento_optimo, fuente)
    VALUES (v_cuadrilla_id, 'Pisos y Enchapes', 'm²', 10, 6, 15, 'INVIAS/IDU Colombia 2025');
  END IF;


  -- ════════════════════════════════════════════════════════════
  -- 8. PINTURA
  --    1 oficial pintor + 1 ayudante | Rend: 20 m²/día
  -- ════════════════════════════════════════════════════════════
  SELECT id INTO v_cuadrilla_id FROM cuadrillas
  WHERE nombre = 'Cuadrilla Pintura' AND es_sistema = true LIMIT 1;

  IF v_cuadrilla_id IS NULL THEN
    INSERT INTO cuadrillas (nombre, descripcion, categoria_actividad, es_sistema, activa, user_id)
    VALUES (
      'Cuadrilla Pintura',
      'Pintura de muros interiores y exteriores — vinilo, esmalte, impermeabilizante',
      'Pintura', true, true, NULL
    ) RETURNING id INTO v_cuadrilla_id;
  END IF;

  IF v_pintor IS NOT NULL THEN
    INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad)
    SELECT v_cuadrilla_id, v_pintor, 1
    WHERE NOT EXISTS (
      SELECT 1 FROM cuadrilla_trabajadores
      WHERE cuadrilla_id = v_cuadrilla_id AND trabajador_id = v_pintor
    );
  END IF;

  IF v_ay_pintor IS NOT NULL THEN
    INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad)
    SELECT v_cuadrilla_id, v_ay_pintor, 1
    WHERE NOT EXISTS (
      SELECT 1 FROM cuadrilla_trabajadores
      WHERE cuadrilla_id = v_cuadrilla_id AND trabajador_id = v_ay_pintor
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM rendimientos WHERE cuadrilla_id = v_cuadrilla_id) THEN
    INSERT INTO rendimientos (cuadrilla_id, actividad_tipo, unidad, rendimiento_normal, rendimiento_minimo, rendimiento_optimo, fuente)
    VALUES (v_cuadrilla_id, 'Pintura', 'm²', 20, 12, 30, 'INVIAS/IDU Colombia 2025');
  END IF;


  -- ════════════════════════════════════════════════════════════
  -- 9. ESTRUCTURA METÁLICA
  --    1 oficial soldador + 1 ayudante | Rend: 80 kg/día
  -- ════════════════════════════════════════════════════════════
  SELECT id INTO v_cuadrilla_id FROM cuadrillas
  WHERE nombre = 'Cuadrilla Estructura Metálica' AND es_sistema = true LIMIT 1;

  IF v_cuadrilla_id IS NULL THEN
    INSERT INTO cuadrillas (nombre, descripcion, categoria_actividad, es_sistema, activa, user_id)
    VALUES (
      'Cuadrilla Estructura Metálica',
      'Fabricación y montaje de estructuras metálicas — perfiles, vigas, correas',
      'Estructura Metálica', true, true, NULL
    ) RETURNING id INTO v_cuadrilla_id;
  END IF;

  IF v_soldador IS NOT NULL THEN
    INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad)
    SELECT v_cuadrilla_id, v_soldador, 1
    WHERE NOT EXISTS (
      SELECT 1 FROM cuadrilla_trabajadores
      WHERE cuadrilla_id = v_cuadrilla_id AND trabajador_id = v_soldador
    );
  END IF;

  IF v_ay_soldador IS NOT NULL THEN
    INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad)
    SELECT v_cuadrilla_id, v_ay_soldador, 1
    WHERE NOT EXISTS (
      SELECT 1 FROM cuadrilla_trabajadores
      WHERE cuadrilla_id = v_cuadrilla_id AND trabajador_id = v_ay_soldador
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM rendimientos WHERE cuadrilla_id = v_cuadrilla_id) THEN
    INSERT INTO rendimientos (cuadrilla_id, actividad_tipo, unidad, rendimiento_normal, rendimiento_minimo, rendimiento_optimo, fuente)
    VALUES (v_cuadrilla_id, 'Estructura Metálica', 'kg', 80, 50, 120, 'INVIAS/IDU Colombia 2025');
  END IF;


  -- ════════════════════════════════════════════════════════════
  -- 10. TOPOGRAFÍA / LOCALIZACIÓN
  --     1 topógrafo + 1 ayudante (cadenero) | Rend: 200 ml/día
  -- ════════════════════════════════════════════════════════════
  SELECT id INTO v_cuadrilla_id FROM cuadrillas
  WHERE nombre = 'Cuadrilla Topografía' AND es_sistema = true LIMIT 1;

  IF v_cuadrilla_id IS NULL THEN
    INSERT INTO cuadrillas (nombre, descripcion, categoria_actividad, es_sistema, activa, user_id)
    VALUES (
      'Cuadrilla Topografía',
      'Levantamiento topográfico, localización y replanteo de obras',
      'Topografía', true, true, NULL
    ) RETURNING id INTO v_cuadrilla_id;
  END IF;

  IF v_topografo IS NOT NULL THEN
    INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad)
    SELECT v_cuadrilla_id, v_topografo, 1
    WHERE NOT EXISTS (
      SELECT 1 FROM cuadrilla_trabajadores
      WHERE cuadrilla_id = v_cuadrilla_id AND trabajador_id = v_topografo
    );
  END IF;

  -- El cadenero se mapea al ayudante de construcción general
  IF v_ay_construccion IS NOT NULL THEN
    INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad)
    SELECT v_cuadrilla_id, v_ay_construccion, 1
    WHERE NOT EXISTS (
      SELECT 1 FROM cuadrilla_trabajadores
      WHERE cuadrilla_id = v_cuadrilla_id AND trabajador_id = v_ay_construccion
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM rendimientos WHERE cuadrilla_id = v_cuadrilla_id) THEN
    INSERT INTO rendimientos (cuadrilla_id, actividad_tipo, unidad, rendimiento_normal, rendimiento_minimo, rendimiento_optimo, fuente)
    VALUES (v_cuadrilla_id, 'Topografía', 'ml', 200, 100, 400, 'INVIAS/IDU Colombia 2025');
  END IF;

  RAISE NOTICE 'Seed cuadrillas base completado — 10 cuadrillas de sistema insertadas (o ya existentes).';

END $$;
