-- SIPO Migration: Fix Catalogo APU Prices (Colombia 2026) - REFINED V3
-- Reference: precios de referencia del mercado colombiano 2025, SMMLV Decreto 1572/2024

BEGIN;

-- 1. MATERIALES (Precios Bogotá 2026 + 5% desperdicio)
-- (Ya están bien, pero se repiten para asegurar integridad)
UPDATE catalogo_apu_items SET precio_unitario = 36750 WHERE tipo = 'material' AND (nombre ILIKE '%Cemento%gris%');
UPDATE catalogo_apu_items SET precio_unitario = 5040 WHERE tipo = 'material' AND (nombre ILIKE '%Acero%corrugado%' OR nombre ILIKE '%Hierro%figurado%');
UPDATE catalogo_apu_items SET precio_unitario = 441000 WHERE tipo = 'material' AND (nombre ILIKE '%Concreto%3000%' OR nombre ILIKE '%Concreto%21%MPa%');

-- 2. MANO DE OBRA Y EQUIPOS POR ACTIVIDAD (RENDIMIENTOS REALES)
-- REGLA: Primero aplicamos las actividades más generales y luego las más específicas para evitar colisiones.

-- Concreto General (Estructural)
UPDATE catalogo_apu_items cai
SET precio_unitario = CASE 
  WHEN cai.nombre ILIKE 'Mano de obra%' THEN 35889
  WHEN cai.tipo = 'equipo' AND cai.nombre ILIKE 'Equipo%' THEN 23333
  ELSE precio_unitario END
FROM catalogo_actividades ca WHERE cai.catalogo_actividad_id = ca.id 
AND ca.nombre ILIKE '%Concreto%' AND ca.nombre NOT ILIKE '%Columna%' AND ca.nombre NOT ILIKE '%Viga%';

-- Columnas (específico)
UPDATE catalogo_apu_items cai
SET precio_unitario = CASE 
  WHEN cai.nombre ILIKE 'Mano de obra%' THEN 86133
  WHEN cai.tipo = 'equipo' AND cai.nombre ILIKE 'Equipo%' THEN 38000
  ELSE precio_unitario END
FROM catalogo_actividades ca WHERE cai.catalogo_actividad_id = ca.id AND ca.nombre ILIKE '%Columna%';

-- Vigas (específico)
UPDATE catalogo_apu_items cai
SET precio_unitario = CASE 
  WHEN cai.nombre ILIKE 'Mano de obra%' THEN 71777
  WHEN cai.tipo = 'equipo' AND cai.nombre ILIKE 'Equipo%' THEN 26667
  ELSE precio_unitario END
FROM catalogo_actividades ca WHERE cai.catalogo_actividad_id = ca.id AND ca.nombre ILIKE '%Viga%';

-- Acero de Refuerzo (Solo actividades de acero/hierro puro, no las que lo incluyen)
UPDATE catalogo_apu_items cai
SET precio_unitario = CASE 
  WHEN cai.nombre ILIKE 'Mano de obra%' THEN 1268
  ELSE precio_unitario END
FROM catalogo_actividades ca WHERE cai.catalogo_actividad_id = ca.id 
AND (ca.nombre ILIKE 'Acero%refuerzo%' OR ca.nombre ILIKE 'Hierro%refuerzo%');

-- Mampostería
UPDATE catalogo_apu_items cai
SET precio_unitario = 17945
FROM catalogo_actividades ca WHERE cai.catalogo_actividad_id = ca.id AND cai.nombre ILIKE 'Mano de obra%' AND ca.nombre ILIKE '%Mampostería%bloque%15%';

UPDATE catalogo_apu_items cai
SET precio_unitario = 21533
FROM catalogo_actividades ca WHERE cai.catalogo_actividad_id = ca.id AND cai.nombre ILIKE 'Mano de obra%' AND ca.nombre ILIKE '%Ladrillo%tolete%';

-- Acabados
UPDATE catalogo_apu_items cai
SET precio_unitario = 11963
FROM catalogo_actividades ca WHERE cai.catalogo_actividad_id = ca.id AND cai.nombre ILIKE 'Mano de obra%' AND ca.nombre ILIKE '%Pañete%';

UPDATE catalogo_apu_items cai
SET precio_unitario = 18181
FROM catalogo_actividades ca WHERE cai.catalogo_actividad_id = ca.id AND cai.nombre ILIKE 'Mano de obra%' AND ca.nombre ILIKE '%Piso%cerámica%';

UPDATE catalogo_apu_items cai
SET precio_unitario = 27272
FROM catalogo_actividades ca WHERE cai.catalogo_actividad_id = ca.id AND cai.nombre ILIKE 'Mano de obra%' AND (ca.nombre ILIKE '%Enchape%muro%' OR ca.nombre ILIKE '%Enchape%pared%');

-- Puntos
UPDATE catalogo_apu_items cai SET precio_unitario = 55043 FROM catalogo_actividades ca WHERE cai.catalogo_actividad_id = ca.id AND cai.nombre ILIKE 'Mano de obra%' AND ca.nombre ILIKE '%Punto%hidráulico%';
UPDATE catalogo_apu_items cai SET precio_unitario = 73391 FROM catalogo_actividades ca WHERE cai.catalogo_actividad_id = ca.id AND cai.nombre ILIKE 'Mano de obra%' AND ca.nombre ILIKE '%Punto%sanitario%';
UPDATE catalogo_apu_items cai SET precio_unitario = 44635 FROM catalogo_actividades ca WHERE cai.catalogo_actividad_id = ca.id AND cai.nombre ILIKE 'Mano de obra%' AND ca.nombre ILIKE '%Punto%eléctrico%';

COMMIT;
