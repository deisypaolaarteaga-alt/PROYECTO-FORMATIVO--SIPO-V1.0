-- Corregir el DEFAULT de rol a 'usuario'
ALTER TABLE profiles
ALTER COLUMN rol SET DEFAULT 'usuario';

-- Corregir todos los perfiles que quedaron como super_admin
-- excepto el de Deisy (identificado por su email)
UPDATE profiles
SET rol = 'usuario'
WHERE rol = 'super_admin'
AND id != (
  SELECT au.id FROM auth.users au
  WHERE au.email = 'deisypaolaarteaga@gmail.com'
);
