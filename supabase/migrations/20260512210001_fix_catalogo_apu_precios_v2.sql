-- SIPO Migration: Fix Catalogo APU Prices (Colombia 2026) - REFINED V2
-- Reference: INVIAS 2025-2, SMMLV Decreto 1572/2024

BEGIN;

-- 1. ACTUALIZACIÓN DE MATERIALES (Precios Bogotá 2026 + 5% desperdicio)
-- Ya verificado que funciona con los nombres genéricos del catálogo.

-- Cemento (35.000 * 1.05 = 36.750)
UPDATE catalogo_apu_items 
SET precio_unitario = 36750 
WHERE tipo = 'material' AND (nombre ILIKE '%Cemento%gris%' OR nombre ILIKE '%Cemento%Argos%' OR nombre ILIKE '%Cemento%Cemex%');

-- Arena río / lavada (55.000 * 1.05 = 57.750)
UPDATE catalogo_apu_items 
SET precio_unitario = 57750 
WHERE tipo = 'material' AND (nombre ILIKE '%Arena%río%' OR nombre ILIKE '%Arena%lavada%' OR nombre ILIKE '%Arena%de%río%');

-- Grava / Triturado (65.000 * 1.05 = 68.250)
UPDATE catalogo_apu_items 
SET precio_unitario = 68250 
WHERE tipo = 'material' AND (nombre ILIKE '%Grava%triturada%' OR nombre ILIKE '%Triturado%' OR nombre ILIKE '%Grava%3/4%');

-- Arena de peña (48.000 * 1.05 = 50.400)
UPDATE catalogo_apu_items 
SET precio_unitario = 50400 
WHERE tipo = 'material' AND nombre ILIKE '%Arena%peña%';

-- Bloques y Ladrillos
UPDATE catalogo_apu_items SET precio_unitario = 2940 WHERE tipo = 'material' AND nombre ILIKE '%Bloque%concreto%15%';
UPDATE catalogo_apu_items SET precio_unitario = 3675 WHERE tipo = 'material' AND nombre ILIKE '%Bloque%concreto%20%';
UPDATE catalogo_apu_items SET precio_unitario = 1208 WHERE tipo = 'material' AND (nombre ILIKE '%Ladrillo%tolete%' OR nombre ILIKE '%Tolete%');

-- Acero y Alambre
UPDATE catalogo_apu_items SET precio_unitario = 5040 WHERE tipo = 'material' AND (nombre ILIKE '%Acero%corrugado%' OR nombre ILIKE '%Hierro%figurado%' OR nombre ILIKE '%Acero%60000%');
UPDATE catalogo_apu_items SET precio_unitario = 5460 WHERE tipo = 'material' AND nombre ILIKE '%Alambre%negro%';
UPDATE catalogo_apu_items SET precio_unitario = 8925 WHERE tipo = 'material' AND nombre ILIKE '%Puntilla%';

-- Madera
UPDATE catalogo_apu_items SET precio_unitario = 3500 WHERE tipo = 'material' AND (nombre ILIKE '%Madera%formaleta%' OR nombre ILIKE '%Tablon%pino%');

-- Concretos Premezclados
UPDATE catalogo_apu_items SET precio_unitario = 441000 WHERE tipo = 'material' AND (nombre ILIKE '%Concreto%3000%' OR nombre ILIKE '%Concreto%21%MPa%');
UPDATE catalogo_apu_items SET precio_unitario = 467250 WHERE tipo = 'material' AND (nombre ILIKE '%Concreto%3500%' OR nombre ILIKE '%Concreto%24.5%MPa%');

