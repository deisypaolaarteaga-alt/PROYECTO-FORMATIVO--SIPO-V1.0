-- Strip embedded numeric prefix (e.g. "01. ", "13. ") from catalogo_capitulos.nombre.
-- Idempotent: regexp_replace only changes rows that actually match the pattern.
UPDATE catalogo_capitulos
SET nombre = regexp_replace(nombre, '^\d{2,3}\.\s*', '', 'i')
WHERE nombre ~ '^\d{2,3}\.';

-- Same fix for any existing user chapters that were imported before this fix.
-- Only touches nombres that still carry the embedded prefix.
UPDATE chapters
SET nombre = regexp_replace(nombre, '^\d{2,3}\.\s*', '', 'i')
WHERE nombre ~ '^\d{2,3}\.'
  AND deleted_at IS NULL;
