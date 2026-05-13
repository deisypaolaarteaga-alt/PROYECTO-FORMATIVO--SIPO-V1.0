-- ============================================================
-- SIPO — Eliminar tablas legacy public.users y public.usuarios
-- Estas tablas NUNCA existieron en el schema de aplicación de SIPO.
-- Toda la autenticación usa auth.users (esquema de Supabase Auth).
-- Si existieran en public por alguna migración manual previa, se
-- eliminan aquí. IF EXISTS → no-op si no existen.
-- ============================================================

DROP TABLE IF EXISTS public.usuarios CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