-- Tubería y Otros
UPDATE catalogo_apu_items SET precio_unitario = 19425 WHERE tipo = 'material' AND (nombre ILIKE '%PVC%presión%1/2%' OR nombre ILIKE '%Tubería%PVC%1/2%');
UPDATE catalogo_apu_items SET precio_unitario = 54600 WHERE tipo = 'material' AND (nombre ILIKE '%PVC%sanitario%4%' OR nombre ILIKE '%Tubería%sanitaria%4%');
UPDATE catalogo_apu_items SET precio_unitario = 44100 WHERE tipo = 'material' AND (nombre ILIKE '%Pegacor%' OR nombre ILIKE '%Pegante%cerámico%');
UPDATE catalogo_apu_items SET precio_unitario = 29925 WHERE tipo = 'material' AND nombre ILIKE '%Mortero%seco%';
UPDATE catalogo_apu_items SET precio_unitario = 39900 WHERE tipo = 'material' AND (nombre ILIKE '%Sika%1%' OR nombre ILIKE '%Impermeabilizante%');
UPDATE catalogo_apu_items SET precio_unitario = 60900 WHERE tipo = 'material' AND (nombre ILIKE '%Pintura%vinilo%' OR nombre ILIKE '%Vinilo%interior%');


-- 2. ACTUALIZACIÓN DE MANO DE OBRA Y EQUIPOS (RENDIMIENTOS REALES)
-- Se incluyen los nombres genéricos "Mano de obra - [Actividad]" y "Equipo - [Actividad]"

-- Concreto zapatas (6 m3/día) -> MO: 35889, EQ: 23333
UPDATE catalogo_apu_items cai
SET precio_unitario = CASE 
  WHEN cai.nombre ILIKE '%Oficial%' THEN 21193
  WHEN cai.nombre ILIKE '%Ayudante%' THEN 14696
  WHEN cai.nombre ILIKE 'Mano de obra%' THEN 35889
  WHEN cai.tipo = 'equipo' AND cai.nombre ILIKE '%Mezcladora%' THEN 13333
  WHEN cai.tipo = 'equipo' AND cai.nombre ILIKE '%Vibrador%' THEN 10000
  WHEN cai.tipo = 'equipo' AND cai.nombre ILIKE 'Equipo%' THEN 23333
  ELSE precio_unitario END
FROM catalogo_actividades ca WHERE cai.catalogo_actividad_id = ca.id AND ca.nombre ILIKE '%Zapata%';

-- Columnas concreto (2.5 m3/día) -> MO: 86133, EQ: 38000
UPDATE catalogo_apu_items cai
SET precio_unitario = CASE 
  WHEN cai.nombre ILIKE '%Oficial%' THEN 50864
  WHEN cai.nombre ILIKE '%Ayudante%' THEN 35269
  WHEN cai.nombre ILIKE 'Mano de obra%' THEN 86133
  WHEN cai.tipo = 'equipo' AND cai.nombre ILIKE '%Mezcladora%' THEN 32000
  WHEN cai.tipo = 'equipo' AND cai.nombre ILIKE '%Andamio%' THEN 6000
  WHEN cai.tipo = 'equipo' AND cai.nombre ILIKE 'Equipo%' THEN 38000
  ELSE precio_unitario END
FROM catalogo_actividades ca WHERE cai.catalogo_actividad_id = ca.id AND ca.nombre ILIKE '%Columna%';

-- Vigas concreto (3 m3/día) -> MO: 71777, EQ: 26667
UPDATE catalogo_apu_items cai
SET precio_unitario = CASE 
  WHEN cai.nombre ILIKE '%Oficial%' THEN 42386
  WHEN cai.nombre ILIKE '%Ayudante%' THEN 29391
  WHEN cai.nombre ILIKE 'Mano de obra%' THEN 71777
  WHEN cai.tipo = 'equipo' AND cai.nombre ILIKE '%Mezcladora%' THEN 26667
  WHEN cai.tipo = 'equipo' AND cai.nombre ILIKE 'Equipo%' THEN 26667
  ELSE precio_unitario END
FROM catalogo_actividades ca WHERE cai.catalogo_actividad_id = ca.id AND ca.nombre ILIKE '%Viga%';

