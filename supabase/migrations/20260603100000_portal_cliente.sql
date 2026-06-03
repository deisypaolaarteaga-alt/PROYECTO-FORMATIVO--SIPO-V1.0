-- ============================================================
-- Portal del Cliente — Fase 1: Infraestructura
-- Tabla presupuesto_tokens + nuevos estados en budgets
-- ============================================================

-- ─── 1. Tabla presupuesto_tokens ────────────────────────────

CREATE TABLE IF NOT EXISTS presupuesto_tokens (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id             UUID        NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  token                 TEXT        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at            TIMESTAMPTZ NOT NULL,
  used_at               TIMESTAMPTZ NULL,
  cliente_email         TEXT        NOT NULL,
  cliente_nombre        TEXT        NULL,
  created_at            TIMESTAMPTZ DEFAULT NOW(),

  -- Respuesta del cliente
  cliente_accion        TEXT        NULL CHECK (cliente_accion IN
                          ('aprobado', 'rechazado', 'comentado')),
  cliente_comentario    TEXT        NULL,
  cliente_firma_nombre  TEXT        NULL,
  cliente_respondio_at  TIMESTAMPTZ NULL,

  -- Tracking de vistas
  visto_at              TIMESTAMPTZ NULL,
  visto_count           INTEGER     DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_presupuesto_tokens_token
  ON presupuesto_tokens(token);

CREATE INDEX IF NOT EXISTS idx_presupuesto_tokens_budget_id
  ON presupuesto_tokens(budget_id);

-- ─── 2. Nuevos estados de presupuesto ───────────────────────
-- Idempotente: elimina la constraint actual y la recrea con los valores extendidos

ALTER TABLE budgets DROP CONSTRAINT IF EXISTS check_budget_estado;
ALTER TABLE budgets ADD CONSTRAINT check_budget_estado
  CHECK (estado IN (
    'borrador',
    'en_revision',
    'aprobado',
    'rechazado',
    'archivado',
    'enviado_a_cliente',
    'visto_por_cliente',
    'aprobado_por_cliente',
    'rechazado_por_cliente',
    'con_observaciones'
  ));

-- ─── 3. RLS en presupuesto_tokens ───────────────────────────

ALTER TABLE presupuesto_tokens ENABLE ROW LEVEL SECURITY;

-- SELECT público: cualquier usuario (con o sin auth) que tenga el token puede leerlo.
-- La seguridad real está en el secreto del token (32 bytes aleatorios).
DROP POLICY IF EXISTS "tokens_public_select" ON presupuesto_tokens;
CREATE POLICY "tokens_public_select"
  ON presupuesto_tokens
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- INSERT/UPDATE: solo service_role (via createAdminClient en Server Actions).
-- service_role omite RLS por diseño de Supabase, así que estas políticas son
-- una documentación explícita del contrato — no cambian el comportamiento.
DROP POLICY IF EXISTS "tokens_service_insert" ON presupuesto_tokens;
CREATE POLICY "tokens_service_insert"
  ON presupuesto_tokens
  FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "tokens_service_update" ON presupuesto_tokens;
CREATE POLICY "tokens_service_update"
  ON presupuesto_tokens
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "tokens_service_delete" ON presupuesto_tokens;
CREATE POLICY "tokens_service_delete"
  ON presupuesto_tokens
  FOR DELETE
  TO service_role
  USING (true);
