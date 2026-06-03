-- ═══════════════════════════════════════════════════════════════════
-- Migración: Eliminar índice único por nombre_razon_social en clientes
-- Fecha: 2026-06-03
-- Motivo: En Colombia es válido que dos clientes distintos (diferente
--         NIT/cédula) tengan el mismo nombre exacto. El índice único
--         bloqueaba casos legítimos.
-- ═══════════════════════════════════════════════════════════════════

DROP INDEX IF EXISTS clientes_nombre_unique;
