# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Idioma obligatorio

- Responde SIEMPRE en español colombiano
- Toda la UI debe estar en español colombiano
- Nunca escribas textos de interfaz en inglés
- Usa términos de construcción colombiana:
  capítulos, actividades, APU, AIU, mano de obra,
  insumos, partidas, presupuesto de obra

## Project Overview

SIPO (Sistema Inteligente de Presupuestos de Obra) is a Colombian construction budgeting SaaS. It implements the standard methodology for public/private construction cost estimation including AIU (Administración, Imprevistos, Utilidad), APU (Análisis de Precio Unitario), and Colombian fiscal taxes (ICA, retefuente, reteIVA).

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** — inline `@theme` in `src/app/globals.css` (no separate config file)
- **Supabase** — PostgreSQL 17 + Auth (cookie-based via `@supabase/ssr`) + Storage
- **Anthropic Claude 3.5 Sonnet** — streaming via `/api/ia/stream`
- **Zod v4** — centralized schemas in `src/lib/validations/schemas.ts`
- **Zustand** — local UI state only
- **decimal.js** — all financial/tax calculations (never use native floats)
- **@react-pdf/renderer** — PDF export

## Commands

```bash
npm run dev                  # Dev server on http://localhost:3000
npm run build                # Production build
npm start                    # Production server
npm run migrate              # Apply pending SQL migrations (idempotent, safe to re-run)
npm run seed:catalogo        # Insert/update reference catalog (Colombia 2025 prices)
npm run seed:catalogo:reset  # Wipe and re-seed catalog
npm run seed:apu             # Insert APU reference items into catalogo_apu_items (31 activities)
npm run seed:apu:reset       # Wipe and re-seed APU reference items
npx vitest                   # Run calculation engine tests
```

## Database Connection

