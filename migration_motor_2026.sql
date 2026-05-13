-- ============================================================
-- SIPO — Migración Complementaria: Motor 2026 e IVA sobre Utilidad
-- ============================================================

-- ── 1. TABLA: budgets ───────────────────────────────────────
-- Nuevos campos para método de cálculo profesional

ALTER TABLE budgets
  ADD COLUMN IF NOT EXISTS metodo_aiu TEXT DEFAULT 'porcentaje' CHECK (metodo_aiu IN ('porcentaje', 'detallado')),
  ADD COLUMN IF NOT EXISTS gastos_fijos_mensuales NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duracion_meses INT DEFAULT 1;

-- ── 2. ACTUALIZACIÓN DE LA VISTA DE RESUMEN ──────────────────
-- Reflejar IVA sobre Utilidad (Ley 1819/2016)

CREATE OR REPLACE VIEW v_resumen_presupuesto AS
SELECT
  b.id AS budget_id,
  b.titulo,
  b.costo_directo,
  -- AIU
  CASE 
    WHEN b.metodo_aiu = 'porcentaje' THEN b.costo_directo * (b.administracion_pct / 100)
    ELSE b.gastos_fijos_mensuales * b.duracion_meses
  END AS administracion,
  b.costo_directo * (b.imprevistos_pct / 100) AS imprevistos,
  b.costo_directo * (b.utilidad_pct / 100) AS utilidad,
  -- Subtotal con AIU
  (b.costo_directo + 
    (CASE WHEN b.metodo_aiu = 'porcentaje' THEN b.costo_directo * (b.administracion_pct / 100) ELSE b.gastos_fijos_mensuales * b.duracion_meses END) +
    (b.costo_directo * (b.imprevistos_pct / 100)) +
    (b.costo_directo * (b.utilidad_pct / 100))
  ) AS subtotal_con_aiu,
  -- IVA SOLO sobre Utilidad (Ley 1819)
  (b.costo_directo * (b.utilidad_pct / 100)) * (b.iva_porcentaje / 100) AS iva,
  -- Total Oferta
  (b.costo_directo + 
    (CASE WHEN b.metodo_aiu = 'porcentaje' THEN b.costo_directo * (b.administracion_pct / 100) ELSE b.gastos_fijos_mensuales * b.duracion_meses END) +
    (b.costo_directo * (b.imprevistos_pct / 100)) +
    (b.costo_directo * (b.utilidad_pct / 100)) +
    ((b.costo_directo * (b.utilidad_pct / 100)) * (b.iva_porcentaje / 100))
  ) AS total_oferta
FROM budgets b;
