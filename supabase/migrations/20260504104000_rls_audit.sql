-- ============================================================
-- SIPO — Auditoría de Seguridad, RLS y Soft Deletes
-- ============================================================

-- 1. Agregar columna deleted_at para Soft Delete (todas las tablas del loop RLS)
ALTER TABLE projects              ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE budgets               ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE chapters              ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE activities            ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE apus                  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE apu_items             ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
-- cuadrillas / cuadrilla_trabajadores existen si la migración de cuadrillas fue aplicada
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cuadrillas') THEN
    EXECUTE 'ALTER TABLE cuadrillas ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cuadrilla_trabajadores') THEN
    EXECUTE 'ALTER TABLE cuadrilla_trabajadores ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL';
  END IF;
END $$;

-- 2. Vistas para registros activos
CREATE OR REPLACE VIEW v_projects_activos AS SELECT * FROM projects WHERE deleted_at IS NULL;
CREATE OR REPLACE VIEW v_budgets_activos AS SELECT * FROM budgets WHERE deleted_at IS NULL;
CREATE OR REPLACE VIEW v_chapters_activos AS SELECT * FROM chapters WHERE deleted_at IS NULL;
CREATE OR REPLACE VIEW v_activities_activos AS SELECT * FROM activities WHERE deleted_at IS NULL;

-- 3. Tabla de Auditoría
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tabla TEXT NOT NULL,
  operacion TEXT NOT NULL,
  registro_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id),
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en audit_log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_log_select_own" ON audit_log;
CREATE POLICY "audit_log_select_own" ON audit_log FOR SELECT USING (auth.uid() = user_id);

-- Función para el trigger de auditoría
CREATE OR REPLACE FUNCTION fn_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO audit_log (tabla, operacion, registro_id, user_id, datos_anteriores, datos_nuevos)
    VALUES (
      TG_TABLE_NAME,
      TG_OP,
      COALESCE(NEW.id, OLD.id),
      auth.uid(),
      CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
      CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
  EXCEPTION WHEN OTHERS THEN
    -- No romper la transacción principal si falla la auditoría
    RETURN COALESCE(NEW, OLD);
  END;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers de auditoría
DROP TRIGGER IF EXISTS trg_audit_budgets ON budgets;
CREATE TRIGGER trg_audit_budgets AFTER INSERT OR UPDATE OR DELETE ON budgets FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_apu_items ON apu_items;
CREATE TRIGGER trg_audit_apu_items AFTER INSERT OR UPDATE OR DELETE ON apu_items FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

-- 4. REFORZAR RLS EN TABLAS CON user_id
-- Solo aplica a tablas que tienen columna user_id
DO $$
DECLARE
    tbl_name TEXT;
    has_deleted_at BOOLEAN;
BEGIN
    FOR tbl_name IN SELECT unnest(ARRAY['projects', 'budgets', 'chapters', 'activities', 'apus', 'apu_items', 'cuadrillas']) LOOP

        -- Verificar si la tabla existe y tiene user_id
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = tbl_name AND column_name = 'user_id'
        ) THEN
            CONTINUE;
        END IF;

        -- Verificar si tiene deleted_at
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = tbl_name AND column_name = 'deleted_at'
        ) INTO has_deleted_at;

        -- Borrar políticas previas
        EXECUTE format('DROP POLICY IF EXISTS "%s_select_own" ON %I', tbl_name, tbl_name);
        EXECUTE format('DROP POLICY IF EXISTS "%s_insert_own" ON %I', tbl_name, tbl_name);
        EXECUTE format('DROP POLICY IF EXISTS "%s_update_own" ON %I', tbl_name, tbl_name);
        EXECUTE format('DROP POLICY IF EXISTS "%s_delete_own" ON %I', tbl_name, tbl_name);

        IF has_deleted_at THEN
            EXECUTE format('CREATE POLICY "%s_select_own" ON %I FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL)', tbl_name, tbl_name);
            EXECUTE format('CREATE POLICY "%s_update_own" ON %I FOR UPDATE USING (auth.uid() = user_id AND deleted_at IS NULL)', tbl_name, tbl_name);
        ELSE
            EXECUTE format('CREATE POLICY "%s_select_own" ON %I FOR SELECT USING (auth.uid() = user_id)', tbl_name, tbl_name);
            EXECUTE format('CREATE POLICY "%s_update_own" ON %I FOR UPDATE USING (auth.uid() = user_id)', tbl_name, tbl_name);
        END IF;

        EXECUTE format('CREATE POLICY "%s_insert_own" ON %I FOR INSERT WITH CHECK (auth.uid() = user_id)', tbl_name, tbl_name);
        EXECUTE format('CREATE POLICY "%s_delete_own" ON %I FOR DELETE USING (false)', tbl_name, tbl_name);

    END LOOP;
END $$;

-- Política especial para insumos (lectura pública, no borrado)
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "materials_select_all" ON materials;
CREATE POLICY "materials_select_all" ON materials FOR SELECT USING (true);
