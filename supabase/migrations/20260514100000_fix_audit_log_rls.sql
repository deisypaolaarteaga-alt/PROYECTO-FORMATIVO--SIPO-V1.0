-- SIPO Security: Agregar política INSERT a audit_log
-- Sin esta política, los INSERT directos desde Server Actions (createClient con JWT de usuario)
-- eran bloqueados por RLS, ya que solo existía la política FOR SELECT.

-- Política que permite a cada usuario insertar únicamente registros con su propio user_id.
-- WITH CHECK garantiza que nadie puede insertar filas con un user_id ajeno.
DROP POLICY IF EXISTS "audit_log_insert_own" ON audit_log;
CREATE POLICY "audit_log_insert_own" ON audit_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
