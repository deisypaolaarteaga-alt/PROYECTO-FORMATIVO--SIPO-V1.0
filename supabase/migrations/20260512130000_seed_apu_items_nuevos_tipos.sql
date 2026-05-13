-- ============================================================
-- SIPO — APU items de referencia para institucional, industrial y hotelero
-- Cubre 9 actividades clave por tipo de obra
-- Idempotente: usa WHERE NOT EXISTS por (catalogo_actividad_id, nombre)
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- 1. CONCRETO ZAPATAS 3000 PSI
-- ════════════════════════════════════════════════════════════

-- INS-02-002 institucional
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Concreto premezclado 3000 PSI','m³',1.05,420000,1 FROM catalogo_actividades ca WHERE ca.codigo='INS-02-002' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Concreto premezclado 3000 PSI');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Acero de refuerzo fy=420 MPa','kg',80,3800,2 FROM catalogo_actividades ca WHERE ca.codigo='INS-02-002' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Acero de refuerzo fy=420 MPa');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Alambre negro #18','kg',2.0,5200,3 FROM catalogo_actividades ca WHERE ca.codigo='INS-02-002' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Alambre negro #18');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Formaleta madera','m²',4.0,15000,4 FROM catalogo_actividades ca WHERE ca.codigo='INS-02-002' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Formaleta madera');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Oficial maestro de obra','jor',0.8,75000,5 FROM catalogo_actividades ca WHERE ca.codigo='INS-02-002' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Oficial maestro de obra');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Ayudante','jor',1.5,55000,6 FROM catalogo_actividades ca WHERE ca.codigo='INS-02-002' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Ayudante');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'equipo','Vibrador de concreto','h',2.0,18000,7 FROM catalogo_actividades ca WHERE ca.codigo='INS-02-002' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Vibrador de concreto');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'herramienta_menor','Herramienta menor (5% MO)','glb',1.0,6500,8 FROM catalogo_actividades ca WHERE ca.codigo='INS-02-002' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Herramienta menor (5% MO)');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'epp','Elementos de protección personal','glb',1.0,8000,9 FROM catalogo_actividades ca WHERE ca.codigo='INS-02-002' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Elementos de protección personal');

-- HOT-02-002 hotelero
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Concreto premezclado 3000 PSI','m³',1.05,420000,1 FROM catalogo_actividades ca WHERE ca.codigo='HOT-02-002' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Concreto premezclado 3000 PSI');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Acero de refuerzo fy=420 MPa','kg',80,3800,2 FROM catalogo_actividades ca WHERE ca.codigo='HOT-02-002' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Acero de refuerzo fy=420 MPa');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Alambre negro #18','kg',2.0,5200,3 FROM catalogo_actividades ca WHERE ca.codigo='HOT-02-002' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Alambre negro #18');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Formaleta madera','m²',4.0,15000,4 FROM catalogo_actividades ca WHERE ca.codigo='HOT-02-002' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Formaleta madera');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Oficial maestro de obra','jor',0.8,75000,5 FROM catalogo_actividades ca WHERE ca.codigo='HOT-02-002' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Oficial maestro de obra');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Ayudante','jor',1.5,55000,6 FROM catalogo_actividades ca WHERE ca.codigo='HOT-02-002' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Ayudante');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'equipo','Vibrador de concreto','h',2.0,18000,7 FROM catalogo_actividades ca WHERE ca.codigo='HOT-02-002' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Vibrador de concreto');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'herramienta_menor','Herramienta menor (5% MO)','glb',1.0,6500,8 FROM catalogo_actividades ca WHERE ca.codigo='HOT-02-002' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Herramienta menor (5% MO)');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'epp','Elementos de protección personal','glb',1.0,8000,9 FROM catalogo_actividades ca WHERE ca.codigo='HOT-02-002' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Elementos de protección personal');

