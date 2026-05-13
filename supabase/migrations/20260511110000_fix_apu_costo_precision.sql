-- ============================================================
-- SIPO — Corrección de precisión flotante en apus.costo_total
-- Problema: NUMERIC sin escala fija acumula decimales fantasma
--   (ej: 26757.96000000000174) cuando se insertan valores con
--   aritmética de punto flotante desde JavaScript.
-- Solución:
--   1. Drop costo_total (GENERATED no se puede ALTER directamente)
--   2. Cambiar columnas fuente a NUMERIC(15,2) — redondea datos
--      existentes a 2 decimales con USING ROUND(...)
--   3. Recrear costo_total como NUMERIC(15,2) GENERATED con ROUND
--   4. Recrear v_resumen_presupuesto con ROUND en toda aritmética
-- ============================================================

-- ─── 1. Eliminar columna GENERATED ───────────────────────────────
ALTER TABLE apus DROP COLUMN IF EXISTS costo_total;

-- ─── 2. Fijar escala en columnas fuente (redondea datos existentes)
ALTER TABLE apus
  ALTER COLUMN costo_material          TYPE NUMERIC(15,2)
    USING ROUND(COALESCE(costo_material, 0)::NUMERIC, 2),
  ALTER COLUMN costo_mano_obra         TYPE NUMERIC(15,2)
    USING ROUND(COALESCE(costo_mano_obra, 0)::NUMERIC, 2),
  ALTER COLUMN costo_equipo            TYPE NUMERIC(15,2)
    USING ROUND(COALESCE(costo_equipo, 0)::NUMERIC, 2),
  ALTER COLUMN costo_herramienta_menor TYPE NUMERIC(15,2)
    USING ROUND(COALESCE(costo_herramienta_menor, 0)::NUMERIC, 2),
  ALTER COLUMN costo_epp               TYPE NUMERIC(15,2)
    USING ROUND(COALESCE(costo_epp, 0)::NUMERIC, 2);

-- ─── 3. Recrear costo_total con precisión fija ───────────────────
ALTER TABLE apus
  ADD COLUMN IF NOT EXISTS costo_total NUMERIC(15,2)
    GENERATED ALWAYS AS (
      ROUND(
        COALESCE(costo_material, 0)
        + COALESCE(costo_mano_obra, 0)
        + COALESCE(costo_equipo, 0)
        + COALESCE(costo_herramienta_menor, 0)
        + COALESCE(costo_epp, 0),
        2
      )
    ) STORED;

-- ─── 4. Recrear v_resumen_presupuesto con ROUND en aritmética ────
-- Basado en 20260506100000_fix_v_resumen_retenciones.sql.
-- Añade ROUND(..., 2) en cada operación para evitar acumulación
-- de decimales en la cadena CD → AIU → IVA → retenciones.

DROP VIEW IF EXISTS v_resumen_presupuesto;
CREATE VIEW v_resumen_presupuesto AS
WITH base AS (
  SELECT
    b.id,
    b.titulo,
    b.costo_directo,
    b.metodo_aiu,
    b.administracion_pct,
    b.imprevistos_pct,
    b.utilidad_pct,
    b.gastos_fijos_mensuales,
    b.duracion_meses,
    b.metodo_iva,
    b.iva_porcentaje,
    b.mostrar_retenciones,
    b.retefuente_pct,
    b.ica_pct,
    b.reteiva_pct,
    CASE
      WHEN b.metodo_aiu = 'detallado'
        THEN ROUND(b.gastos_fijos_mensuales * b.duracion_meses, 2)
      ELSE ROUND(b.costo_directo * (b.administracion_pct / 100), 2)
    END AS administracion,
    ROUND(b.costo_directo * (b.imprevistos_pct / 100), 2) AS imprevistos,
    ROUND(b.costo_directo * (b.utilidad_pct   / 100), 2) AS utilidad
  FROM budgets b
  WHERE b.deleted_at IS NULL
),
calcs AS (
  SELECT
    base.*,
    ROUND(base.administracion + base.imprevistos + base.utilidad, 2) AS aiu,
    ROUND(base.costo_directo + base.administracion + base.imprevistos + base.utilidad, 2) AS subtotal_con_aiu
  FROM base
)
SELECT
  c.id                   AS budget_id,
  c.titulo,
  c.costo_directo,
  c.administracion,
  c.imprevistos,
  c.utilidad,
  c.aiu,
  c.subtotal_con_aiu,
  -- IVA según método
  CASE c.metodo_iva
    WHEN 'sobre_utilidad' THEN ROUND(c.utilidad        * (c.iva_porcentaje / 100), 2)
    WHEN 'sobre_aiu'      THEN ROUND(c.aiu             * (c.iva_porcentaje / 100), 2)
    WHEN 'sobre_total'    THEN ROUND(c.subtotal_con_aiu * (c.iva_porcentaje / 100), 2)
    ELSE 0
  END AS iva,
  -- Total oferta = subtotal_con_aiu + IVA
  ROUND(
    c.subtotal_con_aiu + CASE c.metodo_iva
      WHEN 'sobre_utilidad' THEN ROUND(c.utilidad        * (c.iva_porcentaje / 100), 2)
      WHEN 'sobre_aiu'      THEN ROUND(c.aiu             * (c.iva_porcentaje / 100), 2)
      WHEN 'sobre_total'    THEN ROUND(c.subtotal_con_aiu * (c.iva_porcentaje / 100), 2)
      ELSE 0
    END,
    2
  ) AS total_oferta,
  -- Retenciones informativas — base: subtotal_con_aiu (CD + AIU)
  CASE WHEN c.mostrar_retenciones
    THEN ROUND(c.subtotal_con_aiu * (c.retefuente_pct / 100), 2)
    ELSE 0
  END AS retefuente,
  CASE WHEN c.mostrar_retenciones
    THEN ROUND(c.subtotal_con_aiu * (c.ica_pct / 100), 2)
    ELSE 0
  END AS ica,
  CASE WHEN c.mostrar_retenciones THEN
    ROUND(
      (CASE c.metodo_iva
         WHEN 'sobre_utilidad' THEN ROUND(c.utilidad        * (c.iva_porcentaje / 100), 2)
         WHEN 'sobre_aiu'      THEN ROUND(c.aiu             * (c.iva_porcentaje / 100), 2)
         WHEN 'sobre_total'    THEN ROUND(c.subtotal_con_aiu * (c.iva_porcentaje / 100), 2)
         ELSE 0
       END) * (c.reteiva_pct / 100),
      2
    )
  ELSE 0 END AS reteiva
FROM calcs c;