-- Placa aligerada (18 m2/día) -> MO: 11963
UPDATE catalogo_apu_items cai
SET precio_unitario = CASE 
  WHEN cai.nombre ILIKE '%Oficial%' THEN 7064
  WHEN cai.nombre ILIKE '%Ayudante%' THEN 4899
  WHEN cai.nombre ILIKE 'Mano de obra%' THEN 11963
  ELSE precio_unitario END
FROM catalogo_actividades ca WHERE cai.catalogo_actividad_id = ca.id AND ca.nombre ILIKE '%Placa%aligerada%';

-- Mampostería bloque 15cm (12 m2/día) -> MO: 17945
UPDATE catalogo_apu_items cai
SET precio_unitario = CASE 
  WHEN cai.nombre ILIKE '%Oficial%' THEN 10597
  WHEN cai.nombre ILIKE '%Ayudante%' THEN 7348
  WHEN cai.nombre ILIKE 'Mano de obra%' THEN 17945
  ELSE precio_unitario END
FROM catalogo_actividades ca WHERE cai.catalogo_actividad_id = ca.id AND ca.nombre ILIKE '%Mampostería%bloque%15%';

-- Mampostería ladrillo tolete (10 m2/día) -> MO: 21533
UPDATE catalogo_apu_items cai
SET precio_unitario = CASE 
  WHEN cai.nombre ILIKE '%Oficial%' THEN 12716
  WHEN cai.nombre ILIKE '%Ayudante%' THEN 8817
  WHEN cai.nombre ILIKE 'Mano de obra%' THEN 21533
  ELSE precio_unitario END
FROM catalogo_actividades ca WHERE cai.catalogo_actividad_id = ca.id AND ca.nombre ILIKE '%Ladrillo%tolete%';

-- Pañete liso (18 m2/día) -> MO: 11963
UPDATE catalogo_apu_items cai
SET precio_unitario = CASE 
  WHEN cai.nombre ILIKE '%Oficial%' THEN 7064
  WHEN cai.nombre ILIKE '%Ayudante%' THEN 4899
  WHEN cai.nombre ILIKE 'Mano de obra%' THEN 11963
  ELSE precio_unitario END
FROM catalogo_actividades ca WHERE cai.catalogo_actividad_id = ca.id AND ca.nombre ILIKE '%Pañete%';

-- Acero refuerzo (180 kg/día) -> MO: 1268 (Fierrero 140.000 + Ayudante 88.173) / 180
UPDATE catalogo_apu_items cai
SET precio_unitario = CASE 
  WHEN cai.nombre ILIKE '%Fierrero%' OR cai.nombre ILIKE '%Oficial%' THEN 778
  WHEN cai.nombre ILIKE '%Ayudante%' THEN 490
  WHEN cai.nombre ILIKE 'Mano de obra%' THEN 1268
  ELSE precio_unitario END
FROM catalogo_actividades ca WHERE cai.catalogo_actividad_id = ca.id AND (ca.nombre ILIKE '%Acero%' OR ca.nombre ILIKE '%Hierro%');

-- Piso cerámica (12 m2/día) -> MO: 18181 (Instalador 130.000 + Ayudante 88.173) / 12
UPDATE catalogo_apu_items cai
SET precio_unitario = CASE 
  WHEN cai.nombre ILIKE '%Oficial%' OR cai.nombre ILIKE '%Instalador%' THEN 10833
  WHEN cai.nombre ILIKE '%Ayudante%' THEN 7348
  WHEN cai.nombre ILIKE 'Mano de obra%' THEN 18181
  WHEN cai.tipo = 'equipo' AND cai.nombre ILIKE '%Cortadora%' THEN 3750
  WHEN cai.tipo = 'equipo' AND cai.nombre ILIKE 'Equipo%' THEN 3750
  ELSE precio_unitario END
FROM catalogo_actividades ca WHERE cai.catalogo_actividad_id = ca.id AND ca.nombre ILIKE '%Piso%cerámica%';

