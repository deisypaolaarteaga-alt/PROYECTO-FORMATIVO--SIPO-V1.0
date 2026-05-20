-- ================================================================
-- SIPO — Auditoría de seguridad RLS (2026-05-20)
-- Corrige 5 vulnerabilidades encontradas en el diagnóstico:
--   1. v_resumen_presupuesto sin security_invoker → bypasea RLS
--   2. budgets UPDATE: conflicto de políticas anula bloqueo de aprobados
--   3. budget_snapshots sin política INSERT/DELETE
--   4. cuadrillas: cuadrillas_usuario_crud anula soft-delete
--   5. ai_conversations / ai_usage: políticas duplicadas
-- ================================================================

-- ─── 1. CRÍTICO: Recrear v_resumen_presupuesto con security_invoker ──────────
-- Sin este flag, la vista corre como el owner (postgres = superusuario)
-- y omite RLS en la tabla budgets → cualquier usuario autenticado
-- que consulte la vista directamente ve presupuestos de otros usuarios.
-- Con security_invoker = true, el WHERE de RLS de budgets se aplica
-- con el rol del usuario que hace la consulta (auth.uid()).

DROP VIEW IF EXISTS v_resumen_presupuesto;

CREATE VIEW v_resumen_presupuesto
  WITH (security_invoker = true)
AS
WITH base AS (
  SELECT
    b.id,
    b.titulo,
    b.costo_directo,
    b.metodo_aiu,
    b.administracion_pct,
    b.imprevistos_pct,
    b.utilidad_pct,
    b.gastos_fijos_mensuales,
    b.duracion_meses,
    b.metodo_iva,
    b.iva_porcentaje,
    b.mostrar_retenciones,
    b.retefuente_pct,
    b.ica_pct,
    b.reteiva_pct,
    CASE
      WHEN b.metodo_aiu = 'detallado'
        THEN ROUND(b.gastos_fijos_mensuales * b.duracion_meses, 2)
      ELSE ROUND(b.costo_directo * (b.administracion_pct / 100), 2)
    END AS administracion,
    ROUND(b.costo_directo * (b.imprevistos_pct / 100), 2) AS imprevistos,
    ROUND(b.costo_directo * (b.utilidad_pct   / 100), 2) AS utilidad
  FROM budgets b
  WHERE b.deleted_at IS NULL
),
calcs AS (
  SELECT
    base.*,
    ROUND(base.administracion + base.imprevistos + base.utilidad, 2) AS aiu,
    ROUND(base.costo_directo + base.administracion + base.imprevistos + base.utilidad, 2) AS subtotal_con_aiu
  FROM base
)
SELECT
  c.id                   AS budget_id,
  c.titulo,
  c.costo_directo,
  c.administracion,
  c.imprevistos,
  c.utilidad,
  c.aiu,
  c.subtotal_con_aiu,
  -- IVA según método
  CASE c.metodo_iva
    WHEN 'sobre_utilidad' THEN ROUND(c.utilidad        * (c.iva_porcentaje / 100), 2)
    WHEN 'sobre_aiu'      THEN ROUND(c.aiu             * (c.iva_porcentaje / 100), 2)
    WHEN 'sobre_total'    THEN ROUND(c.subtotal_con_aiu * (c.iva_porcentaje / 100), 2)
    ELSE 0
  END AS iva,
  -- Total oferta = subtotal_con_aiu + IVA
  ROUND(
    c.subtotal_con_aiu + CASE c.metodo_iva
      WHEN 'sobre_utilidad' THEN ROUND(c.utilidad        * (c.iva_porcentaje / 100), 2)
      WHEN 'sobre_aiu'      THEN ROUND(c.aiu             * (c.iva_porcentaje / 100), 2)
      WHEN 'sobre_total'    THEN ROUND(c.subtotal_con_aiu * (c.iva_porcentaje / 100), 2)
      ELSE 0
    END,
    2
  ) AS total_oferta,
  -- Retenciones informativas — base: subtotal_con_aiu (CD + AIU)
  CASE WHEN c.mostrar_retenciones
    THEN ROUND(c.subtotal_con_aiu * (c.retefuente_pct / 100), 2)
    ELSE 0
  END AS retefuente,
  CASE WHEN c.mostrar_retenciones
    THEN ROUND(c.subtotal_con_aiu * (c.ica_pct / 100), 2)
    ELSE 0
  END AS ica,
  CASE WHEN c.mostrar_retenciones THEN
    ROUND(
      (CASE c.metodo_iva
         WHEN 'sobre_utilidad' THEN ROUND(c.utilidad        * (c.iva_porcentaje / 100), 2)
         WHEN 'sobre_aiu'      THEN ROUND(c.aiu             * (c.iva_porcentaje / 100), 2)
         WHEN 'sobre_total'    THEN ROUND(c.subtotal_con_aiu * (c.iva_porcentaje / 100), 2)
         ELSE 0
       END) * (c.reteiva_pct / 100),
      2
    )
  ELSE 0 END AS reteiva
