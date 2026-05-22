-- SIPO: Función atómica para duplicar un presupuesto completo
-- Reemplaza el loop de INSERTs individuales en el Server Action.
-- Ventajas: (1) transacción — todo o nada; (2) una sola llamada de red;
-- (3) bulk insert de apu_items por APU en lugar de N round-trips.
-- SECURITY DEFINER: corre con privilegios del owner (postgres) para
-- poder escribir en tablas con RLS. Valida ownership de p_user_id internamente.

CREATE OR REPLACE FUNCTION fn_duplicar_presupuesto(
  p_budget_id UUID,
  p_user_id   UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_budget_id   UUID;
  v_new_chapter_id  UUID;
  v_new_activity_id UUID;
  v_new_apu_id      UUID;
  v_cap             RECORD;
  v_act             RECORD;
  v_apu             RECORD;
BEGIN
  -- 1. Verificar que el presupuesto existe y pertenece al usuario
  IF NOT EXISTS (
    SELECT 1 FROM budgets
    WHERE id = p_budget_id AND user_id = p_user_id AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Presupuesto no encontrado o sin permiso';
  END IF;

  -- 2. Duplicar presupuesto (excluye costo_directo y valor_total: son calculados por triggers)
  INSERT INTO budgets (
    project_id, user_id, titulo, estado,
    metodo_aiu, administracion_pct, imprevistos_pct, utilidad_pct,
    gastos_fijos_mensuales, duracion_meses,
    iva_porcentaje, metodo_iva,
    mostrar_retenciones, retefuente_pct, ica_pct, reteiva_pct, ciudad_ica,
    moneda, vigencia_dias, descripcion, fecha_elaboracion
  )
  SELECT
    project_id, p_user_id, titulo || ' (copia)', 'borrador',
    metodo_aiu, administracion_pct, imprevistos_pct, utilidad_pct,
    gastos_fijos_mensuales, duracion_meses,
    iva_porcentaje, metodo_iva,
    mostrar_retenciones, retefuente_pct, ica_pct, reteiva_pct, ciudad_ica,
    moneda, vigencia_dias, descripcion, fecha_elaboracion
  FROM budgets
  WHERE id = p_budget_id
  RETURNING id INTO v_new_budget_id;

  -- 3. Duplicar capítulos en orden
  FOR v_cap IN
    SELECT * FROM chapters
    WHERE budget_id = p_budget_id AND deleted_at IS NULL
    ORDER BY numero
  LOOP
    INSERT INTO chapters (budget_id, user_id, nombre, numero, descripcion)
    VALUES (v_new_budget_id, p_user_id, v_cap.nombre, v_cap.numero, v_cap.descripcion)
    RETURNING id INTO v_new_chapter_id;

    -- 4. Duplicar actividades del capítulo (subtotal es GENERATED — no se incluye)
    FOR v_act IN
      SELECT * FROM activities
      WHERE chapter_id = v_cap.id AND deleted_at IS NULL
      ORDER BY numero
    LOOP
      INSERT INTO activities (
        chapter_id, budget_id, user_id,
        nombre, unidad, cantidad, precio_unitario, numero
      )
      VALUES (
        v_new_chapter_id, v_new_budget_id, p_user_id,
        v_act.nombre, v_act.unidad, v_act.cantidad, v_act.precio_unitario, v_act.numero
      )
      RETURNING id INTO v_new_activity_id;

      -- 5. Duplicar APU de la actividad si existe (costo_total es GENERATED — no se incluye)
      SELECT * INTO v_apu
      FROM apus
      WHERE activity_id = v_act.id AND deleted_at IS NULL
      LIMIT 1;

      IF FOUND THEN
        INSERT INTO apus (
          activity_id, budget_id, user_id,
          rendimiento, costo_material, costo_mano_obra, costo_equipo,
          costo_herramienta_menor, costo_epp
        )
        VALUES (
          v_new_activity_id, v_new_budget_id, p_user_id,
          v_apu.rendimiento, v_apu.costo_material, v_apu.costo_mano_obra, v_apu.costo_equipo,
          v_apu.costo_herramienta_menor, v_apu.costo_epp
        )
        RETURNING id INTO v_new_apu_id;

        -- 6. Bulk insert de ítems del APU (subtotal es GENERATED — no se incluye)
        -- cuadrilla_id y proveedor_id no se copian (son refs locales del usuario)
        INSERT INTO apu_items (apu_id, user_id, nombre, tipo, unidad, cantidad, precio_unitario)
        SELECT v_new_apu_id, p_user_id, nombre, tipo, unidad, cantidad, precio_unitario
        FROM apu_items
        WHERE apu_id = v_apu.id AND deleted_at IS NULL;
      END IF;
    END LOOP;
  END LOOP;

  RETURN v_new_budget_id;
END;
$$;

-- Revocar acceso público; solo usuarios autenticados pueden ejecutarla
REVOKE ALL ON FUNCTION fn_duplicar_presupuesto(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fn_duplicar_presupuesto(UUID, UUID) TO authenticated;