-- Enchape muro cerámica (8 m2/día) -> MO: 27272
UPDATE catalogo_apu_items cai
SET precio_unitario = CASE 
  WHEN cai.nombre ILIKE '%Oficial%' OR cai.nombre ILIKE '%Instalador%' THEN 16250
  WHEN cai.nombre ILIKE '%Ayudante%' THEN 11022
  WHEN cai.nombre ILIKE 'Mano de obra%' THEN 27272
  WHEN cai.tipo = 'equipo' AND cai.nombre ILIKE 'Equipo%' THEN 5625
  ELSE precio_unitario END
FROM catalogo_actividades ca WHERE cai.catalogo_actividad_id = ca.id AND (ca.nombre ILIKE '%Enchape%muro%' OR ca.nombre ILIKE '%Enchape%pared%');

-- Punto hidráulico (4 pto/día) -> MO: 55043
UPDATE catalogo_apu_items cai
SET precio_unitario = CASE 
  WHEN cai.nombre ILIKE '%Plomero%' OR cai.nombre ILIKE '%Oficial%' THEN 33000
  WHEN cai.nombre ILIKE '%Ayudante%' THEN 22043
  WHEN cai.nombre ILIKE 'Mano de obra%' THEN 55043
  ELSE precio_unitario END
FROM catalogo_actividades ca WHERE cai.catalogo_actividad_id = ca.id AND ca.nombre ILIKE '%Punto%hidráulico%';

-- Punto sanitario (3 pto/día) -> MO: 73391
UPDATE catalogo_apu_items cai
SET precio_unitario = CASE 
  WHEN cai.nombre ILIKE '%Plomero%' OR cai.nombre ILIKE '%Oficial%' THEN 44000
  WHEN cai.nombre ILIKE '%Ayudante%' THEN 29391
  WHEN cai.nombre ILIKE 'Mano de obra%' THEN 73391
  ELSE precio_unitario END
FROM catalogo_actividades ca WHERE cai.catalogo_actividad_id = ca.id AND ca.nombre ILIKE '%Punto%sanitario%';

-- Punto eléctrico (5 pto/día) -> MO: 44635
UPDATE catalogo_apu_items cai
SET precio_unitario = CASE 
  WHEN cai.nombre ILIKE '%Electricista%' OR cai.nombre ILIKE '%Oficial%' THEN 27000
  WHEN cai.nombre ILIKE '%Ayudante%' THEN 17635
  WHEN cai.nombre ILIKE 'Mano de obra%' THEN 44635
  ELSE precio_unitario END
FROM catalogo_actividades ca WHERE cai.catalogo_actividad_id = ca.id AND ca.nombre ILIKE '%Punto%eléctrico%';

-- Excavación manual (4 m3/día por 2 ayudantes) -> MO: 44087
UPDATE catalogo_apu_items cai
SET precio_unitario = CASE 
  WHEN cai.nombre ILIKE '%Ayudante%' THEN 44087
  WHEN cai.nombre ILIKE 'Mano de obra%' THEN 44087
  ELSE precio_unitario END
FROM catalogo_actividades ca WHERE cai.catalogo_actividad_id = ca.id AND ca.nombre ILIKE '%Excavación%manual%';

-- Estuco y pintura (25 m2/día) -> MO: 8527, EQ: 600
UPDATE catalogo_apu_items cai
SET precio_unitario = CASE 
  WHEN cai.nombre ILIKE '%Pintor%' OR cai.nombre ILIKE '%Oficial%' THEN 5000
  WHEN cai.nombre ILIKE '%Ayudante%' THEN 3527
  WHEN cai.nombre ILIKE 'Mano de obra%' THEN 8527
  WHEN cai.tipo = 'equipo' AND cai.nombre ILIKE '%Andamio%' THEN 600
  WHEN cai.tipo = 'equipo' AND cai.nombre ILIKE 'Equipo%' THEN 600
  ELSE precio_unitario END
FROM catalogo_actividades ca WHERE cai.catalogo_actividad_id = ca.id AND (ca.nombre ILIKE '%Estuco%y%pintura%' OR ca.nombre ILIKE '%Pintura%');

COMMIT;