-- IND-02-001 industrial (dado de cimentación concreto 3000 PSI)
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Concreto premezclado 3000 PSI','m³',1.05,420000,1 FROM catalogo_actividades ca WHERE ca.codigo='IND-02-001' AND ca.tipo_obra='industrial' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Concreto premezclado 3000 PSI');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Acero de refuerzo fy=420 MPa','kg',95,3800,2 FROM catalogo_actividades ca WHERE ca.codigo='IND-02-001' AND ca.tipo_obra='industrial' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Acero de refuerzo fy=420 MPa');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Alambre negro #18','kg',2.5,5200,3 FROM catalogo_actividades ca WHERE ca.codigo='IND-02-001' AND ca.tipo_obra='industrial' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Alambre negro #18');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Formaleta metálica','m²',5.0,12000,4 FROM catalogo_actividades ca WHERE ca.codigo='IND-02-001' AND ca.tipo_obra='industrial' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Formaleta metálica');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Oficial maestro de obra','jor',1.0,75000,5 FROM catalogo_actividades ca WHERE ca.codigo='IND-02-001' AND ca.tipo_obra='industrial' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Oficial maestro de obra');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Ayudante','jor',2.0,55000,6 FROM catalogo_actividades ca WHERE ca.codigo='IND-02-001' AND ca.tipo_obra='industrial' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Ayudante');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'equipo','Vibrador de concreto','h',2.5,18000,7 FROM catalogo_actividades ca WHERE ca.codigo='IND-02-001' AND ca.tipo_obra='industrial' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Vibrador de concreto');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'herramienta_menor','Herramienta menor (5% MO)','glb',1.0,7250,8 FROM catalogo_actividades ca WHERE ca.codigo='IND-02-001' AND ca.tipo_obra='industrial' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Herramienta menor (5% MO)');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'epp','Elementos de protección personal','glb',1.0,8000,9 FROM catalogo_actividades ca WHERE ca.codigo='IND-02-001' AND ca.tipo_obra='industrial' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Elementos de protección personal');

-- ════════════════════════════════════════════════════════════
-- 2. COLUMNAS CONCRETO 3000 PSI INC. FORMALETA
-- ════════════════════════════════════════════════════════════

-- INS-02-004
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Concreto premezclado 3000 PSI','m³',1.05,420000,1 FROM catalogo_actividades ca WHERE ca.codigo='INS-02-004' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Concreto premezclado 3000 PSI');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Acero de refuerzo fy=420 MPa','kg',150,3800,2 FROM catalogo_actividades ca WHERE ca.codigo='INS-02-004' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Acero de refuerzo fy=420 MPa');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Alambre negro #18','kg',3.0,5200,3 FROM catalogo_actividades ca WHERE ca.codigo='INS-02-004' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Alambre negro #18');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Formaleta metálica columnas (alquiler)','m²',8.0,12000,4 FROM catalogo_actividades ca WHERE ca.codigo='INS-02-004' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Formaleta metálica columnas (alquiler)');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Desmoldante','l',0.5,18000,5 FROM catalogo_actividades ca WHERE ca.codigo='INS-02-004' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Desmoldante');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Oficial maestro de obra','jor',1.5,75000,6 FROM catalogo_actividades ca WHERE ca.codigo='INS-02-004' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Oficial maestro de obra');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Ayudante','jor',3.0,55000,7 FROM catalogo_actividades ca WHERE ca.codigo='INS-02-004' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Ayudante');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'equipo','Vibrador de concreto','h',3.0,18000,8 FROM catalogo_actividades ca WHERE ca.codigo='INS-02-004' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Vibrador de concreto');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'herramienta_menor','Herramienta menor (5% MO)','glb',1.0,9750,9 FROM catalogo_actividades ca WHERE ca.codigo='INS-02-004' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Herramienta menor (5% MO)');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'epp','Elementos de protección personal','glb',1.0,8000,10 FROM catalogo_actividades ca WHERE ca.codigo='INS-02-004' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Elementos de protección personal');

-- HOT-02-004
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Concreto premezclado 3000 PSI','m³',1.05,420000,1 FROM catalogo_actividades ca WHERE ca.codigo='HOT-02-004' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Concreto premezclado 3000 PSI');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Acero de refuerzo fy=420 MPa','kg',150,3800,2 FROM catalogo_actividades ca WHERE ca.codigo='HOT-02-004' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Acero de refuerzo fy=420 MPa');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Alambre negro #18','kg',3.0,5200,3 FROM catalogo_actividades ca WHERE ca.codigo='HOT-02-004' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Alambre negro #18');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Formaleta metálica columnas (alquiler)','m²',8.0,12000,4 FROM catalogo_actividades ca WHERE ca.codigo='HOT-02-004' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Formaleta metálica columnas (alquiler)');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Desmoldante','l',0.5,18000,5 FROM catalogo_actividades ca WHERE ca.codigo='HOT-02-004' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Desmoldante');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Oficial maestro de obra','jor',1.5,75000,6 FROM catalogo_actividades ca WHERE ca.codigo='HOT-02-004' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Oficial maestro de obra');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Ayudante','jor',3.0,55000,7 FROM catalogo_actividades ca WHERE ca.codigo='HOT-02-004' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Ayudante');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'equipo','Vibrador de concreto','h',3.0,18000,8 FROM catalogo_actividades ca WHERE ca.codigo='HOT-02-004' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Vibrador de concreto');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'herramienta_menor','Herramienta menor (5% MO)','glb',1.0,9750,9 FROM catalogo_actividades ca WHERE ca.codigo='HOT-02-004' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Herramienta menor (5% MO)');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'epp','Elementos de protección personal','glb',1.0,8000,10 FROM catalogo_actividades ca WHERE ca.codigo='HOT-02-004' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Elementos de protección personal');

