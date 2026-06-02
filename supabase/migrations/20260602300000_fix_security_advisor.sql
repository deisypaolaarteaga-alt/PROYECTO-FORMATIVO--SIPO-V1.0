-- ============================================================
-- Fix Security Advisor: Security Definer Views + schema_migrations RLS
-- ============================================================

-- PROBLEMA 1: Recrear las 4 vistas con security_invoker = true
-- Sin este flag las vistas corren como el owner (postgres = superusuario)
-- y omiten RLS, exponiendo datos de otros usuarios.

DROP VIEW IF EXISTS public.v_projects_activos;
CREATE VIEW public.v_projects_activos
  WITH (security_invoker = true)
  AS
  SELECT id,
    user_id,
    nombre,
    descripcion,
    ubicacion,
    area_m2,
    tipo_obra,
    cliente_nombre,
    cliente_email,
    cliente_telefono,
    estado,
    created_at,
    updated_at,
    deleted_at
  FROM projects
  WHERE deleted_at IS NULL;

DROP VIEW IF EXISTS public.v_budgets_activos;
CREATE VIEW public.v_budgets_activos
  WITH (security_invoker = true)
  AS
  SELECT id,
    project_id,
    user_id,
    titulo,
    numero_presupuesto,
    descripcion,
    estado,
    valor_total,
    aiu_porcentaje,
    iva_porcentaje,
    moneda,
    created_at,
    updated_at,
    deleted_at,
    aprobado_por,
    aprobado_en,
    version,
    notas_revision
  FROM budgets
  WHERE deleted_at IS NULL;

DROP VIEW IF EXISTS public.v_activities_activos;
CREATE VIEW public.v_activities_activos
  WITH (security_invoker = true)
  AS
  SELECT id,
    chapter_id,
    budget_id,
    user_id,
    nombre,
    descripcion,
    unidad,
    cantidad,
    precio_unitario,
    subtotal,
    numero,
    created_at,
    updated_at,
    deleted_at
  FROM activities
  WHERE deleted_at IS NULL;

DROP VIEW IF EXISTS public.v_chapters_activos;
CREATE VIEW public.v_chapters_activos
  WITH (security_invoker = true)
  AS
  SELECT id,
    budget_id,
    user_id,
    nombre,
    descripcion,
    numero,
    valor_subtotal,
    created_at,
    updated_at,
    deleted_at
  FROM chapters
  WHERE deleted_at IS NULL;

-- PROBLEMA 2: Activar RLS en schema_migrations
-- Es una tabla interna del sistema de migraciones, no contiene datos
-- de usuarios, pero Supabase Security Advisor la marca si no tiene RLS.

ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "schema_migrations_service_role_only"
  ON public.schema_migrations;

CREATE POLICY "schema_migrations_service_role_only"
  ON public.schema_migrations
  FOR ALL
  USING (auth.role() = 'service_role');
