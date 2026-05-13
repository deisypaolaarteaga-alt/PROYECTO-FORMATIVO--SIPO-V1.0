-- ============================================================
-- SIPO — Máquina de Estados y Bloqueo de Presupuestos
-- ============================================================

-- 1. Agregar columnas de estado a la tabla 'budgets'
-- Nota: 'borrador' ya existe en el schema base, pero aseguramos el CHECK
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'estado') THEN
        ALTER TABLE budgets ADD COLUMN estado TEXT DEFAULT 'borrador';
    END IF;
    
    -- Agregar columnas adicionales
    ALTER TABLE budgets 
      ADD COLUMN IF NOT EXISTS aprobado_por UUID REFERENCES auth.users(id),
      ADD COLUMN IF NOT EXISTS aprobado_en TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS notas_revision TEXT;
END $$;

-- Aplicar restricción de estados
ALTER TABLE budgets DROP CONSTRAINT IF EXISTS check_budget_estado;
ALTER TABLE budgets ADD CONSTRAINT check_budget_estado 
  CHECK (estado IN ('borrador', 'en_revision', 'aprobado', 'rechazado', 'archivado'));

-- 2. Tabla de Snapshots (Instantáneas de presupuestos aprobados)
CREATE TABLE IF NOT EXISTS budget_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  version INTEGER NOT NULL,
  datos_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE budget_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_snapshots" ON budget_snapshots;
CREATE POLICY "select_own_snapshots" ON budget_snapshots FOR SELECT USING (auth.uid() = user_id);

-- 3. Trigger para control de versiones
CREATE OR REPLACE FUNCTION fn_increment_budget_version()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado = 'aprobado' AND OLD.estado <> 'aprobado' THEN
    NEW.version := OLD.version + 1;
    NEW.aprobado_en := NOW();
    NEW.aprobado_por := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_budget_version ON budgets;
CREATE TRIGGER trg_budget_version BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION fn_increment_budget_version();

-- 4. REFORZAR BLOQUEO DE EDICIÓN EN RLS
-- Bloquear cualquier UPDATE en budgets si ya está aprobado
DROP POLICY IF EXISTS "budgets_update_lock" ON budgets;
CREATE POLICY "budgets_update_lock" ON budgets 
  FOR UPDATE USING (
    auth.uid() = user_id AND 
    (estado <> 'aprobado' OR auth.jwt() ->> 'role' = 'admin')
  );

-- Bloquear borrado (soft delete) si está aprobado (opcional pero recomendado)
-- La política de borrado ya está bloqueada por el rls_audit previo.
