-- ============================================================
-- SIPO — Ítems de APU de referencia por actividad de catálogo
-- Permite precargar el APU automáticamente al importar
-- actividades desde el catálogo base.
-- ============================================================

CREATE TABLE IF NOT EXISTS catalogo_apu_items (
  id                    UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  catalogo_actividad_id UUID          NOT NULL REFERENCES catalogo_actividades(id) ON DELETE CASCADE,
  tipo                  TEXT          NOT NULL
    CHECK (tipo IN ('material','mano_obra','equipo','herramienta_menor','epp')),
  nombre                TEXT          NOT NULL,
  descripcion           TEXT,
  unidad                TEXT          NOT NULL,
  -- cantidad y precio expresados POR UNIDAD de la actividad (rendimiento=1)
  cantidad              NUMERIC(14,4) NOT NULL DEFAULT 1,
  precio_unitario       NUMERIC(14,2) NOT NULL DEFAULT 0,
  orden                 INTEGER       NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_catalogo_apu_items_actividad
  ON catalogo_apu_items(catalogo_actividad_id);

CREATE INDEX IF NOT EXISTS idx_catalogo_apu_items_tipo
  ON catalogo_apu_items(tipo);

ALTER TABLE catalogo_apu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "catalogo_apu_items_select_all" ON catalogo_apu_items;
CREATE POLICY "catalogo_apu_items_select_all" ON catalogo_apu_items
  FOR SELECT USING (true);