-- ════════════════════════════════════════════════════════════
-- 3. MURO BLOQUE CONCRETO
-- ════════════════════════════════════════════════════════════

-- INS-03-001 muro bloque 15cm
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Bloque concreto 15x20x40','und',12.5,2800,1 FROM catalogo_actividades ca WHERE ca.codigo='INS-03-001' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Bloque concreto 15x20x40');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Mortero de pega 1:4','m³',0.015,480000,2 FROM catalogo_actividades ca WHERE ca.codigo='INS-03-001' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Mortero de pega 1:4');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Cemento gris (para resanes)','kg',6.5,720,3 FROM catalogo_actividades ca WHERE ca.codigo='INS-03-001' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Cemento gris (para resanes)');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Oficial albañil','jor',0.25,75000,4 FROM catalogo_actividades ca WHERE ca.codigo='INS-03-001' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Oficial albañil');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Ayudante','jor',0.5,55000,5 FROM catalogo_actividades ca WHERE ca.codigo='INS-03-001' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Ayudante');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'herramienta_menor','Herramienta menor (5% MO)','glb',1.0,2188,6 FROM catalogo_actividades ca WHERE ca.codigo='INS-03-001' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Herramienta menor (5% MO)');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'epp','Elementos de protección personal','glb',1.0,2500,7 FROM catalogo_actividades ca WHERE ca.codigo='INS-03-001' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Elementos de protección personal');

-- HOT-03-001 muro bloque 15cm
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Bloque concreto 15x20x40','und',12.5,2800,1 FROM catalogo_actividades ca WHERE ca.codigo='HOT-03-001' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Bloque concreto 15x20x40');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Mortero de pega 1:4','m³',0.015,480000,2 FROM catalogo_actividades ca WHERE ca.codigo='HOT-03-001' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Mortero de pega 1:4');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Cemento gris (para resanes)','kg',6.5,720,3 FROM catalogo_actividades ca WHERE ca.codigo='HOT-03-001' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Cemento gris (para resanes)');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Oficial albañil','jor',0.25,75000,4 FROM catalogo_actividades ca WHERE ca.codigo='HOT-03-001' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Oficial albañil');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Ayudante','jor',0.5,55000,5 FROM catalogo_actividades ca WHERE ca.codigo='HOT-03-001' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Ayudante');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'herramienta_menor','Herramienta menor (5% MO)','glb',1.0,2188,6 FROM catalogo_actividades ca WHERE ca.codigo='HOT-03-001' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Herramienta menor (5% MO)');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'epp','Elementos de protección personal','glb',1.0,2500,7 FROM catalogo_actividades ca WHERE ca.codigo='HOT-03-001' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Elementos de protección personal');

-- IND-05-003 muro bloque 20cm
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Bloque concreto 20x20x40','und',12.5,3800,1 FROM catalogo_actividades ca WHERE ca.codigo='IND-05-003' AND ca.tipo_obra='industrial' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Bloque concreto 20x20x40');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Mortero de pega 1:4','m³',0.018,480000,2 FROM catalogo_actividades ca WHERE ca.codigo='IND-05-003' AND ca.tipo_obra='industrial' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Mortero de pega 1:4');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Cemento gris (para resanes)','kg',7.5,720,3 FROM catalogo_actividades ca WHERE ca.codigo='IND-05-003' AND ca.tipo_obra='industrial' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Cemento gris (para resanes)');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Oficial albañil','jor',0.28,75000,4 FROM catalogo_actividades ca WHERE ca.codigo='IND-05-003' AND ca.tipo_obra='industrial' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Oficial albañil');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Ayudante','jor',0.55,55000,5 FROM catalogo_actividades ca WHERE ca.codigo='IND-05-003' AND ca.tipo_obra='industrial' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Ayudante');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'herramienta_menor','Herramienta menor (5% MO)','glb',1.0,2388,6 FROM catalogo_actividades ca WHERE ca.codigo='IND-05-003' AND ca.tipo_obra='industrial' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Herramienta menor (5% MO)');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'epp','Elementos de protección personal','glb',1.0,3000,7 FROM catalogo_actividades ca WHERE ca.codigo='IND-05-003' AND ca.tipo_obra='industrial' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Elementos de protección personal');

