-- ============================================================
-- SIPO — Configuración y Seguridad de IA (Anthropic)
-- ============================================================

-- 1. Agregar configuración de IA al perfil de usuario
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS anthropic_key_enc TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ia_global_enabled BOOLEAN DEFAULT TRUE;

-- 2. Tabla para control de uso y Rate Limiting de IA
CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  consultas_hoy INTEGER DEFAULT 0,
  consultas_mes INTEGER DEFAULT 0,
  ultima_consulta_at TIMESTAMPTZ DEFAULT NOW(),
  total_tokens BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para ai_usage
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ai_usage_select_own" ON ai_usage;
CREATE POLICY "ai_usage_select_own" ON ai_usage FOR SELECT USING (auth.uid() = user_id);

-- 3. Extender ai_conversations para auditoría detallada
-- Si no existen las columnas, las agregamos
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'ai_conversations' AND column_name = 'tiempo_respuesta_ms') THEN
        ALTER TABLE ai_conversations ADD COLUMN tiempo_respuesta_ms INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'ai_conversations' AND column_name = 'modelo') THEN
        ALTER TABLE ai_conversations ADD COLUMN modelo TEXT DEFAULT 'claude-3-5-sonnet';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'ai_conversations' AND column_name = 'costo_estimado') THEN
        ALTER TABLE ai_conversations ADD COLUMN costo_estimado NUMERIC DEFAULT 0;
    END IF;
END $$;

-- 4. Función para resetear contadores diarios (pueblo de Colombia - Medianoche)
CREATE OR REPLACE FUNCTION reset_daily_ai_usage()
RETURNS void AS $$
BEGIN
  UPDATE ai_usage SET consultas_hoy = 0;
END;
$$ LANGUAGE plpgsql;
