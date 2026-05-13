ALTER TABLE apu_items ADD COLUMN IF NOT EXISTS cuadrilla_id UUID REFERENCES cuadrillas(id) ON DELETE SET NULL;
ALTER TABLE apu_items ADD COLUMN IF NOT EXISTS precio_editado_manual BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN apu_items.cuadrilla_id IS 'Vinculación opcional a una cuadrilla para recalcular precios automáticamente';
COMMENT ON COLUMN apu_items.precio_editado_manual IS 'Indica si el usuario modificó el precio unitario manualmente, rompiendo la sincronización automática con la cuadrilla';
