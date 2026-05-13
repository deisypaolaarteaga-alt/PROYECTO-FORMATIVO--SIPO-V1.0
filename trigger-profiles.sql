-- ============================================
-- SIPO — Trigger y políticas adicionales
-- ============================================
-- Ejecutar en la consola SQL de Supabase
-- DESPUÉS de ejecutar schema.sql
-- ============================================

-- ============ Agregar campo telefono si no existe ============
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telefono TEXT;

-- ============ TRIGGER: Crear perfil automáticamente ============
-- Cuando un usuario se registra en auth.users,
-- se crea un registro en profiles con sus datos básicos

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nombre_completo, empresa, ciudad)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre_completo', ''),
    NEW.raw_user_meta_data->>'empresa',
    NEW.raw_user_meta_data->>'ciudad'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Crear el trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ BUCKET DE STORAGE: logotipos ============
-- Crear bucket para logos de empresas
-- NOTA: Esto se hace desde el dashboard de Supabase > Storage > New Bucket
-- Nombre: logotipos
-- Público: Sí
-- Tamaño máximo: 2MB
-- Tipos permitidos: image/jpeg, image/png, image/webp

-- Política de Storage: usuarios pueden subir su propio logo
-- Ejecutar en SQL Editor:
/*
CREATE POLICY "Users can upload own logo" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'logotipos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own logo" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'logotipos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'logotipos');
*/
