-- Agrega campo tipo_persona a profiles
-- Determina el método IVA por defecto al crear presupuestos:
-- 'natural'  → metodo_iva = 'no_aplica'
-- 'juridica' → metodo_iva = 'sobre_utilidad'
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tipo_persona TEXT DEFAULT 'juridica'
  CHECK (tipo_persona IN ('natural', 'juridica'));
