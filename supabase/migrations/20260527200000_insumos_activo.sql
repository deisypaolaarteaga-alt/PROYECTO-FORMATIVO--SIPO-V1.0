-- Agrega campo activo a las tablas de precios personalizados de materiales y equipos.
-- Permite inhabilitar/habilitar ítems sin eliminar la personalización.
-- Los ítems inactivos no aparecen en el buscador del Panel APU.

-- precio_unitario puede ser NULL cuando el usuario solo cambió el estado activo
-- (sin personalizar precio). La CHECK constraint sigue válida (NULL pasa CHECK).
ALTER TABLE user_material_precios
  ALTER COLUMN precio_unitario DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true;

-- precio_diario puede ser NULL por la misma razón.
ALTER TABLE user_equipment_precios
  ALTER COLUMN precio_diario DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true;