Connects via Supabase Pooler (Transaction mode). Required `.env` variables:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_DB_PASSWORD          # PostgreSQL password (≠ service role key)
SUPABASE_DB_HOST              # e.g. aws-0-us-west-2.pooler.supabase.com
SUPABASE_DB_PORT              # 6543 for Transaction pooler
ANTHROPIC_API_KEY             # Required for IA features (currently empty in dev)
NEXT_PUBLIC_APP_URL
```

`ANTHROPIC_API_KEY` is **empty in dev** — all `/api/ia/*` endpoints will fail until it is set.

## Migration System

`scripts/migrate.js` tracks applied files in `schema_migrations` table. Each run skips already-applied files. Every SQL file must be **idempotent**:

- Tables: `CREATE TABLE IF NOT EXISTS`
- Indexes: `CREATE INDEX IF NOT EXISTS`
- Policies: `DROP POLICY IF EXISTS "name" ON table; CREATE POLICY ...`
- Triggers: `DROP TRIGGER IF EXISTS name ON table; CREATE TRIGGER ...`
- Functions: `CREATE OR REPLACE FUNCTION`

### Applied migrations (29 total, in order)

| File | Content | Status |
|------|---------|--------|
| `schema.sql` | Core tables: profiles, projects, budgets, chapters, activities, apus, apu_items, materials, labor, equipment, ai_conversations, user_materials | ✅ applied |
| `20260504103000_parametros_fiscales.sql` | Colombian fiscal parameters (SMMLV, ARL factors) + seed 2025 | ✅ applied |
| `20260504103500_profiles_fiscal.sql` | AIU defaults on profiles, `municipios` table with ReteICA | ✅ applied |
| `20260504104000_rls_audit.sql` | Soft-delete (`deleted_at`), active views, audit_log, RLS reinforcement | ✅ applied |
| `20260504104500_budget_estados.sql` | Budget state machine, `budget_snapshots`, version trigger | ✅ applied |
| `20260504105000_ia_security.sql` | `ai_usage` rate-limit table, IA config on profiles | ✅ applied |
| `20260505100000_catalogo_actividades.sql` | `catalogo_capitulos` + `catalogo_actividades` tables (public read) | ✅ applied |
| `20260505200000_budget_columns_completo.sql` | **Critical fix**: adds 14 missing columns to `budgets` (metodo_aiu, administracion_pct, imprevistos_pct, utilidad_pct, metodo_iva, retenciones, etc.), `precio_desde_apu` on activities, extended `apu_items.tipo` constraint | ✅ applied |
| `20260505210000_pendientes_motor.sql` | `pct_herramienta_menor`/`pct_epp` on apus, `preferences` JSONB on profiles, `v_resumen_presupuesto` view | ✅ applied |
| `20260505220000_catalogo_apu_items.sql` | `catalogo_apu_items` table — APU reference items linked to `catalogo_actividades` (public read) | ✅ applied |
| `20260506100000_fix_v_resumen_retenciones.sql` | **Bug fix**: Rebuild `v_resumen_presupuesto` with CTE — corrects ReteFuente/ICA base (subtotal_con_aiu, not valor_total), adds `aiu` column, fixes `sobre_total` ReteIVA calculation | ✅ applied |
| `20260507100000_fix_trigger_chain.sql` | **Bug fix**: Recrear los 3 triggers del motor (`trg_sync_activity_precio`, `trg_sync_chapter_subtotal`, `trg_sync_budget_costo`) con filtro `deleted_at IS NULL`. Recálculo masivo de `valor_subtotal` y `costo_directo` en datos existentes. | ✅ applied |
| `20260510100000_profiles_contacto.sql` | Adds contact columns to `profiles` table (`telefono`, `direccion`, `email_empresa`) | ✅ applied |
| `20260511100000_drop_legacy_users.sql` | **Limpieza**: `DROP TABLE IF EXISTS public.users/usuarios CASCADE` — tablas legacy nunca usadas en SIPO | ✅ applied |
| `20260511110000_fix_apu_costo_precision.sql` | **Bug fix**: Columnas `costo_*` de `apus` a `NUMERIC(15,2)`, `costo_total` GENERATED con `ROUND(...,2)`, `v_resumen_presupuesto` con `ROUND` en toda aritmética | ✅ applied |
| `20260511120000_seed_trabajadores.sql` | **Seed**: Índice único en `trabajadores.especialidad` + 25 trabajadores de referencia Colombia 2025 (`ON CONFLICT DO NOTHING`) | ✅ applied |
| `20260511130000_estados_proyecto_presupuesto.sql` | **Actualización**: `projects.estado` cambia constraint a `borrador\|en_progreso\|finalizado\|archivado`; migra `activo/pausado→en_progreso`, `completado→finalizado`; default ahora `borrador` | ⏳ pendiente (`npm run migrate`) |
| `20260511140000_fix_estados_proyecto.sql` | **Idempotente**: repite el fix de estados con UPDATE antes de ADD CONSTRAINT; segundo guard por si `130000` falló parcialmente | ⏳ pendiente (`npm run migrate`) |
| `20260512100000_seed_institucional.sql` | **Seed**: 40+ actividades institucionales (hospitales, escuelas) con APUs base | ✅ applied |
| `20260512110000_seed_industrial.sql` | **Seed**: 30+ actividades industriales (bodegas, plantas) con APUs base | ✅ applied |
| `20260512120000_seed_hotelero.sql` | **Seed**: 35+ actividades hoteleras/turismo con APUs base | ✅ applied |
| `20260512130000_seed_apu_items_nuevos_tipos.sql` | **Seed**: 800+ insumos adicionales para cubrir nuevos tipos de obra | ✅ applied |
| `20260512140000_add_hotelero_tipo_obra.sql` | **Schema**: Agrega 'hotelero' a `tipo_obra` en `projects` y `catalogo_capitulos` | ✅ applied |
| `20260512150000_strip_chapter_number_prefix.sql` | **Cleanup**: Remueve prefijos numéricos (ej: "1. ") de nombres de capítulos en catálogo | ✅ applied |
| `20260512200000_apu_items_cuadrilla.sql` | **Schema**: Agrega `cuadrilla_id` opcional a `apu_items` para trazabilidad | ✅ applied |
| `20260512210000_fix_catalogo_apu_precios.sql` | **Bug fix**: Primera pasada de corrección de precios en catálogo | ✅ applied |
| `20260512210001_fix_catalogo_apu_precios_v2.sql` | **Bug fix**: Segunda pasada de corrección de precios en catálogo | ✅ applied |
| `20260512210002_fix_catalogo_apu_precios_v3.sql` | **Bug fix**: Corrige precios desactualizados en el catálogo tras la importación masiva | ✅ applied |
| `20260512300000_clientes.sql` | **Módulo Clientes**: Tabla `clientes` + `cliente_id` en `projects` + RLS | ✅ applied |

### Loose SQL files at root (already applied manually — do NOT re-run)

`cuadrillas_schema.sql`, `ai-tables.sql`, `migration_motor_calculo.sql`, `migration_motor_2026.sql`, `preferences_column.sql`, `trigger-profiles.sql`, `seed.sql`, `seed_cuadrillas.sql`, `seed_data.sql` — these were executed directly in Supabase Dashboard and are **already reflected in the database**. Their triggers and functions are now superseded by `20260507100000_fix_trigger_chain.sql`. Do not add them to `migrate.js`.

## Current Database State (as of 2026-05-11)

**27 tables + 5 views** in `public` schema. Key tables and their non-obvious columns:

| Table | Key columns beyond the obvious |
|-------|-------------------------------|
| `budgets` | `metodo_aiu` ('porcentaje'\|'detallado'), `administracion_pct`, `imprevistos_pct`, `utilidad_pct`, `gastos_fijos_mensuales`, `duracion_meses`, `metodo_iva`, `mostrar_retenciones`, `retefuente_pct`, `ica_pct`, `reteiva_pct`, `ciudad_ica`, `costo_directo`, `vigencia_dias` |
| `apus` | `costo_herramienta_menor`, `costo_epp`, `pct_herramienta_menor` (default 3%), `pct_epp` (default 1%), `rendimiento` |
| `apu_items` | `tipo` IN ('material','mano_obra','equipo','herramienta_menor','epp') |
| `activities` | `precio_desde_apu` BOOLEAN — when true, `precio_unitario` is read from the linked APU |
| `profiles` | `preferences` JSONB (accentColor, density, showCompanyName, defaultCity), `nivel_riesgo_arl` (1-5), `municipio`, `telefono`, `direccion`, `email_empresa`, AIU defaults |
| `catalogo_capitulos` | Reference catalog — 28 chapters across residencial/comercial/infraestructura |
| `catalogo_actividades` | 164 reference activities with `precio_referencia_nacional`, `rango_min`, `rango_max` (COP 2025) |
| `catalogo_apu_items` | APU reference items per activity — tipo, nombre, unidad, cantidad, precio_unitario, orden (public read) |
| `clientes` | `tipo` (persona/empresa), `nombre_razon_social`, `nit_cedula`, `nombre_contacto`, `cargo_contacto`, `ciudad`, `email`, `telefono` |

## Architecture

### Domain Hierarchy (5 levels)

```
Project (projects)
  └── Budget (budgets)  — AIU config, metodo_iva, retenciones
        └── Chapter (chapters)
              └── Activity (activities)  — qty × unit_price = subtotal
                    └── APU (apus)
                          └── APU Items (apu_items)  — material/mano_obra/equipo/HM/EPP
```

### Calculation Pipeline

`src/lib/calculos/motor-presupuesto.ts` is the core engine:

```
costo_directo  (sum of activities.subtotal)
  + Administración  (pct × CD  OR  gastos_fijos × meses)
  + Imprevistos     (pct × CD)
  + Utilidad        (pct × CD)
  = subtotal_con_aiu
  + IVA             (metodo_iva: sobre_utilidad | sobre_aiu | sobre_total | no_aplica)
  = total_oferta
  - Retenciones     (retefuente, ICA, reteIVA — informativas, base = subtotal_con_aiu)
  = total_neto
```

`AIUConfig` requires `metodo_iva` and `iva_porcentaje` — do not call `calcularTotalPresupuesto` without them.

APU sync chain (all DB-side triggers):
```
guardarAPU writes apus.costo_material/mano_obra/equipo/HM/EPP
  → apus.costo_total (GENERATED column)
    → trg_sync_activity_precio → activities.precio_unitario
      → trg_sync_chapter_subtotal → chapters.valor_subtotal
        → trg_sync_budget_costo → budgets.costo_directo
          → v_resumen_presupuesto (read-only view)
```

Always use `decimal.js` for these computations. Fiscal rates by city live in `src/lib/fiscal/parametros.ts` and the `municipios` table. The view `v_resumen_presupuesto` computes this in SQL for read-only display.

### Key Directories

| Path | Purpose |
|------|---------|
| `src/actions/` | All data mutations as `'use server'` Server Actions; validate with Zod, then Supabase |
| `src/app/(auth)/` | Public routes: login, registro, recuperar-contrasena, nueva-contrasena |
| `src/app/(dashboard)/` | Protected routes behind sidebar layout |
| `src/app/api/ia/` | `stream` (Claude streaming) and `presupuesto` (budget analysis) endpoints |
| `src/components/shared/` | UI primitives — always reuse before creating new components |
| `src/lib/anthropic/` | Claude client singleton, SYSTEM_PROMPT, response parser, rate limiter |
| `src/lib/calculos/` | Budget calculation engine + tests |
| `src/lib/supabase/` | `client.ts` (browser), `server.ts` (server + `createAdminClient()`), `middleware.ts` (session + route guard) |
| `src/lib/validations/schemas.ts` | Single source of truth for all Zod schemas — edit here first |
| `src/types/index.ts` | All TypeScript interfaces |
| `supabase/migrations/` | Tracked SQL migrations (timestamped, idempotent) |
| `scripts/migrate.js` | Migration runner with `schema_migrations` tracking |
| `scripts/seed-catalogo.ts` | Reference catalog seed (run with `npm run seed:catalogo`) |
| `scripts/verificar-fix.ts` | End-to-end test: simula `crearPresupuestoConPlantilla` completo y verifica chapters+activities+APUs en BD |
| `scripts/check-catalogo.ts` | Verifica conteos de catálogo y presupuestos recientes via REST API |

### Supabase Clients — dos tipos

| Función | Key usada | RLS | Cuándo usar |
|---------|-----------|-----|-------------|
| `createClient()` | ANON_KEY + user JWT (cookies) | Aplicado | Server Components, la mayoría de Server Actions |
| `createAdminClient()` | SERVICE_ROLE_KEY | Omitido | INSERTs masivos desde catálogo, seeds. Usuario ya verificado en el mismo action |

**Regla crítica:** El cliente de usuario (`createClient`) no propaga correctamente el JWT a PostgREST en Server Actions de larga duración. Usar `createAdminClient` para todos los INSERTs en `importarDesdeCatalogo` y `crearPresupuestoConPlantilla`. La autenticación del usuario sigue verificándose con `supabase.auth.getUser()` al inicio de cada action.

### Authentication & Routing

Cookie-based Supabase Auth. `src/lib/supabase/middleware.ts` refreshes tokens and redirects unauthenticated users away from `(dashboard)` routes. `src/proxy.ts` adapts Next.js 16 middleware conventions.

### AI Integration

- `POST /api/ia/stream` — streams Claude responses; lines prefixed `__METADATA__:` carry conversation ID
- Rate limiting: `consultas_ia_este_mes` on `profiles` + `ai_usage` table
- `ANTHROPIC_API_KEY` must be non-empty; the route validates before any call

## Feature Implementation Workflow

1. Add/update Zod schema in `src/lib/validations/schemas.ts`
2. Update TypeScript interfaces in `src/types/index.ts`
3. If DB change needed: create `supabase/migrations/TIMESTAMP_description.sql` (idempotent), add to `migrate.js`, run `npm run migrate`
4. Implement Server Action in `src/actions/` with Zod parse + Supabase call
5. Build/update UI using `src/components/shared/` primitives
6. If financial math: use `decimal.js`, add test in `src/lib/calculos/motor-presupuesto.test.ts`

## Design System

Tailwind v4 with semantic CSS variables in `src/app/globals.css`:
`primary`, `secondary`, `success`, `warning`, `danger`, `info` + neutral palette.
Token reference: `src/lib/design-tokens.ts`. User accent color stored in `profiles.preferences.accentColor`.

## Known Remaining Tasks

### Pendiente — acción manual requerida
- Presupuestos creados antes del fix de admin client (2026-05-07) tienen 0 actividades — deben eliminarse y recrearse con "Plantilla Sugerida"
- Reimportar capítulos del catálogo que existan en BD sin `apu_items` (fueron importados antes del fix del `subtotal` GENERATED)

### Pendiente — configuración de entorno
- `ANTHROPIC_API_KEY` debe estar configurada para funciones IA (`/api/ia/stream`, asistente)

### Pendiente — features incompletas
- `ResumenFinancieroModal` existe en `src/components/presupuestos/ResumenFinancieroModal.tsx` pero **no tiene botón disparador** en `EditorPresupuesto.tsx` — el editor solo usa `ResumenFinanciero` (inline). Falta agregar un botón "Ver resumen completo" que abra el modal con `budget` y `subtotalDirecto`.
- **Migración pendiente de ejecutar**: `npm run migrate` debe correr `20260511130000` + `20260511140000` para actualizar el constraint de `projects.estado` en BD.

~~### Pendiente — errores TypeScript (5 archivos, descubiertos 2026-05-13)~~ ✅ 2026-05-13 — todos resueltos, `tsc --noEmit --skipLibCheck` sin errores

### Pendiente — deuda técnica
~~- Turbopack FATAL panic en Windows con `@react-pdf/renderer` — OS error 5 "Acceso denegado" al crear junction points~~ ✅ 2026-05-13 — `package.json` cambiado a `next dev --no-turbo`
~~- Legacy tables `users`, `usuarios` — verificar que no se usan antes de eliminar~~ ✅ 2026-05-11
~~- Imprecisión de punto flotante en `apus.costo_total` GENERATED (ej: `26757.96000000000...`) — columna NUMERIC debería usar escala fija `NUMERIC(15,2)`~~ ✅ 2026-05-11
~~- `ResumenFinancieroModal.tsx` líneas 416-425 — fragmento huérfano de versión anterior causaba 14 errores TS1005/TS1109 parse errors~~ ✅ 2026-05-13

### Completado ✅
- ~~Módulo de Gestión de Clientes~~ — Dashboard completo (`/clientes`) con CRUD de clientes (Persona Natural / Empresa); integración en `ModalNuevoProyecto` y `ProjectSettings` para asignar cliente; actualización de `PresupuestoPDF` para mostrar datos del cliente (NIT, contacto, cargo) y firmas dinámicas ✅ 2026-05-12
- ~~Ampliación de Catálogo (800+ ítems)~~ — Nuevas categorías: Institucional, Industrial y Hotelero; selector de tipo de obra en `ModalNuevoPresupuesto` ahora incluye estas opciones; limpieza de prefijos numéricos en nombres de capítulos ✅ 2026-05-12
- ~~Estados de proyectos rediseñados~~ — máquina de estados `borrador→en_progreso→finalizado→archivado`; `ProjectActions` muestra "Finalizar obra" (ghost, success) en `en_progreso` y "Archivar proyecto" (ghost, neutral) en `finalizado` con ConfirmDialog; `ProyectosGrid` cliente con 4 pills de filtro (por defecto muestra borrador+en_progreso); `createProject` inserta `estado:'borrador'` explícito; proyecto avanza a `en_progreso` solo al aprobar un presupuesto ✅ 2026-05-12
- ~~Bug ProyectoCard `ESTADO_STYLES.activo` undefined~~ — fallback corregido a `ESTADO_STYLES.borrador` ✅ 2026-05-12
- ~~Plantilla Sugerida sin selector de tipo de obra~~ — `ModalNuevoPresupuesto` paso 3 muestra 3 cards (Residencial, Comercial, Infraestructura), preselecciona desde `proyectoTipoObra`, filtra `PLANTILLAS_CAPITULOS` por tipo, empty state si no hay capítulos ✅ 2026-05-12
- ~~Módulo Insumos — botón "Agregar Propio" no funcionaba en ninguna pestaña~~ — `page.tsx` reescrito con: renderizado separado para pestaña `crews` vs. material/labor/equipment/user; botón context-aware ("Nueva Cuadrilla" en crews, "Agregar Propio" en el resto); modal cuadrilla con selección de trabajadores + vista previa de costo; lazy loading de `getTrabajadores()`; delete para cuadrillas propias (`!es_sistema`) ✅ 2026-05-11
- ~~`deleteUserMaterial` fallaba en BD~~ — usaba soft-delete `.update({ deleted_at })` en tabla sin columna `deleted_at`; corregido a `.delete()` ✅ 2026-05-11
- ~~Acción `deleteCuadrilla` no existía~~ — agregada en `src/actions/cuadrillas.ts` con guard `eq('es_sistema', false)` ✅ 2026-05-11
- ~~`updateUserMaterial` no existía~~ — agregada en `src/actions/insumos.ts` con `createUserMaterialSchema` ✅ 2026-05-11
- ~~`trabajadores` tabla vacía — sin datos el dropdown de cuadrillas estaba vacío~~ — migración `20260511120000_seed_trabajadores.sql` siembra 25 trabajadores de referencia Colombia 2025 con `ON CONFLICT (especialidad) DO NOTHING` ✅ 2026-05-11
- ~~No había forma de importar desde catálogo Mano de Obra a cuadrillas~~ — `importarLaborComoTrabajador(laborId)` en `cuadrillas.ts` (admin client, verifica duplicados por nombre); modal cuadrilla tiene sección desplegable "Importar desde Mano de Obra" con búsqueda y botón por ítem ✅ 2026-05-11
- ~~PDF: actividades sin numerar secuencialmente (activityIndex faltante)~~ — `PresupuestoCompletoConAPU` ahora pasa `activityIndex={item.activityIndex}` a `APUDetallePDF`
- ~~Banner advertencia ciudad empresa ≠ ciudad obra~~ — `EditorPresupuesto` detecta diferencia entre `profile.ciudad` y `budget.ciudad_ica`; muestra banner ámbar con botón "Ignorar" (estado local, no persiste en BD)
- ~~PDF: IVA no aparecía cuando `metodo_iva = 'no_aplica'`~~ — línea IVA siempre visible; muestra "No aplica" o el monto formateado según el método
- ~~PDF: ReteIVA no aparecía en retenciones informativas~~ — condición corregida a `reteivaPct > 0 && iva.greaterThan(0)` (antes requería `iva > 0` con flotante)
- ~~PDF: cálculos financieros usaban floats nativos~~ — toda la sección de resumen y retenciones reescrita con `decimal.js`
- ~~PDF: firma del contratista con nombre hardcodeado~~ — usa `profile.nombre_completo` con fallback `'[Nombre no configurado]'`; muestra `cargo` o `profesion` si existen (campos reservados en `ConfigPDFProfesional`)
- ~~PDF: columna "% C.D." faltante en tabla de capítulos~~ — nueva columna 9% muestra `(subtotal_cap / costo_directo) × 100` con 1 decimal usando `decimal.js`; muestra `—` si `costo_directo = 0`
- ~~Plantilla Sugerida crea capítulos pero sin actividades~~ — causa raíz: cliente Supabase del usuario no propagaba JWT correctamente para activities/APUs; fix: `createAdminClient()` (service role) para todos los INSERTs en `importarDesdeCatalogo` y `crearPresupuestoConPlantilla`. Verificado: 22 activities + 10 APUs + 53 apu_items insertados en test end-to-end (`npx tsx scripts/verificar-fix.ts`)
- ~~Modal "Nuevo Presupuesto" pregunta proyecto cuando ya estás dentro de uno~~ — `ModalNuevoPresupuesto` acepta props opcionales `proyectoId`, `proyectoNombre`, `proyectoTipoObra`; cuando vienen, salta el paso 1 y muestra el proyecto como chip no editable en paso 2. `ProjectActions` y la página `proyectos/[id]/page.tsx` pasan estos props
- ~~`costo_directo = 0` en `v_resumen_presupuesto`~~ — migración `20260507100000_fix_trigger_chain.sql` recrea los 3 triggers con filtro `deleted_at IS NULL` y recalcula todos los presupuestos existentes
- ~~Panel APU siempre vacío~~ — `apu_items.subtotal` es GENERATED ALWAYS AS; eliminado del INSERT en `importarDesdeCatalogo`; `PanelAPU` usa datos embebidos en `activity.apus[0]` como estado inicial
- ~~Actividades sin crear tras importar catálogo~~ — logging detallado en todos los INSERTs; `actErr`/`apuErr`/`itemsErr` con `console.error`
- ~~`createProject` mostraba error falso~~ — `redirect()` dentro de `try/catch` capturaba `NEXT_REDIRECT`; corregido: action retorna `{ success, data }` y el cliente navega con `router.push()`
- ~~`costo_total` GENERATED ALWAYS bloqueaba INSERT de APU~~ — eliminado del payload en `importarDesdeCatalogo`
- ~~`router.refresh()` no actualizaba la UI del editor~~ — `useEffect([initialBudget])` en `EditorPresupuesto` sincroniza estado local con props frescos del servidor
- ~~Catalog data not wired into UI~~ — `ModalCatalogo` + `importarDesdeCatalogo` crea capítulos + actividades + APU + apu_items
- ~~PDF export not working~~ — `metodo_iva` switch implementado, retenciones usan campos del budget
- ~~Budget not appearing after create~~ — `ModalNuevoPresupuesto` usa `router.push()` (evita bfcache)
- ~~Motor ignora `metodo_iva`~~ — `AIUConfig` requiere `metodo_iva` + `iva_porcentaje`; switch para 4 métodos
- ~~`retefuente` sobre CD en lugar de subtotalConAIU~~ — corregido en motor y en `v_resumen_presupuesto`
- ~~`guardarAPU` no propagaba costos~~ — ahora escribe `apus.costo_material/mano_obra/equipo/HM/EPP`
- ~~Dashboard mostraba nombre incorrecto~~ — lee desde `profiles.nombre_completo` con fallback chain
- ~~Fechas sin zona horaria Bogotá~~ — `timeZone: 'America/Bogota'` en todos los `Intl.DateTimeFormat`
- ~~Template de capítulos ignorada~~ — `crearPresupuesto` recibe `capitulos?: string[]` y los inserta
- ~~`@types/pg` faltante~~ — ya en `devDependencies`
- ~~`npm run seed:apu`~~ — 175 filas en `catalogo_apu_items` (31 actividades con ítems de referencia)
