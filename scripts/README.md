# Scripts de Mantenimiento SIPO

Este directorio contiene herramientas para el mantenimiento masivo de datos de la plataforma SIPO.

## Scripts Disponibles

### 1. `master-fill-all-prices.ts`
**Propósito:** Actualiza los precios de todas las actividades en **presupuestos activos** de los usuarios que tengan precio zero.
- Clasifica las actividades por nombre (regex).
- Calcula costos de Materiales, Mano de Obra y Equipos.
- Actualiza la tabla `activities` y sincroniza la tabla `apus`.

### 2. `master-fill-catalogo-prices.ts`
**Propósito:** Actualiza el **Catálogo Maestro** de SIPO.
- Llena la tabla `catalogo_actividades` con precios proyectados a 2026.
- Genera automáticamente los `catalogo_apu_items` para cada actividad del catálogo.
- **Uso:** `npx tsx scripts/master-fill-catalogo-prices.ts`

### 3. `check-catalog-integrity.ts`
**Propósito:** Diagnóstico rápido del estado del catálogo.
- Muestra el conteo de capítulos por tipo de obra.
- Identifica actividades con precio cero.

## Cómo agregar nuevas categorías de precios
Para mejorar la clasificación, edita el objeto `PRECIOS_BASE` y la función `clasificar` en cualquiera de los scripts `master-fill-*`.

Las categorías actuales incluyen:
- Excavación
- Concreto
- Acero
- Mampostería
- Pañete
- Pintura
- Pisos y Enchapes
- Cubiertas
- Drywall
- Carpintería
- Puntos Eléctricos / Hidráulicos
- Preliminares
