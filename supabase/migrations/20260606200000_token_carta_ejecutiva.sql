ALTER TABLE presupuesto_tokens
ADD COLUMN IF NOT EXISTS carta_ejecutiva TEXT DEFAULT NULL;