-- ════════════════════════════════════════════════════════════
-- 4. MURO LADRILLO TOLETE
-- ════════════════════════════════════════════════════════════

-- INS-03-002
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Ladrillo tolete #4 24x12x7cm','und',65,580,1 FROM catalogo_actividades ca WHERE ca.codigo='INS-03-002' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Ladrillo tolete #4 24x12x7cm');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Mortero de pega 1:4','m³',0.022,480000,2 FROM catalogo_actividades ca WHERE ca.codigo='INS-03-002' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Mortero de pega 1:4');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Cemento gris','kg',7.5,720,3 FROM catalogo_actividades ca WHERE ca.codigo='INS-03-002' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Cemento gris');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Oficial albañil','jor',0.3,75000,4 FROM catalogo_actividades ca WHERE ca.codigo='INS-03-002' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Oficial albañil');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Ayudante','jor',0.6,55000,5 FROM catalogo_actividades ca WHERE ca.codigo='INS-03-002' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Ayudante');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'herramienta_menor','Herramienta menor (5% MO)','glb',1.0,2850,6 FROM catalogo_actividades ca WHERE ca.codigo='INS-03-002' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Herramienta menor (5% MO)');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'epp','Elementos de protección personal','glb',1.0,2500,7 FROM catalogo_actividades ca WHERE ca.codigo='INS-03-002' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Elementos de protección personal');

-- HOT-03-002
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Ladrillo tolete #4 24x12x7cm','und',65,580,1 FROM catalogo_actividades ca WHERE ca.codigo='HOT-03-002' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Ladrillo tolete #4 24x12x7cm');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Mortero de pega 1:4','m³',0.022,480000,2 FROM catalogo_actividades ca WHERE ca.codigo='HOT-03-002' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Mortero de pega 1:4');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Cemento gris','kg',7.5,720,3 FROM catalogo_actividades ca WHERE ca.codigo='HOT-03-002' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Cemento gris');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Oficial albañil','jor',0.3,75000,4 FROM catalogo_actividades ca WHERE ca.codigo='HOT-03-002' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Oficial albañil');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Ayudante','jor',0.6,55000,5 FROM catalogo_actividades ca WHERE ca.codigo='HOT-03-002' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Ayudante');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'herramienta_menor','Herramienta menor (5% MO)','glb',1.0,2850,6 FROM catalogo_actividades ca WHERE ca.codigo='HOT-03-002' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Herramienta menor (5% MO)');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'epp','Elementos de protección personal','glb',1.0,2500,7 FROM catalogo_actividades ca WHERE ca.codigo='HOT-03-002' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Elementos de protección personal');

-- ════════════════════════════════════════════════════════════
-- 5. PAÑETE LISO 1:4 e=15mm
-- ════════════════════════════════════════════════════════════

-- INS-03-003
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Cemento gris','kg',7.2,720,1 FROM catalogo_actividades ca WHERE ca.codigo='INS-03-003' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Cemento gris');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Arena de peña fina','m³',0.025,95000,2 FROM catalogo_actividades ca WHERE ca.codigo='INS-03-003' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Arena de peña fina');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Agua','m³',0.008,2500,3 FROM catalogo_actividades ca WHERE ca.codigo='INS-03-003' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Agua');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Oficial pañetero','jor',0.15,75000,4 FROM catalogo_actividades ca WHERE ca.codigo='INS-03-003' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Oficial pañetero');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Ayudante','jor',0.25,55000,5 FROM catalogo_actividades ca WHERE ca.codigo='INS-03-003' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Ayudante');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'herramienta_menor','Herramienta menor (5% MO)','glb',1.0,1750,6 FROM catalogo_actividades ca WHERE ca.codigo='INS-03-003' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Herramienta menor (5% MO)');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'epp','Elementos de protección personal','glb',1.0,2000,7 FROM catalogo_actividades ca WHERE ca.codigo='INS-03-003' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Elementos de protección personal');

-- HOT-03-003
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Cemento gris','kg',7.2,720,1 FROM catalogo_actividades ca WHERE ca.codigo='HOT-03-003' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Cemento gris');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Arena de peña fina','m³',0.025,95000,2 FROM catalogo_actividades ca WHERE ca.codigo='HOT-03-003' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Arena de peña fina');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Agua','m³',0.008,2500,3 FROM catalogo_actividades ca WHERE ca.codigo='HOT-03-003' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Agua');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Oficial pañetero','jor',0.15,75000,4 FROM catalogo_actividades ca WHERE ca.codigo='HOT-03-003' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Oficial pañetero');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Ayudante','jor',0.25,55000,5 FROM catalogo_actividades ca WHERE ca.codigo='HOT-03-003' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Ayudante');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'herramienta_menor','Herramienta menor (5% MO)','glb',1.0,1750,6 FROM catalogo_actividades ca WHERE ca.codigo='HOT-03-003' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Herramienta menor (5% MO)');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'epp','Elementos de protección personal','glb',1.0,2000,7 FROM catalogo_actividades ca WHERE ca.codigo='HOT-03-003' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Elementos de protección personal');

