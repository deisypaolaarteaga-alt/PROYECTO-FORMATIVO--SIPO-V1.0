-- ============================================
-- SIPO — Fix: APU Duplicates and Constraints
-- ============================================

-- 1. Eliminar duplicados en la tabla 'apus'
-- Mantenemos solo el registro más reciente para cada activity_id
DELETE FROM apus
WHERE id NOT IN (
  SELECT DISTINCT ON (activity_id) id
  FROM apus
  ORDER BY activity_id, updated_at DESC
);

-- 2. Agregar restricción de unicidad para activity_id
-- Esto evitará que en el futuro se creen múltiples APUs para la misma actividad
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_activity_apu'
    ) THEN
        ALTER TABLE apus ADD CONSTRAINT unique_activity_apu UNIQUE (activity_id);
    END IF;
END $$;

-- 3. Asegurar columnas de costos extendidos en 'apus'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'apus' AND column_name = 'costo_herramienta_menor') THEN
        ALTER TABLE apus ADD COLUMN costo_herramienta_menor NUMERIC DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'apus' AND column_name = 'costo_epp') THEN
        ALTER TABLE apus ADD COLUMN costo_epp NUMERIC DEFAULT 0;
    END IF;
END $$;

-- 4. Actualizar restricción de tipos en 'apu_items'
-- Primero eliminamos la anterior si existe (necesitamos el nombre, suele ser apu_items_tipo_check)
ALTER TABLE apu_items DROP CONSTRAINT IF EXISTS apu_items_tipo_check;
ALTER TABLE apu_items ADD CONSTRAINT apu_items_tipo_check 
CHECK (tipo IN ('material', 'mano_obra', 'equipo', 'herramienta_menor', 'epp'));

-- 5. Opcional: Actualizar el cálculo de costo_total si es una columna generada
-- En Supabase/Postgres, para cambiar una columna GENERATED hay que borrarla y recrearla
DO $$
BEGIN
    -- Intentar borrarla si existe para recrearla con la nueva fórmula
    -- Nota: Si no es generada, este paso fallará si no se maneja bien, pero en el schema.sql original lo es.
    ALTER TABLE apus DROP COLUMN IF EXISTS costo_total;
    ALTER TABLE apus ADD COLUMN costo_total NUMERIC GENERATED ALWAYS AS (
        costo_material + costo_mano_obra + costo_equipo + costo_herramienta_menor + costo_epp
    ) STORED;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'No se pudo actualizar costo_total automáticamente. Verifica el esquema.';
END $$;

-- Fin del script
