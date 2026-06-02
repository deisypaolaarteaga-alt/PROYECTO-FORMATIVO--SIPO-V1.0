-- ============================================================
-- Flujo de eliminación y archivado de proyectos y presupuestos
-- Idempotente: seguro de re-ejecutar
-- ============================================================

-- projects ya tiene deleted_at desde 20260504104000_rls_audit.sql
-- La siguiente línea es idempotente si la columna ya existe.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

-- ============================================================
-- fn_archivar_proyecto
-- Archiva un proyecto y sus presupuestos no aprobados.
-- Lanza excepción si hay presupuestos en estado aprobado o en_revision.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_archivar_proyecto(p_project_id UUID, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar ownership
  IF NOT EXISTS (
    SELECT 1 FROM projects
    WHERE id = p_project_id
      AND user_id = p_user_id
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Proyecto no encontrado o no tienes permisos para modificarlo.';
  END IF;

  -- Verificar que no haya presupuestos bloqueantes
  IF EXISTS (
    SELECT 1 FROM budgets
    WHERE project_id = p_project_id
      AND estado IN ('aprobado', 'en_revision')
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Tienes presupuestos aprobados o en revisión. Archívalos o espera su resolución antes de archivar el proyecto.';
  END IF;

  -- Archivar proyecto
  UPDATE projects
  SET estado = 'archivado', updated_at = NOW()
  WHERE id = p_project_id;

  -- Archivar presupuestos activos (borrador, rechazado) — los ya archivados quedan igual
  UPDATE budgets
  SET estado = 'archivado'
  WHERE project_id = p_project_id
    AND estado NOT IN ('aprobado', 'archivado')
    AND deleted_at IS NULL;
END;
$$;

-- ============================================================
-- fn_eliminar_proyecto
-- Soft-delete de un proyecto y sus presupuestos.
-- Solo permite eliminar proyectos en estado borrador o archivado
-- sin presupuestos aprobados/en_revision activos.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_eliminar_proyecto(p_project_id UUID, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_estado TEXT;
BEGIN
  -- Verificar ownership y obtener estado
  SELECT estado INTO v_estado
  FROM projects
  WHERE id = p_project_id
    AND user_id = p_user_id
    AND deleted_at IS NULL;

  IF v_estado IS NULL THEN
    RAISE EXCEPTION 'Proyecto no encontrado o no tienes permisos para eliminarlo.';
  END IF;

  -- Verificar estado permitido
  IF v_estado NOT IN ('borrador', 'archivado') THEN
    RAISE EXCEPTION 'Solo puedes eliminar proyectos en estado borrador o archivado. Estado actual: %', v_estado;
  END IF;

  -- Verificar que no haya presupuestos bloqueantes
  IF EXISTS (
    SELECT 1 FROM budgets
    WHERE project_id = p_project_id
      AND estado IN ('aprobado', 'en_revision')
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'El proyecto tiene presupuestos aprobados o en revisión. No se puede eliminar hasta que sean archivados o resueltos.';
  END IF;

  -- Soft-delete en cascada: todos los presupuestos activos del proyecto
  UPDATE budgets
  SET deleted_at = NOW()
  WHERE project_id = p_project_id
    AND deleted_at IS NULL;

  -- Soft-delete del proyecto
  UPDATE projects
  SET deleted_at = NOW(), updated_at = NOW()
  WHERE id = p_project_id;
END;
$$;

-- Permisos: las funciones SECURITY DEFINER corren como el owner (postgres).
-- Cualquier usuario autenticado puede invocarlas vía RPC; la verificación
-- de ownership está dentro de cada función.
GRANT EXECUTE ON FUNCTION fn_archivar_proyecto(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION fn_eliminar_proyecto(UUID, UUID)  TO authenticated;