-- ════════════════════════════════════════════════════════════
-- 6. PLACA ALIGERADA e=25cm
-- ════════════════════════════════════════════════════════════

-- INS-02-006
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Concreto premezclado 3000 PSI','m³',0.12,420000,1 FROM catalogo_actividades ca WHERE ca.codigo='INS-02-006' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Concreto premezclado 3000 PSI');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Acero de refuerzo fy=420 MPa','kg',14,3800,2 FROM catalogo_actividades ca WHERE ca.codigo='INS-02-006' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Acero de refuerzo fy=420 MPa');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Casetón plástico 50x50x20','und',4.0,6500,3 FROM catalogo_actividades ca WHERE ca.codigo='INS-02-006' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Casetón plástico 50x50x20');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Alambre negro #18','kg',0.3,5200,4 FROM catalogo_actividades ca WHERE ca.codigo='INS-02-006' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Alambre negro #18');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Formaleta madera','m²',1.0,8000,5 FROM catalogo_actividades ca WHERE ca.codigo='INS-02-006' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Formaleta madera');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Oficial maestro de obra','jor',0.3,75000,6 FROM catalogo_actividades ca WHERE ca.codigo='INS-02-006' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Oficial maestro de obra');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Ayudante','jor',0.6,55000,7 FROM catalogo_actividades ca WHERE ca.codigo='INS-02-006' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Ayudante');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'equipo','Vibrador de concreto','h',0.5,18000,8 FROM catalogo_actividades ca WHERE ca.codigo='INS-02-006' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Vibrador de concreto');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'herramienta_menor','Herramienta menor (5% MO)','glb',1.0,5250,9 FROM catalogo_actividades ca WHERE ca.codigo='INS-02-006' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Herramienta menor (5% MO)');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'epp','Elementos de protección personal','glb',1.0,3000,10 FROM catalogo_actividades ca WHERE ca.codigo='INS-02-006' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Elementos de protección personal');

-- HOT-02-006
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Concreto premezclado 3000 PSI','m³',0.12,420000,1 FROM catalogo_actividades ca WHERE ca.codigo='HOT-02-006' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Concreto premezclado 3000 PSI');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Acero de refuerzo fy=420 MPa','kg',14,3800,2 FROM catalogo_actividades ca WHERE ca.codigo='HOT-02-006' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Acero de refuerzo fy=420 MPa');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Casetón plástico 50x50x20','und',4.0,6500,3 FROM catalogo_actividades ca WHERE ca.codigo='HOT-02-006' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Casetón plástico 50x50x20');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Alambre negro #18','kg',0.3,5200,4 FROM catalogo_actividades ca WHERE ca.codigo='HOT-02-006' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Alambre negro #18');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Formaleta madera','m²',1.0,8000,5 FROM catalogo_actividades ca WHERE ca.codigo='HOT-02-006' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Formaleta madera');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Oficial maestro de obra','jor',0.3,75000,6 FROM catalogo_actividades ca WHERE ca.codigo='HOT-02-006' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Oficial maestro de obra');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Ayudante','jor',0.6,55000,7 FROM catalogo_actividades ca WHERE ca.codigo='HOT-02-006' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Ayudante');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'equipo','Vibrador de concreto','h',0.5,18000,8 FROM catalogo_actividades ca WHERE ca.codigo='HOT-02-006' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Vibrador de concreto');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'herramienta_menor','Herramienta menor (5% MO)','glb',1.0,5250,9 FROM catalogo_actividades ca WHERE ca.codigo='HOT-02-006' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Herramienta menor (5% MO)');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'epp','Elementos de protección personal','glb',1.0,3000,10 FROM catalogo_actividades ca WHERE ca.codigo='HOT-02-006' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Elementos de protección personal');

-- ════════════════════════════════════════════════════════════
-- 7. PISO CERÁMICA / PORCELANATO
-- ════════════════════════════════════════════════════════════

