-- ============================================================
-- SIPO: Fix cuadrilla_trabajadores — tildes en especialidades
-- El seed anterior falló en albanil/topógrafo/ayudante construcción
-- por mismatch de caracteres acentuados en ILIKE.
-- Usa nombres exactos de la tabla trabajadores.
-- ============================================================

DO $$
DECLARE
  v_albanil          UUID;
  v_topografo        UUID;
  v_ay_construccion  UUID;
  v_enchapador       UUID;
  v_estucador        UUID;

  v_cuadrilla_id UUID;
BEGIN

  -- Buscar con nombres exactos (la BD tiene tildes)
  SELECT id INTO v_albanil         FROM trabajadores WHERE especialidad = 'Oficial albañil'      AND activo = true LIMIT 1;
  SELECT id INTO v_topografo       FROM trabajadores WHERE especialidad = 'Topógrafo'            AND activo = true LIMIT 1;
  -- Ayudante construcción sin "de" (el otro registro es "Ayudante de construcción")
  SELECT id INTO v_ay_construccion FROM trabajadores WHERE especialidad = 'Ayudante construcción' AND activo = true LIMIT 1;
  SELECT id INTO v_enchapador      FROM trabajadores WHERE especialidad = 'Oficial enchapador'   AND activo = true LIMIT 1;
  SELECT id INTO v_estucador       FROM trabajadores WHERE especialidad = 'Oficial estucador'    AND activo = true LIMIT 1;

  IF v_albanil         IS NULL THEN RAISE NOTICE 'SKIP: No se encontró Oficial albañil'; END IF;
  IF v_topografo       IS NULL THEN RAISE NOTICE 'SKIP: No se encontró Topógrafo'; END IF;
  IF v_ay_construccion IS NULL THEN RAISE NOTICE 'SKIP: No se encontró Ayudante construcción'; END IF;


  -- ── 1. MAMPOSTERÍA — albanil + 2 ayudantes ──────────────────────────────────
  SELECT id INTO v_cuadrilla_id FROM cuadrillas WHERE nombre = 'Cuadrilla Mampostería' AND es_sistema = true LIMIT 1;
  IF v_cuadrilla_id IS NOT NULL THEN
    IF v_albanil IS NOT NULL THEN
      INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad)
      SELECT v_cuadrilla_id, v_albanil, 1
      WHERE NOT EXISTS (
        SELECT 1 FROM cuadrilla_trabajadores WHERE cuadrilla_id = v_cuadrilla_id AND trabajador_id = v_albanil
      );
    END IF;
    IF v_ay_construccion IS NOT NULL THEN
      INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad)
      SELECT v_cuadrilla_id, v_ay_construccion, 2
      WHERE NOT EXISTS (
        SELECT 1 FROM cuadrilla_trabajadores WHERE cuadrilla_id = v_cuadrilla_id AND trabajador_id = v_ay_construccion
      );
    END IF;
  END IF;


  -- ── 2. CONCRETO / VACIADO — albanil + 3 ayudantes ───────────────────────────
  SELECT id INTO v_cuadrilla_id FROM cuadrillas WHERE nombre = 'Cuadrilla Concreto / Vaciado' AND es_sistema = true LIMIT 1;
  IF v_cuadrilla_id IS NOT NULL THEN
    IF v_albanil IS NOT NULL THEN
      INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad)
      SELECT v_cuadrilla_id, v_albanil, 1
      WHERE NOT EXISTS (
        SELECT 1 FROM cuadrilla_trabajadores WHERE cuadrilla_id = v_cuadrilla_id AND trabajador_id = v_albanil
      );
    END IF;
    IF v_ay_construccion IS NOT NULL THEN
      INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad)
      SELECT v_cuadrilla_id, v_ay_construccion, 3
      WHERE NOT EXISTS (
        SELECT 1 FROM cuadrilla_trabajadores WHERE cuadrilla_id = v_cuadrilla_id AND trabajador_id = v_ay_construccion
      );
    END IF;
  END IF;


  -- ── 3. PAÑETE Y REVOQUE — ayudante faltaba ──────────────────────────────────
  SELECT id INTO v_cuadrilla_id FROM cuadrillas WHERE nombre = 'Cuadrilla Pañete y Revoque' AND es_sistema = true LIMIT 1;
  IF v_cuadrilla_id IS NOT NULL AND v_ay_construccion IS NOT NULL THEN
    INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad)
    SELECT v_cuadrilla_id, v_ay_construccion, 1
    WHERE NOT EXISTS (
      SELECT 1 FROM cuadrilla_trabajadores WHERE cuadrilla_id = v_cuadrilla_id AND trabajador_id = v_ay_construccion
    );
  END IF;


  -- ── 4. EXCAVACIÓN MANUAL — albanil + 2 ayudantes ────────────────────────────
  SELECT id INTO v_cuadrilla_id FROM cuadrillas WHERE nombre = 'Cuadrilla Excavación Manual' AND es_sistema = true LIMIT 1;
  IF v_cuadrilla_id IS NOT NULL THEN
    IF v_albanil IS NOT NULL THEN
      INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad)
      SELECT v_cuadrilla_id, v_albanil, 1
      WHERE NOT EXISTS (
        SELECT 1 FROM cuadrilla_trabajadores WHERE cuadrilla_id = v_cuadrilla_id AND trabajador_id = v_albanil
      );
    END IF;
    IF v_ay_construccion IS NOT NULL THEN
      INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad)
      SELECT v_cuadrilla_id, v_ay_construccion, 2
      WHERE NOT EXISTS (
        SELECT 1 FROM cuadrilla_trabajadores WHERE cuadrilla_id = v_cuadrilla_id AND trabajador_id = v_ay_construccion
      );
    END IF;
  END IF;


  -- ── 5. PISOS Y ENCHAPES — ayudante faltaba ──────────────────────────────────
  SELECT id INTO v_cuadrilla_id FROM cuadrillas WHERE nombre = 'Cuadrilla Pisos y Enchapes' AND es_sistema = true LIMIT 1;
  IF v_cuadrilla_id IS NOT NULL AND v_ay_construccion IS NOT NULL THEN
    INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad)
    SELECT v_cuadrilla_id, v_ay_construccion, 1
    WHERE NOT EXISTS (
      SELECT 1 FROM cuadrilla_trabajadores WHERE cuadrilla_id = v_cuadrilla_id AND trabajador_id = v_ay_construccion
    );
  END IF;


  -- ── 6. TOPOGRAFÍA — topógrafo + cadenero (ayudante) ─────────────────────────
  SELECT id INTO v_cuadrilla_id FROM cuadrillas WHERE nombre = 'Cuadrilla Topografía' AND es_sistema = true LIMIT 1;
  IF v_cuadrilla_id IS NOT NULL THEN
    IF v_topografo IS NOT NULL THEN
      INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad)
      SELECT v_cuadrilla_id, v_topografo, 1
      WHERE NOT EXISTS (
        SELECT 1 FROM cuadrilla_trabajadores WHERE cuadrilla_id = v_cuadrilla_id AND trabajador_id = v_topografo
      );
    END IF;
    IF v_ay_construccion IS NOT NULL THEN
      INSERT INTO cuadrilla_trabajadores (cuadrilla_id, trabajador_id, cantidad)
      SELECT v_cuadrilla_id, v_ay_construccion, 1
      WHERE NOT EXISTS (
        SELECT 1 FROM cuadrilla_trabajadores WHERE cuadrilla_id = v_cuadrilla_id AND trabajador_id = v_ay_construccion
      );
    END IF;
  END IF;

  RAISE NOTICE 'Fix cuadrilla_trabajadores completado.';

END $$;
