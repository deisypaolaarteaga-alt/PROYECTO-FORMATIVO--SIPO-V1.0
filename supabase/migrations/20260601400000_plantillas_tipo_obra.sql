-- Agrega tipo_obra a user_plantillas si aún no existe.
-- La columna ya fue incluida en 20260601200000_user_plantillas.sql;
-- esta migración garantiza idempotencia para entornos que aplicaron
-- la tabla sin esa columna (ej: instancias previas al 2026-06-01).
ALTER TABLE user_plantillas ADD COLUMN IF NOT EXISTS tipo_obra TEXT NULL;