-- INS-05-002 piso cerámica antideslizante 30x30
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Cerámica antideslizante 30x30','m²',1.05,52000,1 FROM catalogo_actividades ca WHERE ca.codigo='INS-05-002' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Cerámica antideslizante 30x30');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Pegante para cerámica','kg',6.5,2200,2 FROM catalogo_actividades ca WHERE ca.codigo='INS-05-002' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Pegante para cerámica');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Boquilla para juntas','kg',0.3,4500,3 FROM catalogo_actividades ca WHERE ca.codigo='INS-05-002' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Boquilla para juntas');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Oficial enchapador','jor',0.2,75000,4 FROM catalogo_actividades ca WHERE ca.codigo='INS-05-002' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Oficial enchapador');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Ayudante','jor',0.3,55000,5 FROM catalogo_actividades ca WHERE ca.codigo='INS-05-002' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Ayudante');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'herramienta_menor','Herramienta menor (5% MO)','glb',1.0,1950,6 FROM catalogo_actividades ca WHERE ca.codigo='INS-05-002' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Herramienta menor (5% MO)');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'epp','Elementos de protección personal','glb',1.0,2000,7 FROM catalogo_actividades ca WHERE ca.codigo='INS-05-002' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Elementos de protección personal');

-- HOT-05-001 piso porcelanato rectificado 60x60
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Porcelanato rectificado 60x60','m²',1.05,98000,1 FROM catalogo_actividades ca WHERE ca.codigo='HOT-05-001' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Porcelanato rectificado 60x60');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Pegante especial porcelanato','kg',8.0,2800,2 FROM catalogo_actividades ca WHERE ca.codigo='HOT-05-001' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Pegante especial porcelanato');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Boquilla epóxica para juntas','kg',0.2,12000,3 FROM catalogo_actividades ca WHERE ca.codigo='HOT-05-001' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Boquilla epóxica para juntas');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Oficial enchapador','jor',0.25,75000,4 FROM catalogo_actividades ca WHERE ca.codigo='HOT-05-001' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Oficial enchapador');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Ayudante','jor',0.35,55000,5 FROM catalogo_actividades ca WHERE ca.codigo='HOT-05-001' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Ayudante');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'herramienta_menor','Herramienta menor (5% MO)','glb',1.0,2850,6 FROM catalogo_actividades ca WHERE ca.codigo='HOT-05-001' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Herramienta menor (5% MO)');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'epp','Elementos de protección personal','glb',1.0,2500,7 FROM catalogo_actividades ca WHERE ca.codigo='HOT-05-001' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Elementos de protección personal');

-- ════════════════════════════════════════════════════════════
-- 8. PUNTO HIDRÁULICO
-- ════════════════════════════════════════════════════════════

-- INS-06-001 punto hidráulico 1/2" PVC
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Tubería PVC hidráulica 1/2"','ml',4.0,4200,1 FROM catalogo_actividades ca WHERE ca.codigo='INS-06-001' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Tubería PVC hidráulica 1/2"');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Codo PVC 1/2" 90°','und',3.0,1800,2 FROM catalogo_actividades ca WHERE ca.codigo='INS-06-001' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Codo PVC 1/2" 90°');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Unión PVC 1/2"','und',1.0,1200,3 FROM catalogo_actividades ca WHERE ca.codigo='INS-06-001' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Unión PVC 1/2"');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Te PVC 1/2"','und',0.5,2200,4 FROM catalogo_actividades ca WHERE ca.codigo='INS-06-001' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Te PVC 1/2"');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Soldadura PVC (frasco)','und',0.1,8500,5 FROM catalogo_actividades ca WHERE ca.codigo='INS-06-001' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Soldadura PVC (frasco)');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Oficial plomero','jor',0.25,80000,6 FROM catalogo_actividades ca WHERE ca.codigo='INS-06-001' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Oficial plomero');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Ayudante plomero','jor',0.25,55000,7 FROM catalogo_actividades ca WHERE ca.codigo='INS-06-001' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Ayudante plomero');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'herramienta_menor','Herramienta menor (5% MO)','glb',1.0,3375,8 FROM catalogo_actividades ca WHERE ca.codigo='INS-06-001' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Herramienta menor (5% MO)');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'epp','Elementos de protección personal','glb',1.0,2500,9 FROM catalogo_actividades ca WHERE ca.codigo='INS-06-001' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Elementos de protección personal');

