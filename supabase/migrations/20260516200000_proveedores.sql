-- Tabla proveedores
CREATE TABLE IF NOT EXISTS proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Tipo de persona
  tipo TEXT NOT NULL DEFAULT 'empresa'
    CHECK (tipo IN ('persona', 'empresa')),

  -- Datos principales
  nombre_razon_social TEXT NOT NULL,
  nit_cedula          TEXT,

  -- Categoría de proveedor (construcción colombiana)
  categoria TEXT NOT NULL DEFAULT 'otro'
    CHECK (categoria IN (
      'ferreteria',
      'contratista',
      'equipos',
      'laboratorio',
      'transporte',
      'servicios',
      'otro'
    )),

  -- Contacto y ubicación
  ciudad    TEXT,
  email     TEXT,
  telefono  TEXT,
  sitio_web TEXT,
  notas     TEXT,

  -- Control (soft-delete con deleted_at, igual que rls_audit.sql)
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_proveedores_user_id
  ON proveedores(user_id);
CREATE INDEX IF NOT EXISTS idx_proveedores_nombre
  ON proveedores(nombre_razon_social);
CREATE INDEX IF NOT EXISTS idx_proveedores_activos
  ON proveedores(user_id) WHERE deleted_at IS NULL;

-- RLS (mismo patrón que clientes)
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "proveedores_owner" ON proveedores;
CREATE POLICY "proveedores_owner" ON proveedores
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_proveedores_updated_at ON proveedores;
CREATE TRIGGER trg_proveedores_updated_at
  BEFORE UPDATE ON proveedores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- FK futura: proveedor_id en apu_items (nullable, sin funcionalidad por ahora)
ALTER TABLE apu_items
  ADD COLUMN IF NOT EXISTS proveedor_id UUID
    REFERENCES proveedores(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_apu_items_proveedor_id
  ON apu_items(proveedor_id);
