-- Marca los ítems de APU que fueron sugeridos por IA para trazabilidad
ALTER TABLE apu_items
  ADD COLUMN IF NOT EXISTS origen_ia BOOLEAN DEFAULT false;