-- IND-07-003 punto hidráulico industrial 3/4"
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Tubería PVC hidráulica 3/4"','ml',5.0,6500,1 FROM catalogo_actividades ca WHERE ca.codigo='IND-07-003' AND ca.tipo_obra='industrial' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Tubería PVC hidráulica 3/4"');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Codo PVC 3/4" 90°','und',3.0,2500,2 FROM catalogo_actividades ca WHERE ca.codigo='IND-07-003' AND ca.tipo_obra='industrial' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Codo PVC 3/4" 90°');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Unión PVC 3/4"','und',1.0,1800,3 FROM catalogo_actividades ca WHERE ca.codigo='IND-07-003' AND ca.tipo_obra='industrial' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Unión PVC 3/4"');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Te PVC 3/4"','und',0.5,3200,4 FROM catalogo_actividades ca WHERE ca.codigo='IND-07-003' AND ca.tipo_obra='industrial' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Te PVC 3/4"');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Soldadura PVC (frasco)','und',0.15,8500,5 FROM catalogo_actividades ca WHERE ca.codigo='IND-07-003' AND ca.tipo_obra='industrial' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Soldadura PVC (frasco)');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Oficial plomero','jor',0.3,80000,6 FROM catalogo_actividades ca WHERE ca.codigo='IND-07-003' AND ca.tipo_obra='industrial' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Oficial plomero');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Ayudante plomero','jor',0.3,55000,7 FROM catalogo_actividades ca WHERE ca.codigo='IND-07-003' AND ca.tipo_obra='industrial' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Ayudante plomero');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'herramienta_menor','Herramienta menor (5% MO)','glb',1.0,4050,8 FROM catalogo_actividades ca WHERE ca.codigo='IND-07-003' AND ca.tipo_obra='industrial' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Herramienta menor (5% MO)');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'epp','Elementos de protección personal','glb',1.0,2500,9 FROM catalogo_actividades ca WHERE ca.codigo='IND-07-003' AND ca.tipo_obra='industrial' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Elementos de protección personal');

-- HOT-06-001 punto hidráulico 1/2" cobre
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Tubería cobre tipo L 1/2"','ml',4.0,18500,1 FROM catalogo_actividades ca WHERE ca.codigo='HOT-06-001' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Tubería cobre tipo L 1/2"');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Codo cobre 1/2" 90°','und',3.0,4200,2 FROM catalogo_actividades ca WHERE ca.codigo='HOT-06-001' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Codo cobre 1/2" 90°');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Unión cobre 1/2"','und',1.0,2800,3 FROM catalogo_actividades ca WHERE ca.codigo='HOT-06-001' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Unión cobre 1/2"');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Soldadura de estaño (barra)','und',0.05,48000,4 FROM catalogo_actividades ca WHERE ca.codigo='HOT-06-001' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Soldadura de estaño (barra)');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Pasta soldadora cobre','und',0.05,22000,5 FROM catalogo_actividades ca WHERE ca.codigo='HOT-06-001' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Pasta soldadora cobre');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Oficial plomero','jor',0.35,80000,6 FROM catalogo_actividades ca WHERE ca.codigo='HOT-06-001' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Oficial plomero');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Ayudante plomero','jor',0.35,55000,7 FROM catalogo_actividades ca WHERE ca.codigo='HOT-06-001' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Ayudante plomero');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'herramienta_menor','Herramienta menor (5% MO)','glb',1.0,4725,8 FROM catalogo_actividades ca WHERE ca.codigo='HOT-06-001' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Herramienta menor (5% MO)');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'epp','Elementos de protección personal','glb',1.0,2500,9 FROM catalogo_actividades ca WHERE ca.codigo='HOT-06-001' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Elementos de protección personal');

-- ════════════════════════════════════════════════════════════
-- 9. PUNTO ELÉCTRICO
-- ════════════════════════════════════════════════════════════

-- INS-07-001 punto eléctrico sencillo tubo EMT
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Tubería EMT 3/4"','ml',3.5,3800,1 FROM catalogo_actividades ca WHERE ca.codigo='INS-07-001' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Tubería EMT 3/4"');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Caja metálica 2x4"','und',1.0,8500,2 FROM catalogo_actividades ca WHERE ca.codigo='INS-07-001' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Caja metálica 2x4"');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Alambre THW 12 AWG','ml',8.0,1800,3 FROM catalogo_actividades ca WHERE ca.codigo='INS-07-001' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Alambre THW 12 AWG');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Toma o interruptor sencillo','und',1.0,12000,4 FROM catalogo_actividades ca WHERE ca.codigo='INS-07-001' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Toma o interruptor sencillo');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Conectores EMT 3/4"','und',2.0,1500,5 FROM catalogo_actividades ca WHERE ca.codigo='INS-07-001' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Conectores EMT 3/4"');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Oficial electricista','jor',0.2,82000,6 FROM catalogo_actividades ca WHERE ca.codigo='INS-07-001' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Oficial electricista');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Ayudante electricista','jor',0.2,55000,7 FROM catalogo_actividades ca WHERE ca.codigo='INS-07-001' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Ayudante electricista');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'herramienta_menor','Herramienta menor (5% MO)','glb',1.0,2740,8 FROM catalogo_actividades ca WHERE ca.codigo='INS-07-001' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Herramienta menor (5% MO)');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'epp','Elementos de protección personal','glb',1.0,2500,9 FROM catalogo_actividades ca WHERE ca.codigo='INS-07-001' AND ca.tipo_obra='institucional' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Elementos de protección personal');