FROM calcs c;

GRANT SELECT ON v_resumen_presupuesto TO authenticated;


-- ─── 2. budgets UPDATE: eliminar política permisiva que anula el bloqueo ─────
-- Con dos políticas PERMISSIVE UPDATE, PostgreSQL las une con OR.
-- budgets_update_own (solo verifica user_id + deleted_at) permitía
-- que cualquier usuario editara sus presupuestos aprobados, ignorando
-- el bloqueo de budgets_update_lock.
-- FIX: eliminar budgets_update_own; budgets_update_lock ya cubre
--      verificación de user_id Y bloqueo por estado 'aprobado'.

DROP POLICY IF EXISTS "budgets_update_own" ON public.budgets;

-- Recrear budgets_update_lock con deleted_at IS NULL (faltaba)
DROP POLICY IF EXISTS "budgets_update_lock" ON public.budgets;
CREATE POLICY "budgets_update_lock"
  ON public.budgets FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND deleted_at IS NULL
    AND (estado <> 'aprobado' OR (auth.jwt() ->> 'role') = 'admin')
  );


-- ─── 3. budget_snapshots: agregar políticas INSERT y DELETE faltantes ────────
-- Solo existía SELECT. Sin INSERT, los snapshots automáticos
-- del trigger fallaban silenciosamente para usuarios autenticados.

DROP POLICY IF EXISTS "budget_snapshots_insert_own" ON public.budget_snapshots;
CREATE POLICY "budget_snapshots_insert_own"
  ON public.budget_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "budget_snapshots_delete_own" ON public.budget_snapshots;
CREATE POLICY "budget_snapshots_delete_own"
  ON public.budget_snapshots FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ─── 4. cuadrillas: eliminar cuadrillas_usuario_crud que anula soft-delete ───
-- cuadrillas_usuario_crud es FOR ALL sin deleted_at IS NULL.
-- Coexiste con cuadrillas_select_own (SELECT + deleted_at).
-- PostgreSQL une políticas PERMISSIVE del mismo comando con OR,
-- por lo que cuadrillas_usuario_crud permitía ver cuadrillas
-- con deleted_at poblado, rompiendo el soft-delete.
-- Las políticas específicas (insert/update/delete/select) ya cubren todo.

DROP POLICY IF EXISTS "cuadrillas_usuario_crud" ON public.cuadrillas;


-- ─── 5. ai_conversations / ai_usage: limpiar políticas duplicadas ─────────────
-- Políticas "Users can ..." se crearon manualmente en el Dashboard
-- y solapan con las migraciones (con_check = null en FOR ALL).
-- Eliminamos las duplicadas; las específicas por comando son correctas.

DROP POLICY IF EXISTS "Users can manage their own conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Users can view their own usage"           ON public.ai_usage;

-- ai_messages: la política FOR ALL con with_check = null no es segura para INSERT
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.ai_messages;

CREATE POLICY "ai_messages_select_own"
  ON public.ai_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_conversations ac
      WHERE ac.id = ai_messages.conversation_id
        AND ac.user_id = auth.uid()
    )
  );

CREATE POLICY "ai_messages_insert_own"
  ON public.ai_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_conversations ac
      WHERE ac.id = ai_messages.conversation_id
        AND ac.user_id = auth.uid()
    )
  );

CREATE POLICY "ai_messages_delete_own"
  ON public.ai_messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_conversations ac
      WHERE ac.id = ai_messages.conversation_id
        AND ac.user_id = auth.uid()
    )
  );
