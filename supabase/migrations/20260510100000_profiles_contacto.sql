-- Agregar campos de contacto y empresa al perfil
-- Necesarios para el formulario de perfil de empresa y para los PDFs exportados

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS telefono      TEXT,
  ADD COLUMN IF NOT EXISTS direccion     TEXT,
  ADD COLUMN IF NOT EXISTS email_empresa TEXT;

-- Comentarios
COMMENT ON COLUMN profiles.telefono      IS 'Teléfono de contacto de la empresa';
COMMENT ON COLUMN profiles.direccion     IS 'Dirección física de la empresa';
COMMENT ON COLUMN profiles.email_empresa IS 'Correo electrónico de la empresa (puede diferir del correo de auth)';
