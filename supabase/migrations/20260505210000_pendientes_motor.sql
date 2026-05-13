-- ============================================================
-- SIPO — Pendientes consolidados de archivos SQL sueltos
-- Consolida: migration_motor_calculo.sql, migration_motor_2026.sql,
--            preferences_column.sql
-- ============================================================

-- ─── apus: porcentajes herramienta_menor y epp ───────────────────────────────
ALTER TABLE apus
  ADD COLUMN IF NOT EXISTS pct_herramienta_menor NUMERIC DEFAULT 3,
  ADD COLUMN IF NOT EXISTS pct_epp               NUMERIC DEFAULT 1;

-- ─── profiles: columna preferences (JSON de configuración UI) ────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{
    "accentColor": "#E8571A",
    "density": "normal",
    "showCompanyName": true,
    "defaultCity": "Bogotá"
  }'::jsonb;

-- ─── Vista: resumen de presupuesto con cálculo colombiano ────────────────────
CREATE OR REPLACE VIEW v_resumen_presupuesto AS
SELECT
  b.id                                                        AS budget_id,
  b.titulo,
  b.costo_directo,
  -- Administración
  CASE
    WHEN b.metodo_aiu = 'detallado' THEN b.gastos_fijos_mensuales * b.duracion_meses
    ELSE b.costo_directo * (b.administracion_pct / 100)
  END                                                         AS administracion,
  -- Imprevistos y utilidad (siempre sobre CD)
  b.costo_directo * (b.imprevistos_pct / 100)                 AS imprevistos,
  b.costo_directo * (b.utilidad_pct   / 100)                  AS utilidad,
  -- Subtotal CD + AIU
  b.costo_directo
    + CASE WHEN b.metodo_aiu = 'detallado'
           THEN b.gastos_fijos_mensuales * b.duracion_meses
           ELSE b.costo_directo * (b.administracion_pct / 100) END
    + b.costo_directo * (b.imprevistos_pct / 100)
    + b.costo_directo * (b.utilidad_pct   / 100)              AS subtotal_con_aiu,
  -- IVA (método configurable: sobre utilidad, sobre AIU total, o sobre total oferta)
  CASE b.metodo_iva
    WHEN 'sobre_utilidad' THEN
      b.costo_directo * (b.utilidad_pct / 100) * (b.iva_porcentaje / 100)
    WHEN 'sobre_aiu' THEN
      (b.costo_directo * ((b.administracion_pct + b.imprevistos_pct + b.utilidad_pct) / 100))
        * (b.iva_porcentaje / 100)
    WHEN 'sobre_total' THEN
      (b.costo_directo
        + CASE WHEN b.metodo_aiu = 'detallado'
               THEN b.gastos_fijos_mensuales * b.duracion_meses
               ELSE b.costo_directo * (b.administracion_pct / 100) END
        + b.costo_directo * (b.imprevistos_pct / 100)
        + b.costo_directo * (b.utilidad_pct   / 100))
        * (b.iva_porcentaje / 100)
    ELSE 0
  END                                                         AS iva,
  -- Total oferta (CD + AIU + IVA)
  b.costo_directo
    + CASE WHEN b.metodo_aiu = 'detallado'
           THEN b.gastos_fijos_mensuales * b.duracion_meses
           ELSE b.costo_directo * (b.administracion_pct / 100) END
    + b.costo_directo * (b.imprevistos_pct / 100)
    + b.costo_directo * (b.utilidad_pct   / 100)
    + CASE b.metodo_iva
        WHEN 'sobre_utilidad' THEN
          b.costo_directo * (b.utilidad_pct / 100) * (b.iva_porcentaje / 100)
        WHEN 'sobre_aiu' THEN
          (b.costo_directo * ((b.administracion_pct + b.imprevistos_pct + b.utilidad_pct) / 100))
            * (b.iva_porcentaje / 100)
        WHEN 'sobre_total' THEN
          (b.costo_directo
            + CASE WHEN b.metodo_aiu = 'detallado'
                   THEN b.gastos_fijos_mensuales * b.duracion_meses
                   ELSE b.costo_directo * (b.administracion_pct / 100) END
            + b.costo_directo * (b.imprevistos_pct / 100)
            + b.costo_directo * (b.utilidad_pct   / 100))
            * (b.iva_porcentaje / 100)
        ELSE 0
      END                                                     AS total_oferta,
  -- Retenciones (informativas, no descuentan del valor ofertado)
  CASE WHEN b.mostrar_retenciones THEN
    b.valor_total * (b.retefuente_pct / 100)
  ELSE 0 END                                                  AS retefuente,
  CASE WHEN b.mostrar_retenciones THEN
    b.valor_total * (b.ica_pct / 100)
  ELSE 0 END                                                  AS ica,
  CASE WHEN b.mostrar_retenciones THEN
    (CASE b.metodo_iva
       WHEN 'sobre_utilidad' THEN b.costo_directo * (b.utilidad_pct / 100) * (b.iva_porcentaje / 100)
       WHEN 'sobre_aiu'      THEN (b.costo_directo * ((b.administracion_pct + b.imprevistos_pct + b.utilidad_pct) / 100)) * (b.iva_porcentaje / 100)
       WHEN 'sobre_total'    THEN b.valor_total * (b.iva_porcentaje / 100)
       ELSE 0
     END) * (b.reteiva_pct / 100)
  ELSE 0 END                                                  AS reteiva
FROM budgets b
WHERE b.deleted_at IS NULL;