-- IND-07-001 punto eléctrico industrial trifásico
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Tubería conduit rígido 1"','ml',4.0,7500,1 FROM catalogo_actividades ca WHERE ca.codigo='IND-07-001' AND ca.tipo_obra='industrial' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Tubería conduit rígido 1"');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Caja metálica 4x4"','und',1.0,18500,2 FROM catalogo_actividades ca WHERE ca.codigo='IND-07-001' AND ca.tipo_obra='industrial' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Caja metálica 4x4"');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Cable THW 10 AWG (3 fases + neutro)','ml',24.0,3200,3 FROM catalogo_actividades ca WHERE ca.codigo='IND-07-001' AND ca.tipo_obra='industrial' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Cable THW 10 AWG (3 fases + neutro)');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Toma trifásica industrial 30A','und',1.0,48000,4 FROM catalogo_actividades ca WHERE ca.codigo='IND-07-001' AND ca.tipo_obra='industrial' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Toma trifásica industrial 30A');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Conectores conduit 1"','und',3.0,3500,5 FROM catalogo_actividades ca WHERE ca.codigo='IND-07-001' AND ca.tipo_obra='industrial' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Conectores conduit 1"');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Oficial electricista','jor',0.5,82000,6 FROM catalogo_actividades ca WHERE ca.codigo='IND-07-001' AND ca.tipo_obra='industrial' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Oficial electricista');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Ayudante electricista','jor',0.5,55000,7 FROM catalogo_actividades ca WHERE ca.codigo='IND-07-001' AND ca.tipo_obra='industrial' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Ayudante electricista');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'herramienta_menor','Herramienta menor (5% MO)','glb',1.0,6850,8 FROM catalogo_actividades ca WHERE ca.codigo='IND-07-001' AND ca.tipo_obra='industrial' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Herramienta menor (5% MO)');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'epp','Elementos de protección personal','glb',1.0,3500,9 FROM catalogo_actividades ca WHERE ca.codigo='IND-07-001' AND ca.tipo_obra='industrial' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Elementos de protección personal');

-- HOT-07-001 punto eléctrico sencillo con regulador dimmer
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Tubería EMT 3/4"','ml',3.5,3800,1 FROM catalogo_actividades ca WHERE ca.codigo='HOT-07-001' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Tubería EMT 3/4"');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Caja metálica 2x4"','und',1.0,8500,2 FROM catalogo_actividades ca WHERE ca.codigo='HOT-07-001' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Caja metálica 2x4"');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Alambre THW 12 AWG','ml',8.0,1800,3 FROM catalogo_actividades ca WHERE ca.codigo='HOT-07-001' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Alambre THW 12 AWG');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Interruptor sencillo con dimmer','und',1.0,48000,4 FROM catalogo_actividades ca WHERE ca.codigo='HOT-07-001' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Interruptor sencillo con dimmer');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'material','Conectores EMT 3/4"','und',2.0,1500,5 FROM catalogo_actividades ca WHERE ca.codigo='HOT-07-001' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Conectores EMT 3/4"');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Oficial electricista','jor',0.25,82000,6 FROM catalogo_actividades ca WHERE ca.codigo='HOT-07-001' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Oficial electricista');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'mano_obra','Ayudante electricista','jor',0.25,55000,7 FROM catalogo_actividades ca WHERE ca.codigo='HOT-07-001' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Ayudante electricista');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'herramienta_menor','Herramienta menor (5% MO)','glb',1.0,3425,8 FROM catalogo_actividades ca WHERE ca.codigo='HOT-07-001' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Herramienta menor (5% MO)');
INSERT INTO catalogo_apu_items (catalogo_actividad_id, tipo, nombre, unidad, cantidad, precio_unitario, orden)
SELECT ca.id,'epp','Elementos de protección personal','glb',1.0,2500,9 FROM catalogo_actividades ca WHERE ca.codigo='HOT-07-001' AND ca.tipo_obra='hotelero' AND NOT EXISTS (SELECT 1 FROM catalogo_apu_items x WHERE x.catalogo_actividad_id=ca.id AND x.nombre='Elementos de protección personal');
