-- Tabla clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Tipo
  tipo TEXT NOT NULL DEFAULT 'empresa' 
    CHECK (tipo IN ('persona_natural', 'empresa')),
  
  -- Datos principales
  nombre_razon_social TEXT NOT NULL,
  nit_cedula TEXT,
  
  -- Contacto
  nombre_contacto TEXT,        -- quien firma
  cargo_contacto TEXT,         -- cargo del contacto
  telefono TEXT,
  email TEXT,
  
  -- Ubicación
  ciudad TEXT,
  departamento TEXT,
  direccion TEXT,
  
  -- Control
  activo BOOLEAN DEFAULT TRUE,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre_razon_social);

-- RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clientes_owner" ON clientes;
CREATE POLICY "clientes_owner" ON clientes
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_clientes_updated_at ON clientes;
CREATE TRIGGER trg_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Agregar cliente_id a projects
ALTER TABLE projects 
  ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_cliente_id ON projects(cliente_id);
