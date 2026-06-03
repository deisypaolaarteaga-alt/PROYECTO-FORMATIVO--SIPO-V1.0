-- ═══════════════════════════════════════════════════════════════════
-- Migración: Unicidad de clientes por usuario
-- Fecha: 2026-06-03
-- Objetivo:
--   1. Limpiar duplicados existentes (conservar el de menor id)
--   2. Crear índices únicos parciales (solo activos, solo si el campo no es NULL)
-- Nota: la tabla clientes usa activo BOOLEAN (no deleted_at) para soft-delete
-- ═══════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────
-- 1. Limpiar duplicados por nit_cedula (mismo user_id, activo = true)
-- ──────────────────────────────────────────────────────────────────
WITH duplicados_nit AS (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY user_id, nit_cedula ORDER BY id) AS rn
    FROM clientes
    WHERE nit_cedula IS NOT NULL AND activo = true
  ) t
  WHERE rn > 1
)
DELETE FROM clientes
WHERE id IN (SELECT id FROM duplicados_nit);

-- ──────────────────────────────────────────────────────────────────
-- 2. Limpiar duplicados por email (mismo user_id, activo = true)
-- ──────────────────────────────────────────────────────────────────
WITH duplicados_email AS (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY user_id, email ORDER BY id) AS rn
    FROM clientes
    WHERE email IS NOT NULL AND activo = true
  ) t
  WHERE rn > 1
)
DELETE FROM clientes
WHERE id IN (SELECT id FROM duplicados_email);

-- ──────────────────────────────────────────────────────────────────
-- 3. Limpiar duplicados por nombre_razon_social exacto (mismo user_id, activo = true)
-- ──────────────────────────────────────────────────────────────────
WITH duplicados_nombre AS (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY user_id, nombre_razon_social ORDER BY id) AS rn
    FROM clientes
    WHERE activo = true
  ) t
  WHERE rn > 1
)
DELETE FROM clientes
WHERE id IN (SELECT id FROM duplicados_nombre);

-- ──────────────────────────────────────────────────────────────────
-- 4. Índices únicos parciales
--    - Solo aplican donde activo = true (registros vigentes)
--    - nit_cedula y email: solo cuando el campo no es NULL
-- ──────────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS
  clientes_nit_unique ON clientes(user_id, nit_cedula)
  WHERE nit_cedula IS NOT NULL AND activo = true;

CREATE UNIQUE INDEX IF NOT EXISTS
  clientes_email_unique ON clientes(user_id, email)
  WHERE email IS NOT NULL AND activo = true;

CREATE UNIQUE INDEX IF NOT EXISTS
  clientes_nombre_unique ON clientes(user_id, nombre_razon_social)
  WHERE activo = true;
