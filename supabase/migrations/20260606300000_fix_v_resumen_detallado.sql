-- ============================================================
-- SIPO — Fix: v_resumen_presupuesto modo AIU detallado
--
-- Bug: en modo 'detallado' la vista calculaba
--   administracion = gastos_fijos_mensuales * duracion_meses
-- usando el campo legacy gastos_fijos_mensuales (nunca actualizado
-- por el nuevo sistema de aiu_componentes).
--
-- Fix: usar costo_directo * (administracion_pct / 100) para AMBOS modos.
-- El campo budgets.administracion_pct ya contiene el porcentaje correcto:
--   * 'porcentaje' → lo fija el usuario directamente.
--   * 'detallado'  → lo calcula ConfiguracionAIU y lo guarda vía actualizarPresupuesto.
-- ============================================================

DROP VIEW IF EXISTS v_resumen_presupuesto;

CREATE VIEW v_resumen_presupuesto
  WITH (security_invoker = true)
AS
WITH base AS (
  SELECT
    b.id,
    b.titulo,
    b.costo_directo,
    b.metodo_aiu,
    b.administracion_pct,
    b.imprevistos_pct,
    b.utilidad_pct,
    b.metodo_iva,
    b.iva_porcentaje,
    b.mostrar_retenciones,
    b.retefuente_pct,
    b.ica_pct,
    b.reteiva_pct,
    -- Administración: siempre desde administracion_pct (correcto para ambos modos).
    -- En modo 'detallado', ConfiguracionAIU guarda el pct calculado de aiu_componentes.
    ROUND(b.costo_directo * (COALESCE(b.administracion_pct, 0) / 100), 0) AS administracion,
    ROUND(b.costo_directo * (COALESCE(b.imprevistos_pct, 0)    / 100), 0) AS imprevistos,
    ROUND(b.costo_directo * (COALESCE(b.utilidad_pct,   0)    / 100), 0) AS utilidad
  FROM budgets b
  WHERE b.deleted_at IS NULL
),
calcs AS (
  SELECT
    base.*,
    base.administracion + base.imprevistos + base.utilidad AS aiu,
    base.costo_directo + base.administracion + base.imprevistos + base.utilidad AS subtotal_con_aiu
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
  ROUND(
    CASE c.metodo_iva
      WHEN 'sobre_utilidad' THEN c.utilidad        * (COALESCE(c.iva_porcentaje, 0) / 100)
      WHEN 'sobre_aiu'      THEN c.aiu             * (COALESCE(c.iva_porcentaje, 0) / 100)
      WHEN 'sobre_total'    THEN c.subtotal_con_aiu * (COALESCE(c.iva_porcentaje, 0) / 100)
      ELSE 0
    END
  , 0) AS iva,
  -- Total oferta
  ROUND(
    c.subtotal_con_aiu + CASE c.metodo_iva
      WHEN 'sobre_utilidad' THEN c.utilidad        * (COALESCE(c.iva_porcentaje, 0) / 100)
      WHEN 'sobre_aiu'      THEN c.aiu             * (COALESCE(c.iva_porcentaje, 0) / 100)
      WHEN 'sobre_total'    THEN c.subtotal_con_aiu * (COALESCE(c.iva_porcentaje, 0) / 100)
      ELSE 0
    END
  , 0) AS total_oferta,
  -- Retenciones informativas — base: subtotal_con_aiu (CD + AIU)
  CASE WHEN c.mostrar_retenciones
    THEN ROUND(c.subtotal_con_aiu * (COALESCE(c.retefuente_pct, 0) / 100), 0)
    ELSE 0
  END AS retefuente,
  CASE WHEN c.mostrar_retenciones
    THEN ROUND(c.subtotal_con_aiu * (COALESCE(c.ica_pct, 0) / 100), 0)
    ELSE 0
  END AS ica,
  CASE WHEN c.mostrar_retenciones THEN
    ROUND(
      (CASE c.metodo_iva
         WHEN 'sobre_utilidad' THEN c.utilidad        * (COALESCE(c.iva_porcentaje, 0) / 100)
         WHEN 'sobre_aiu'      THEN c.aiu             * (COALESCE(c.iva_porcentaje, 0) / 100)
         WHEN 'sobre_total'    THEN c.subtotal_con_aiu * (COALESCE(c.iva_porcentaje, 0) / 100)
         ELSE 0
       END) * (COALESCE(c.reteiva_pct, 0) / 100)
    , 0)
  ELSE 0 END AS reteiva
FROM calcs c;
