-- Fix: v_resumen_presupuesto usaba b.valor_total (columna almacenada, potencialmente obsoleta)
-- como base de ReteFuente, ICA y el IVA del caso 'sobre_total' en ReteIVA.
-- Corrección: usar el subtotal_con_aiu calculado inline, consistente con la fórmula canónica.
-- Base ReteFuente e ICA = CD + AIU (no el total con IVA ni un campo almacenado).
-- DROP necesario porque PostgreSQL no permite renombrar/reordenar columnas con CREATE OR REPLACE.

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
    -- Administración (detallado o porcentaje)
    CASE
      WHEN b.metodo_aiu = 'detallado' THEN b.gastos_fijos_mensuales * b.duracion_meses
      ELSE b.costo_directo * (b.administracion_pct / 100)
    END AS administracion,
    b.costo_directo * (b.imprevistos_pct / 100) AS imprevistos,
    b.costo_directo * (b.utilidad_pct   / 100) AS utilidad
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
  CASE c.metodo_iva
    WHEN 'sobre_utilidad' THEN c.utilidad        * (c.iva_porcentaje / 100)
    WHEN 'sobre_aiu'      THEN c.aiu             * (c.iva_porcentaje / 100)
    WHEN 'sobre_total'    THEN c.subtotal_con_aiu * (c.iva_porcentaje / 100)
    ELSE 0
  END AS iva,
  -- Total oferta
  c.subtotal_con_aiu + CASE c.metodo_iva
    WHEN 'sobre_utilidad' THEN c.utilidad        * (c.iva_porcentaje / 100)
    WHEN 'sobre_aiu'      THEN c.aiu             * (c.iva_porcentaje / 100)
    WHEN 'sobre_total'    THEN c.subtotal_con_aiu * (c.iva_porcentaje / 100)
    ELSE 0
  END AS total_oferta,
  -- Retenciones informativas — base: subtotal_con_aiu (CD + AIU), nunca valor_total almacenado
  CASE WHEN c.mostrar_retenciones THEN c.subtotal_con_aiu * (c.retefuente_pct / 100) ELSE 0 END AS retefuente,
  CASE WHEN c.mostrar_retenciones THEN c.subtotal_con_aiu * (c.ica_pct        / 100) ELSE 0 END AS ica,
  CASE WHEN c.mostrar_retenciones THEN
    (CASE c.metodo_iva
       WHEN 'sobre_utilidad' THEN c.utilidad        * (c.iva_porcentaje / 100)
       WHEN 'sobre_aiu'      THEN c.aiu             * (c.iva_porcentaje / 100)
       WHEN 'sobre_total'    THEN c.subtotal_con_aiu * (c.iva_porcentaje / 100)
       ELSE 0
     END) * (c.reteiva_pct / 100)
  ELSE 0 END AS reteiva
FROM calcs c;
