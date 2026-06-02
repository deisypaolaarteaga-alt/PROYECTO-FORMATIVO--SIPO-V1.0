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
- **Zod v4** — centralized schemas in `src/lib/validations/schemas.ts`
- **Zustand** — local UI state only
- **decimal.js** — all financial/tax calculations (never use native floats)
- **@react-pdf/renderer** — PDF export
- **xlsx 0.18.5** — Excel export (SheetJS, browser-side via `XLSX.write` + Blob download)

## Commands

```bash
pnpm dev                     # Dev server on http://localhost:3000 (--webpack, evita panic de @react-pdf en Windows)
pnpm build                   # Production build
pnpm start                   # Production server
pnpm run migrate             # Apply pending SQL migrations (idempotent, safe to re-run)
pnpm run seed:catalogo       # Insert/update reference catalog (Colombia 2025 prices)
pnpm run seed:catalogo:reset # Wipe and re-seed catalog
pnpm run seed:apu            # Insert APU reference items into catalogo_apu_items (31 activities)
pnpm run seed:apu:reset      # Wipe and re-seed APU reference items
pnpm run seed:catalogo-items      # Seed masivo de ítems APU de referencia (Colombia 2026) en catalogo_apu_items
pnpm run seed:catalogo-items:reset # Wipe and re-seed catalogo items 2026
pnpm run seed:catalogo-items:dry  # Dry-run: muestra qué insertaría sin escribir en BD
pnpm exec vitest                      # Run calculation engine tests
pnpm run diagnostico:huerfanos        # Diagnóstico: capítulos/actividades sin catalogo_apu_items
pnpm run reimportar:huerfanos         # Reimportar: insertar items faltantes (idempotente, no borra existentes)
pnpm run reimportar:huerfanos:dry     # Dry-run: muestra qué insertaría sin tocar la BD
```

> **Package manager**: El proyecto usa **pnpm** (migrado de npm el 2026-05-14). Usar `pnpm` para todos los comandos. La flag `--webpack` en `pnpm dev` es permanente — Turbopack causa un FATAL panic en Windows con `@react-pdf/renderer`. (Next.js 16 usa `--webpack` para forzar webpack; `--no-turbo` ya no existe).

## Database Connection

Connects via Supabase Pooler (Transaction mode). Required `.env` variables:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_DB_PASSWORD          # PostgreSQL password (≠ service role key)
SUPABASE_DB_HOST              # e.g. aws-0-us-west-2.pooler.supabase.com
SUPABASE_DB_PORT              # 6543 for Transaction pooler
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_HCAPTCHA_SITE_KEY # Site key de hCaptcha — requerida en login y registro.
```

### hCaptcha — configuración por entorno

| Entorno | Site Key (frontend) | Captcha secret (Supabase Dashboard → Authentication → Attack Protection) |
|---------|--------------------|--------------------------------------------------------------------|
| **Dev** (localhost) | `10000000-ffff-ffff-ffff-000000000001` | `0x0000000000000000000000000000000000000000` |
| **Producción** | `c6b4e730-e20e-484e-8420-b9b21a242408` | Guardado en gestor de secretos (NO commitearlo aquí) |

> El secret key de producción NO se documenta en este archivo porque CLAUDE.md es commiteado a git. Guardarlo en un gestor de contraseñas o en las variables de entorno del proveedor de hosting.

## Migration System

`scripts/migrate.js` tracks applied files in `schema_migrations` table. Each run skips already-applied files. Every SQL file must be **idempotent**:

- Tables: `CREATE TABLE IF NOT EXISTS`
- Indexes: `CREATE INDEX IF NOT EXISTS`
- Policies: `DROP POLICY IF EXISTS "name" ON table; CREATE POLICY ...`
- Triggers: `DROP TRIGGER IF EXISTS name ON table; CREATE TRIGGER ...`
- Functions: `CREATE OR REPLACE FUNCTION`

### Applied migrations (50 total, in order)

| File | Content | Status |
|------|---------|--------|
| `schema.sql` | Core tables: profiles, projects, budgets, chapters, activities, apus, apu_items, materials, labor, equipment, user_materials | ✅ applied |
| `20260504103000_parametros_fiscales.sql` | Colombian fiscal parameters (SMMLV, ARL factors) + seed 2025 | ✅ applied |
| `20260504103500_profiles_fiscal.sql` | AIU defaults on profiles, `municipios` table with ReteICA | ✅ applied |
| `20260504104000_rls_audit.sql` | Soft-delete (`deleted_at`), active views, audit_log, RLS reinforcement | ✅ applied |
| `20260504104500_budget_estados.sql` | Budget state machine, `budget_snapshots`, version trigger | ✅ applied |
| `20260504105000_ia_security.sql` | Tablas legacy `ai_usage` + config IA en profiles (ya no usadas en la app pero presentes en BD) | ✅ applied |
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
| `20260511130000_estados_proyecto_presupuesto.sql` | **Actualización**: `projects.estado` cambia constraint a `borrador\|en_progreso\|finalizado\|archivado`; migra `activo/pausado→en_progreso`, `completado→finalizado`; default ahora `borrador` | ✅ applied |
| `20260511140000_fix_estados_proyecto.sql` | **Idempotente**: repite el fix de estados con UPDATE antes de ADD CONSTRAINT; segundo guard por si `130000` falló parcialmente | ✅ applied |
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
| `20260514100000_fix_audit_log_rls.sql` | **Security fix**: Agrega política INSERT a `audit_log` — sin ella, los INSERTs desde Server Actions con JWT de usuario eran bloqueados por RLS (solo existía política SELECT) | ✅ applied |
| `20260516100000_update_trabajadores_2026.sql` | **Seed update**: Actualiza los 25 jornales en `trabajadores` a valores coherentes con SMMLV 2026 ($1.423.500/mes). `jornal_con_prestaciones` se recalcula automáticamente (GENERATED ALWAYS AS). | ✅ applied |
| `20260516200000_proveedores.sql` | **Módulo Proveedores**: Tabla `proveedores` (7 categorías de construcción colombiana: ferreteria/contratista/equipos/laboratorio/transporte/servicios/otro) + soft-delete con `deleted_at` + RLS + `proveedor_id` nullable en `apu_items` (FK futura para asociar insumos a proveedor) | ✅ applied |
| `20260516300000_fix_materials_duplicados.sql` | **Bug fix**: Elimina 7 filas duplicadas en `materials` (conserva el de mayor `id` por `nombre+categoria`); agrega `UNIQUE INDEX materials_nombre_categoria_unique` para prevenir recurrencia | ✅ applied |
| `20260517100000_budget_aprobacion.sql` | **Flujo aprobación**: Normaliza `check_budget_estado` a `borrador\|en_revision\|aprobado\|rechazado\|archivado`; actualiza `fn_increment_budget_version` para limpiar `aprobado_en = NULL` al reabrir a borrador | ✅ applied |
| `20260517200000_drop_legacy_estado_check.sql` | **Bug fix**: Elimina constraint legado `budgets_estado_check` que bloqueaba la transición `borrador → en_revision` (no incluía `'en_revision'` como valor válido) | ✅ applied |
| `20260519100000_seed_cuadrillas_base.sql` | **Seed**: 10 cuadrillas de sistema (`es_sistema = true`, `user_id = NULL`) para las categorías base de construcción colombiana — Mampostería, Concreto, Pañete, Hidrosanitaria, Eléctrica, Excavación, Pisos, Pintura, Estructura Metálica, Topografía. Busca trabajadores por nombre exacto sin hardcodear UUIDs. | ✅ applied |
| `20260519110000_fix_cuadrillas_trabajadores.sql` | **Fix**: Completa los trabajadores de 6 cuadrillas que fallaron por mismatch de tildes (`albañil`, `Topógrafo`, `Ayudante construcción`) en los ILIKE del seed anterior. Usa nombres exactos con tildes. | ✅ applied |
| `20260520100000_security_rls_audit.sql` | **Security audit**: Corrige 5 vulnerabilidades RLS: (1) `v_resumen_presupuesto` recreada con `security_invoker = true` — sin el flag, la vista bypasseaba RLS y exponía presupuestos de otros usuarios; (2) elimina `budgets_update_own` que anulaba el bloqueo de `aprobado` vía OR lógico; (3) agrega políticas INSERT/DELETE faltantes en `budget_snapshots`; (4) elimina `cuadrillas_usuario_crud` (FOR ALL sin `deleted_at`) que rompía el soft-delete; (5) limpia políticas duplicadas en `ai_conversations/ai_usage/ai_messages`. | ✅ applied |
| `20260521100000_fn_duplicar_presupuesto.sql` | **Función atómica**: `fn_duplicar_presupuesto(p_budget_id, p_user_id)` — duplica presupuesto completo (capítulos + actividades + APUs + apu_items) en una sola transacción. SECURITY DEFINER con verificación de ownership. Reemplaza loop de INSERTs individuales en el Server Action. | ✅ applied |
| `20260522100000_seed_municipios_completo.sql` | **Seed**: Todos los municipios de Colombia con tasas ReteICA por ciudad. | ✅ applied |
| `20260526100000_trabajadores_usuario.sql` | **Schema + RLS**: Agrega `user_id UUID` a `trabajadores`; reemplaza índice único de `especialidad` por dos índices parciales (`IS NULL` para sistema, `(especialidad, user_id)` para propios); 4 políticas RLS CRUD por `user_id` — catálogo sistema siempre legible, modificaciones solo sobre propios. | ✅ applied |
| `20260527100000_user_precios_insumos.sql` | **Schema**: Tablas `user_material_precios` y `user_equipment_precios` — override de precio por usuario para materiales y equipos del catálogo. Cada tabla tiene `UNIQUE(user_id, material/equipment_id)` + RLS FOR ALL. | ✅ applied |
| `20260527200000_insumos_activo.sql` | **Schema**: Agrega columna `activo BOOLEAN DEFAULT true` a `user_material_precios` y `user_equipment_precios`; hace `precio_unitario`/`precio_diario` nullable para permitir cambiar solo el estado activo sin personalizar precio. | ✅ applied |
| `20260601100000_roles_usuario.sql` | **Sistema de roles Fase 1**: `profiles.rol TEXT DEFAULT 'usuario' CHECK (IN 'usuario','super_admin')` + políticas RLS en `catalogo_capitulos/actividades/apu_items` — SELECT público, INSERT/UPDATE/DELETE solo `super_admin`. | ✅ applied |
| `20260601110000_fix_rol_default.sql` | **Security fix**: Corrige DEFAULT de `profiles.rol` a `'usuario'`; resetea a `'usuario'` todos los perfiles incorrectamente asignados como `super_admin` excepto el de Deisy (`deisypaolaarteaga@gmail.com`). | ✅ applied |
| `20260601200000_user_plantillas.sql` | **Plantillas personales**: 4 tablas `user_plantillas`, `user_plantillas_capitulos`, `user_plantillas_actividades`, `user_plantillas_apu_items` + RLS FOR ALL con verificación de ownership en cascada. | ✅ applied |
| `20260601120000_proveedores_activo.sql` | **Schema**: Columna `activo BOOLEAN NOT NULL DEFAULT true` en `proveedores` + índice parcial `idx_proveedores_activo(user_id, activo) WHERE deleted_at IS NULL`. Permite habilitar/inhabilitar sin eliminar. | ✅ applied |
| `20260601300000_activities_catalogo_ref.sql` | **Trazabilidad**: Columna `catalogo_actividad_id UUID` nullable en `activities` — indica de qué actividad del catálogo proviene la actividad del presupuesto (NULL si fue creada manualmente). | ✅ applied |
| `20260601400000_plantillas_tipo_obra.sql` | **Idempotente**: Asegura que `user_plantillas.tipo_obra TEXT NULL` exista — guard para entornos que aplicaron la tabla sin esa columna antes del 2026-06-01. | ✅ applied |
| `20260602100000_eliminar_archivar_proyectos_presupuestos.sql` | Flujo eliminación/archivado: `fn_archivar_proyecto` + `fn_eliminar_proyecto` SECURITY DEFINER con cascada en budgets. Soft-delete en proyectos (projects ya tenía deleted_at desde migración 104000). | ✅ applied |

### Loose SQL files at root (already applied manually — do NOT re-run)

`cuadrillas_schema.sql`, `ai-tables.sql`, `migration_motor_calculo.sql`, `migration_motor_2026.sql`, `preferences_column.sql`, `trigger-profiles.sql`, `seed.sql`, `seed_cuadrillas.sql`, `seed_data.sql` — these were executed directly in Supabase Dashboard and are **already reflected in the database**. Their triggers and functions are now superseded by `20260507100000_fix_trigger_chain.sql`. Do not add them to `migrate.js`.

## Current Database State (as of 2026-06-02)

**34 tables + 5 views** in `public` schema. (4 tablas nuevas de plantillas personales: `user_plantillas`, `user_plantillas_capitulos`, `user_plantillas_actividades`, `user_plantillas_apu_items`). Jornales en `trabajadores` actualizados a SMMLV 2026 ($1.423.500/mes). Tabla `materials` deduplicada (46 filas, índice único en `nombre+categoria`). `profiles.rol` DEFAULT corregido a `'usuario'` (migración `20260601110000`). `activities.catalogo_actividad_id` UUID nullable añadida para trazabilidad. `proveedores.activo BOOLEAN DEFAULT true` añadida para habilitar/inhabilitar sin eliminar. `projects.deleted_at` ya existía (migración `20260504104000`). Estado `archivado` operativo con cascada via `fn_archivar_proyecto`. Key tables and their non-obvious columns:

| Table | Key columns beyond the obvious |
|-------|-------------------------------|
| `budgets` | `metodo_aiu` ('porcentaje'\|'detallado'), `administracion_pct`, `imprevistos_pct`, `utilidad_pct`, `gastos_fijos_mensuales`, `duracion_meses`, `metodo_iva`, `mostrar_retenciones`, `retefuente_pct`, `ica_pct`, `reteiva_pct`, `ciudad_ica`, `costo_directo`, `vigencia_dias` |
| `apus` | `costo_herramienta_menor`, `costo_epp`, `pct_herramienta_menor` (default 3%), `pct_epp` (default 1%), `rendimiento` |
| `apu_items` | `tipo` IN ('material','mano_obra','equipo','herramienta_menor','epp'); `cuadrilla_id` UUID nullable; `proveedor_id` UUID nullable (FK futura a `proveedores`) |
| `activities` | `precio_desde_apu` BOOLEAN — when true, `precio_unitario` is read from the linked APU; `catalogo_actividad_id UUID` nullable — trazabilidad hacia `catalogo_actividades` |
| `profiles` | `preferences` JSONB (accentColor, density, showCompanyName, defaultCity), `nivel_riesgo_arl` (1-5), `municipio`, `telefono`, `direccion`, `email_empresa`, AIU defaults, `rol TEXT DEFAULT 'usuario' CHECK (IN 'usuario','super_admin')` |
| `catalogo_capitulos` | Reference catalog — 28 chapters across residencial/comercial/infraestructura |
| `catalogo_actividades` | 164 reference activities with `precio_referencia_nacional`, `rango_min`, `rango_max` (COP 2025) |
| `catalogo_apu_items` | APU reference items per activity — tipo, nombre, unidad, cantidad, precio_unitario, orden (public read) |
| `clientes` | `tipo` ('persona_natural'\|'empresa'), `nombre_razon_social`, `nit_cedula`, `nombre_contacto`, `cargo_contacto`, `ciudad`, `email`, `telefono`; soft-delete via `activo BOOLEAN` |
| `proveedores` | `tipo` ('persona'\|'empresa'), `nombre_razon_social`, `nit_cedula`, `categoria` IN (ferreteria/contratista/equipos/laboratorio/transporte/servicios/otro), `ciudad`, `email`, `telefono`, `sitio_web`; soft-delete via `deleted_at TIMESTAMPTZ`; `activo BOOLEAN DEFAULT true` para habilitar/inhabilitar sin eliminar |
| `trabajadores` | `user_id UUID` nullable — `NULL` = catálogo sistema (público), `auth.uid()` = propio del usuario. Índices parciales: `idx_trabajadores_esp_sistema` (único por especialidad cuando `user_id IS NULL`), `idx_trabajadores_esp_usuario` (único por `(especialidad, user_id)` cuando `user_id IS NOT NULL`). |
| `user_material_precios` | Override de precio de materiales del catálogo por usuario: `user_id`, `material_id`, `precio_unitario NUMERIC(15,2)` nullable, `activo BOOLEAN DEFAULT true`. `UNIQUE(user_id, material_id)`. RLS FOR ALL. |
| `user_equipment_precios` | Override de precio diario de equipos del catálogo por usuario: `user_id`, `equipment_id`, `precio_diario NUMERIC(15,2)` nullable, `activo BOOLEAN DEFAULT true`. `UNIQUE(user_id, equipment_id)`. RLS FOR ALL. |

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
| `src/actions/` | All data mutations as `'use server'` Server Actions; validate with Zod, then Supabase. Archivos: `analytics.ts`, `apariencia.ts` (persiste `preferences` JSONB en profiles), `auth.ts` (9 exports: `signIn`, `sendOtp`, `verifyOtp`, `signUp`, `signInWithGoogle`, `signOut`, `resetPassword`, `cambiarContrasena`, `updatePassword`), `catalogo.ts` (17 exports — CRUD completo de capítulos, actividades y APU items del catálogo), `clientes.ts`, `configuracion-fiscal.ts` (params IVA/AIU/retenciones del presupuesto), `cuadrillas.ts`, `insumos.ts`, `mano-obra.ts`, `onboarding.ts`, `pdf.ts`, `perfil.ts`, `plantillas.ts` (7 exports: `guardarComoPlantilla`, `getMisPlantillas`, `eliminarPlantilla`, `aplicarPlantilla`, `renombrarPlantilla`, `getDetallePlantilla`, `actualizarEstructuraPlantilla`), `presupuesto-estados.ts` (máquina de estados: enviar/aprobar/rechazar/reabrir), `presupuestos.ts`, `proveedores.ts`, `proyectos.ts` (agrega 5 nuevas acciones: `archivarProyecto`, `eliminarProyecto`, `desArchivarProyecto`, `archivarPresupuesto`, `eliminarPresupuesto` con verificación de ownership y mensajes de error P0001 en español colombiano) |
| `src/app/(auth)/` | Public routes: `login` (2FA: paso 1 credenciales → paso 2 OTP 6 dígitos), `registro` (nombre+email+contraseña), `recuperar-contrasena`, `nueva-contrasena` |
| `src/app/(dashboard)/` | Protected routes behind sidebar layout |
| `src/lib/utils/periodos.ts` | `PeriodoPicker`, `RangoPeriodo`, `OPCIONES_PERIODO`, `getRangoPeriodo(periodo)` — calcula rangos de fecha con timezone `America/Bogota`. Retorna `null` para `'todo'` (sin filtro). |
| `src/components/shared/SelectorPeriodo.tsx` | Dropdown controlado con las 5 opciones de período. Acepta `value` + `onChange`. Se cierra al hacer clic fuera. Reutilizable en dashboard y proyectos. |
| `src/components/dashboard/DashboardClient.tsx` | Client component con toda la UI del dashboard. Gestiona estado `periodo` y re-fetcha `getKPIsGlobales`/`getDistribucionCD` con `useTransition` al cambiar el período. |
| `src/components/shared/` | UI primitives (Sidebar, Logo, EstadoBadge, InputEditable, SelectorPeriodo, etc.) — always reuse before creating new components |
| `src/components/clientes/` | `ClientesList.tsx`, `ClientesNewButton.tsx`, `ModalCliente.tsx`, `MunicipioCombobox.tsx`, `ClienteSelector.tsx`, `ClienteDetailActions.tsx`, `ProyectosAsociadosCliente.tsx` (lista proyectos del cliente, sin botón eliminar) |
| `src/components/plantillas/` | `PlantillasClient.tsx` (lista/grid de plantillas del usuario), `DrawerDetallePlantilla.tsx` (preview de estructura completa), `ModalRenombrarPlantilla.tsx` — página `/plantillas` en `src/app/(dashboard)/plantillas/` |
| `src/components/proveedores/` | `ProveedoresList.tsx` (grid con filtros tipo/categoría), `ProveedoresNewButton.tsx`, `ModalProveedor.tsx` (form con 7 categorías + ciudad select) |
| `src/app/(dashboard)/parametros-fiscales/` | Página de configuración de parámetros AIU/IVA globales (cliente); usa `src/components/configuracion/FiscalForm.tsx` |
| `src/components/presupuestos/` | Editor principal (`EditorPresupuesto.tsx`), `PanelAPU.tsx`, `ExplosionInsumosView.tsx`, `ResumenFinancieroTab.tsx` (pestaña activa), `ResumenFinanciero.tsx` (colapsible), `ResumenFinancieroVisual.tsx` (tarjetas KPI), `BotonEnviarRevision.tsx` (enviar a revisión), `ModalValidacionExport.tsx` (validación pre-PDF), `EstadoBadge.tsx`, `ModalVistaPrevia.tsx` + `ModalVistaPreviaInner.tsx` (vista previa PDF), `ModalCuadrillaAPU.tsx` (selector cuadrilla en Panel APU), `PresupuestosClientList.tsx` + `PresupuestosTable.tsx` (lista de presupuestos con filtros) |
| `src/lib/calculos/` | Budget calculation engine + tests |
| `src/lib/excel/exportarPresupuestoExcel.ts` | Genera `.xlsx` en browser: 4 hojas (Resumen, Presupuesto, APUs, Insumos). Usa SheetJS `XLSX.write` + Blob. Mismos cálculos con `decimal.js` que el PDF — nunca floats nativos. |
| `src/components/pdf/` | `PresupuestoPDF.tsx`, `APUDetallePDF.tsx`, `PresupuestoCompletoConAPU.tsx`, `BotonExportarPDF.tsx`, `BotonExportarExcel.tsx` (import dinámico del helper Excel) |
| `src/lib/supabase/` | `client.ts` (browser), `server.ts` (server + `createAdminClient()`), `middleware.ts` (session + route guard) |
| `src/lib/auth/roles.ts` | `isSuperAdmin(userId)` — consulta `profiles.rol` vía admin client, retorna `true` si `rol === 'super_admin'`. Usar en Server Actions del catálogo para autorizar CRUD. |
| `src/components/catalogo/` | `CatalogoView.tsx` (tabla principal con tabs tipo_obra), `CatalogoActividadDrawer.tsx` (drawer de detalle/APU items), `ModalCrearCapitulo.tsx`, `ModalEditarCapitulo.tsx`, `ModalCrearActividad.tsx`, `ModalEditarActividad.tsx` — CRUD visual solo visible para `super_admin` |
| `src/app/(dashboard)/catalogo/` | Página `/catalogo` — tabla editable del catálogo de referencia; acceso restringido a `super_admin` vía `isSuperAdmin()` en el Server Component |
| `src/lib/validations/schemas.ts` | Single source of truth for all Zod schemas — edit here first |
| `src/types/index.ts` | All TypeScript interfaces |
| `supabase/migrations/` | Tracked SQL migrations (timestamped, idempotent) |
| `scripts/migrate.js` | Migration runner with `schema_migrations` tracking |
| `scripts/seed-catalogo.ts` | Reference catalog seed (run with `pnpm run seed:catalogo`) |
| `scripts/verificar-fix.ts` | End-to-end test: simula `crearPresupuestoConPlantilla` completo y verifica chapters+activities+APUs en BD |
| `scripts/check-catalogo.ts` | Verifica conteos de catálogo y presupuestos recientes via REST API |
| `scripts/check-catalog-integrity.ts` | Verifica integridad del catálogo (capítulos sin actividades, actividades sin apu_items) vía Supabase REST |
| `scripts/debug-plantilla.ts` | Diagnóstico de `crearPresupuestoConPlantilla` — replica la lógica de la acción para encontrar dónde falla |
| `scripts/master-fill-all-prices.ts` | Pobla precios 2026 en actividades del catálogo con `precio_unitario = 0` |
| `scripts/master-fill-catalogo-prices.ts` | Variante focada de llenado de precios del catálogo |
| `scripts/seed_catalogo_items_2026.ts` | Seed masivo de ítems APU de referencia (`catalogo_apu_items`) con proporciones por categoría Colombia 2026 — soporta `--reset` y `--dry-run` |
| `scripts/verificar-rls.ts` | Verifica aislamiento RLS entre usuarios (crea user_A y user_B, valida que cada uno solo ve sus propios datos) |
| `scripts/diagnostico-capitulos-huerfanos.ts` | Diagnóstico: lista capítulos/actividades del catálogo sin `catalogo_apu_items` (huérfanos), agrupados por tipo_obra. Soporta `--json`. |
| `scripts/reimportar-capitulos-huerfanos.ts` | Reimportación: inserta `catalogo_apu_items` en actividades huérfanas usando proporciones del mercado colombiano 2025 por categoría. Soporta `--dry-run`, `--force`. |

### Supabase Clients — dos tipos

| Función | Key usada | RLS | Cuándo usar |
|---------|-----------|-----|-------------|
| `createClient()` | ANON_KEY + user JWT (cookies) | Aplicado | Server Components, la mayoría de Server Actions |
| `createAdminClient()` | SERVICE_ROLE_KEY | Omitido | INSERTs masivos desde catálogo, seeds. Usuario ya verificado en el mismo action |

**Regla crítica:** El cliente de usuario (`createClient`) no propaga correctamente el JWT a PostgREST en Server Actions de larga duración. Usar `createAdminClient` para todos los INSERTs en `importarDesdeCatalogo` y `crearPresupuestoConPlantilla`. La autenticación del usuario sigue verificándose con `supabase.auth.getUser()` al inicio de cada action.

### Authentication & Routing

Cookie-based Supabase Auth. `src/middleware.ts` (Next.js middleware entry point) llama a `updateSession` en `src/lib/supabase/middleware.ts`, que refresca tokens y protege rutas `(dashboard)`. `src/proxy.ts` fue eliminado (conflicto con `middleware.ts` en Next.js 16).

## Feature Implementation Workflow

1. Add/update Zod schema in `src/lib/validations/schemas.ts`
2. Update TypeScript interfaces in `src/types/index.ts`
3. If DB change needed: create `supabase/migrations/TIMESTAMP_description.sql` (idempotent), add to `migrate.js`, run `pnpm run migrate`
4. Implement Server Action in `src/actions/` with Zod parse + Supabase call
5. Build/update UI using `src/components/shared/` primitives
6. If financial math: use `decimal.js`, add test in `src/lib/calculos/motor-presupuesto.test.ts`

## Design System

Tailwind v4 with semantic CSS variables in `src/app/globals.css`:
`primary`, `secondary`, `success`, `warning`, `danger`, `info` + neutral palette.
Token reference: `src/lib/design-tokens.ts`. User accent color stored in `profiles.preferences.accentColor`.

## Known Remaining Tasks

> **Snapshot:** 2026-06-02 (actualizado) — `tsc --noEmit --skipLibCheck` limpio (0 errores). `pnpm build` exitoso. **50 migraciones en `migrate.js`** (todas rastreadas). Rama `rama-deisy`. **17 archivos de Server Actions** (`catalogo.ts` con 17 exports; `auth.ts` con 9 exports; `plantillas.ts` con 7 exports; `proyectos.ts` ampliado con 5 nuevas acciones: `archivarProyecto`, `eliminarProyecto`, `desArchivarProyecto`, `archivarPresupuesto`, `eliminarPresupuesto`). 5 componentes PDF. Motor `motor-presupuesto.ts` (219 líneas) con **9 tests Vitest pasando** (110 líneas). `src/middleware.ts` activo (`proxy.ts` eliminado). Sistema de roles `usuario`/`super_admin` con RLS. Módulo Catálogo editable para `super_admin`. Login 2FA por OTP. `fn_duplicar_presupuesto` atómica. hCaptcha eliminado. **34 tablas + 5 vistas en BD**. Filtros de período. Módulo Plantillas personales completo (`/plantillas` + DrawerDetalle + Renombrar). `proveedores.activo` + `activities.catalogo_actividad_id` añadidos. `ProyectosAsociadosCliente` sin botón eliminar proyecto. Flujo completo eliminar/archivar proyectos y presupuestos con ConfirmDialog, validaciones en BD y mensajes claros en español.

### Pendiente — acción manual requerida
- Presupuestos creados antes del fix de admin client (2026-05-07) tienen 0 actividades — deben eliminarse y recrearse con "Plantilla Sugerida"
- ~~Reimportar capítulos del catálogo que existan en BD sin `apu_items`~~ — Scripts listos: `pnpm run diagnostico:huerfanos` (identifica) + `pnpm run reimportar:huerfanos` (corrige). Correr en ese orden. Scripts: `scripts/diagnostico-capitulos-huerfanos.ts` y `scripts/reimportar-capitulos-huerfanos.ts`.
- ~~**`20260522100000_seed_municipios_completo.sql` no está en `migrate.js`**~~ ✅ 2026-05-31 — ya agregado al array `migrationFiles` en `scripts/migrate.js` (posición 41). El runner la salta con SKIP porque ya estaba en `schema_migrations`.

### Pendiente — próximas features (prioridad alta)
~~- **Plantillas personales de usuario**~~ ✅ 2026-06-01 — `user_plantillas` + 3 tablas hijas con RLS (migraciones `20260601200000` + `20260601400000`). `src/actions/plantillas.ts` (7 exports: `guardarComoPlantilla`, `getMisPlantillas`, `eliminarPlantilla`, `aplicarPlantilla`, `renombrarPlantilla`, `getDetallePlantilla`, `actualizarEstructuraPlantilla`). `ModalGuardarPlantilla.tsx` en header del editor. `ModalNuevoPresupuesto` con sección "Mis plantillas" + 3 modos (estructura/con precios/todo igual). Página `/plantillas` con `PlantillasClient.tsx`, `DrawerDetallePlantilla.tsx` (preview completo de capítulos+actividades+APU items), `ModalRenombrarPlantilla.tsx`. `tsc` limpio ✅.
~~- **Panel APU — fix duplicados en apu_items**~~ ✅ 2026-05-18 — `guardarAPU` en `presupuestos.ts`: cuando `payload.id` no viene del cliente, ahora busca primero un APU existente para la actividad (`maybeSingle()` con filtro `activity_id + user_id + deleted_at IS NULL`) antes de insertar uno nuevo. Elimina la condición de carrera que creaba APUs duplicados al guardar dos veces sin recargar.
- **n8n reportes**: Integración con n8n para envío automático de reportes PDF por email al aprobar presupuesto.

### Pendiente — autenticación
~~- **`middleware.ts` NO EXISTE**~~ ✅ 2026-05-31 — `src/middleware.ts` creado (el de 2026-05-18 se perdió); llama a `updateSession` de `@/lib/supabase/middleware`. Matcher excluye `_next/static`, `_next/image`, `favicon.ico` y archivos estáticos.
~~- **hCaptcha no integrado en login/registro**~~ ~~✅ 2026-05-22~~ **Revertido 2026-05-25** — hCaptcha eliminado completamente. `@hcaptcha/react-hcaptcha` desinstalado. Widgets, estados `captchaToken`, imports `dynamic` y parámetros `captchaToken` removidos de `login/page.tsx`, `registro/page.tsx` y `auth.ts`. Entradas CSP de hCaptcha eliminadas de `next.config.ts`.
~~- **2FA por OTP al correo**~~ ✅ 2026-05-25 — Flujo 2 pasos en `login/page.tsx`: (1) email+contraseña → `signIn` verifica con `signInWithPassword`, destruye sesión temporal con `signOut()`, envía OTP con `signInWithOtp({ shouldCreateUser: false })`, devuelve `{ email }`. (2) Pantalla OTP: 6 inputs individuales con auto-avance, backspace, paste; countdown 60s con botón "Reenviar código"; `verifyOtp` llama `supabase.auth.verifyOtp({ type: 'email' })` y redirige al dashboard. Nuevas acciones en `auth.ts`: `sendOtp(email)` y `verifyOtp(email, token)`.
- **Supabase Auth Dashboard**: Verificar en Authentication → URL Configuration que `Site URL = http://localhost:3000` y Redirect URLs incluye `http://localhost:3000/**`. Sin esto el callback de confirmación de email falla.
- **Supabase OTP — habilitar en Dashboard**: Para que `signInWithOtp` funcione, debe estar habilitado en Supabase Dashboard → Authentication → Providers → Email → "Enable Email OTP". Sin esto el envío del código fallará.

### Pendiente — deuda técnica
~~- **`ResumenFinancieroModal.tsx` en disco sin importar**~~ ✅ 2026-05-18 — archivo ya no existe en el proyecto.
~~- **`old_sidebar.tsx` en raíz del proyecto**~~ ✅ 2026-05-18 — archivo ya no existe en el proyecto.
~~- **`src/proxy.ts` conflicto con `middleware.ts`**~~ ✅ 2026-06-01 — `src/proxy.ts` eliminado definitivamente. `src/middleware.ts` es el único archivo de middleware activo. Next.js 16 muestra warning de deprecación (`middleware → proxy`) pero el build pasa sin errores.

~~### Pendiente — errores TypeScript (5 archivos, descubiertos 2026-05-13)~~ ✅ 2026-05-13 — todos resueltos. **Estado actual (2026-05-19): `tsc --noEmit --skipLibCheck` sin errores (0 líneas de output).**

### Pendiente — deuda técnica (histórico)
~~- Turbopack FATAL panic en Windows con `@react-pdf/renderer` — OS error 5 "Acceso denegado" al crear junction points~~ ✅ 2026-05-14 — `package.json` restaurado a `next dev --no-turbo` (flag se perdió al migrar a pnpm)
~~- Legacy tables `users`, `usuarios` — verificar que no se usan antes de eliminar~~ ✅ 2026-05-11
~~- Imprecisión de punto flotante en `apus.costo_total` GENERATED (ej: `26757.96000000000...`) — columna NUMERIC debería usar escala fija `NUMERIC(15,2)`~~ ✅ 2026-05-11
~~- `ResumenFinancieroModal.tsx` líneas 416-425 — fragmento huérfano de versión anterior causaba 14 errores TS1005/TS1109 parse errors~~ ✅ 2026-05-13

### Completado ✅
- ~~**Flujo eliminación y archivado de proyectos y presupuestos**~~ ✅ 2026-06-02 — Migración `20260602100000`: `fn_archivar_proyecto` (bloquea si hay `aprobado`/`en_revision`, archiva en cascada) + `fn_eliminar_proyecto` (soft-delete en cascada). `ProyectosGrid.tsx`: "Archivar" con ConfirmDialog warning, "Eliminar" solo en `borrador`/`archivado`, "Desarchivar" → `borrador`. `PresupuestosClientList` + `PresupuestosTable`: menú ⋯ por fila con acciones según estado (`borrador`→Archivar/Eliminar, `aprobado`→solo lectura, `rechazado`→Archivar/Eliminar, `archivado`→Eliminar). `ConfirmDialog.tsx`: Cancelar enfocado por defecto, Enter no confirma. `tsc` limpio ✅.
- ~~**`proveedores.activo` — habilitar/inhabilitar sin eliminar**~~ ✅ 2026-06-01 — migración `20260601120000_proveedores_activo.sql`: columna `activo BOOLEAN NOT NULL DEFAULT true` en `proveedores` + índice parcial. `ProveedoresList.tsx` tiene toggle activo/inactivo + filtro "Ocultar inactivos". `tsc` limpio ✅.
- ~~**`activities.catalogo_actividad_id` — trazabilidad catálogo**~~ ✅ 2026-06-01 — migración `20260601300000_activities_catalogo_ref.sql`: columna `catalogo_actividad_id UUID` nullable en `activities`. `activities` creadas desde catálogo/plantilla llevan la referencia; creadas manualmente tienen `NULL`. Tipo `Activity.catalogo_actividad_id` añadido en `src/types/index.ts`. `tsc` limpio ✅.
- ~~**Eliminar botón Trash2 de `ProyectosAsociadosCliente`**~~ ✅ 2026-06-01 — Removidos botón Trash2, ConfirmDialog, `deleteProject` import, `confirmEliminar` state, `handleEliminarProyecto` function y `useRouter` de `src/components/clientes/ProyectosAsociadosCliente.tsx`. `tsc` limpio ✅.
- ~~**Sistema de roles `super_admin` / `usuario`**~~ ✅ 2026-06-01 — `profiles.rol TEXT DEFAULT 'usuario' CHECK (IN 'usuario','super_admin')` + políticas RLS en `catalogo_capitulos/actividades/apu_items` (SELECT público, INSERT/UPDATE/DELETE solo `super_admin`). Migraciones `20260601100000_roles_usuario.sql` + `20260601110000_fix_rol_default.sql` (resetea todos a `usuario` excepto Deisy). Helper `src/lib/auth/roles.ts` → `isSuperAdmin(userId)`. Sidebar muestra "Administrador" para `super_admin`.
- ~~**Módulo Catálogo editable para `super_admin`**~~ ✅ 2026-06-01 — `/catalogo` página con `CatalogoView.tsx` (tabs por tipo_obra, tabla de capítulos + actividades), `CatalogoActividadDrawer.tsx` (detalle con APU items inline), 4 modales CRUD: `ModalCrearCapitulo`, `ModalEditarCapitulo`, `ModalCrearActividad`, `ModalEditarActividad`. `catalogo.ts` ampliado a 17 exports: CRUD de capítulos, actividades y `catalogo_apu_items` + `sugerirCorreccionPrecio`. Acceso restringido a `super_admin` vía `isSuperAdmin()` en el Server Component.
- ~~**Responsive móvil — tablas y headers**~~ ✅ 2026-05-31 — (1) `ClientesList.tsx`: columnas CONTACTO ocultas con `hidden sm:table-cell`, PROYECTOS e INVERSIÓN TOTAL con `hidden md:table-cell`; pills de filtro tipo con `flex-wrap`. (2) `ProveedoresList.tsx`: botón "Nuevo Proveedor" con `w-full sm:w-auto justify-center`. (3) `insumos/page.tsx` + `mano-obra/page.tsx`: header refactorizado a `flex flex-col gap-2`; contenedor de botones a `flex flex-wrap gap-2 w-full`; cada botón con `w-full sm:w-auto`.
- ~~**Catálogo de Insumos — precios propios por usuario**~~ ✅ 2026-05-27 — Módulo Insumos reescrito con override de precios por usuario para materiales y equipos del catálogo (tablas `user_material_precios` + `user_equipment_precios`). `toggleMaterialActivo`/`toggleEquipoActivo` en `insumos.ts`; lápiz inline para editar precio; botón reset restaura precio de catálogo. Columna `activo` permite inhabilitar ítems sin perder la personalización.
- ~~**Trabajadores propios por usuario**~~ ✅ 2026-05-26 — `trabajadores.user_id` agrega soporte multi-tenant: catálogo sistema (`user_id IS NULL`) público + trabajadores propios (`user_id = auth.uid()`) con CRUD completo. Índices parciales para garantizar unicidad por scope. `ModalTrabajador.tsx` para crear/editar propios. `mano-obra/page.tsx` ampliado con toggle activo/inactivo, editar y eliminar propios.
- ~~**Filtros de período en dashboard y proyectos**~~ — 5 opciones (Todo el tiempo / Este mes / Mes pasado / Este trimestre / Este año) con timezone `America/Bogota`. **Dashboard:** `page.tsx` se redujo a wrapper Server Component; `DashboardClient.tsx` (client) tiene el selector en el header y re-fetcha `getKPIsGlobales` + `getDistribucionCD` vía `useTransition` al cambiar período — la UI se atenúa sin bloquear; `proximos_a_vencer` siempre sin filtro de período (métrica de futuro). **Proyectos:** `SelectorPeriodo` en barra de búsqueda; filtro cascada período→estado→búsqueda sobre filas; contadores de pills siempre sobre `projects` completo (no cambian con el período); empty state contextual según período + estado activos. Archivos nuevos: `src/lib/utils/periodos.ts`, `src/components/shared/SelectorPeriodo.tsx`, `src/components/dashboard/DashboardClient.tsx`. Modificados: `analytics.ts` (acepta `RangoOpts { desde?, hasta? }`), `dashboard/page.tsx`, `ProyectosGrid.tsx`. `tsc` limpio ✅ 2026-05-26
- ~~**2FA por OTP al correo en login**~~ — `login/page.tsx` reescrito con flujo 2 pasos: (1) email+contraseña → `signIn` verifica credenciales con `signInWithPassword`, destruye sesión temporal con `signOut()`, envía OTP con `signInWithOtp({ shouldCreateUser: false })`, devuelve `{ email }`. (2) Pantalla OTP: 6 inputs individuales con auto-avance/backspace/paste, countdown 60s, botón "Reenviar código", botón "Volver". Verificación con `verifyOtp` establece sesión real y redirige al dashboard. Nuevas acciones en `auth.ts`: `sendOtp(email)` y `verifyOtp(email, token)`. `tsc` limpio ✅ 2026-05-25
- ~~**Formulario de registro simplificado**~~ — `registro/page.tsx`: eliminados campos `empresa` y `ciudad` (se recopilan en onboarding). Eliminados imports `Building2`, `MapPin`, `CIUDADES_COLOMBIA`. Quedan 4 campos: nombre completo, email, contraseña, confirmar contraseña ✅ 2026-05-25
- ~~**Bug `confirmPassword` en nueva-contrasena**~~ — `nueva-contrasena/page.tsx`: campo `name="confirmPassword"` corregido a `name="confirmar_password"` para coincidir con `nuevaContrasenaSchema`. El cambio de contraseña desde el link de recuperación fallaba silenciosamente ✅ 2026-05-25
- ~~**`resetPassword` redirectTo corregido**~~ — `auth.ts`: `redirectTo` de `resetPasswordForEmail` cambiado de `…/nueva-contrasena` a `…/auth/callback?next=/nueva-contrasena`. Ahora el link del email pasa por `/auth/callback` que intercambia el código por sesión antes de redirigir ✅ 2026-05-25
- ~~**Rediseño página Perfil (`/perfil`)**~~ — `src/components/perfil/PerfilEmpresaClient.tsx` reescrito completo con patrón Stripe/Vercel Settings: nav lateral sticky (`w-44`, scroll-spy via `IntersectionObserver`) + 4 secciones ancladas (`sec-empresa`, `sec-apariencia`, `sec-pdf`, `sec-seguridad`). **Empresa**: logo compacto (64px thumbnail + botones Cambiar/Eliminar en fila). **Apariencia**: 4 swatches tomados de `ACCENT_THEMES` vía `useTheme().updatePref()` — actualiza `--accent-primary` en DOM sin recarga, persiste en `profiles.preferences` con debounce 1s. **PDF y reportes**: firma en layout horizontal (140px preview + fields). **Seguridad**: email read-only + campos contraseña con Eye/EyeOff toggle. Inputs: `bg-[#F8F7F5] border border-[#E5E1D8]`. `tsc` + `pnpm build` limpios ✅ 2026-05-17
- ~~**Avatar burn-orange en toda la app**~~ — `src/components/shared/Avatar.tsx`: `bg-steel-fog text-steel-mid` → `bg-[#D95510] text-white`. Afecta `DashboardHeader` y cualquier otro uso del componente `Avatar` ✅ 2026-05-17
- ~~**Fix personalización de color vía ThemeProvider**~~ — Sección Apariencia en `PerfilEmpresaClient` ahora usa `useTheme().updatePref('accentColor', theme.primary)` con swatches tomados directamente de `ACCENT_THEMES` (`orange:#E8571A`, `blue:#1E6FB8`, `green:#2D7A45`, `gray:#4A5568`). Eliminados: `COLORES_ACENTO` (6 hexes que no coincidían con ningún key de `ACCENT_THEMES`), `guardandoApariencia` state, `handleGuardarApariencia` (llamaba server action sin tocar DOM). El CSS variable `--accent-primary` se aplica en tiempo real ✅ 2026-05-17
- ~~**`guardarApariencia` server action**~~ — `src/actions/apariencia.ts`: fusiona (`{ ...current.preferences, ...prefs }`) y persiste en `profiles.preferences` JSONB; disponible para uso desde otros componentes ✅ 2026-05-17
- ~~**`cambiarContrasena` en `auth.ts`**~~ — `src/actions/auth.ts`: acción para usuario autenticado que valida longitud ≥8 + coincidencia, luego llama `supabase.auth.updateUser({ password })` ✅ 2026-05-17
- ~~**Excel export**~~ — `src/lib/excel/exportarPresupuestoExcel.ts` genera `.xlsx` en browser con 4 hojas: **Resumen** (CD, AIU, IVA, Total Oferta, retenciones informativas + datos del proyecto/elaborador), **Presupuesto** (capítulos + actividades con cantidad, precio unit., total y % C.D.), **APUs** (todos los `apu_items` agrupados por actividad con tipo, cantidad, precio y subtotal), **Insumos** (explosión consolidada: agrupa por tipo+nombre+precio, multiplica `item.cantidad × act.cantidad` para obtener cantidad total en obra). `BotonExportarExcel.tsx` con import dinámico del helper. Botón aparece en header del editor y en panel lateral de exportación. Dependencia `xlsx 0.18.5` agregada. `tsc` + `pnpm build` limpios ✅ 2026-05-17
- ~~**PDF — 4 bugs corregidos**~~ — (1) **% C.D. por actividad** (`PresupuestoPDF.tsx`): cada fila de actividad ahora calcula y muestra `vrTotal / costoDirecto × 100` con 1 decimal, usando `Decimal.js`; antes estaba vacío con `<Text></Text>`. (2) **Página de firmas** (`PresupuestoPDF.tsx`): bloque rediseñado con texto introductorio legal, dos `signatureBox` al 44% de ancho con `signatureName` (bold), `signatureRole` (cargo/matrícula/empresa), y pie "Elaboró y Presentó" / "Aceptó y Firmó" — ya no se ve como nombres flotando. (3) **Numeración dinámica APU** (`APUDetallePDF.tsx`): `sectionNum` se incrementa solo cuando la sección existe — si no hay equipos, materiales arranca como "1. MATERIALES" en lugar de "2. MATERIALES". (4) **Nota aclaratoria genéricos** (`APUDetallePDF.tsx`): si algún `apu_item.nombre` coincide con `/actividad general|sin definir|por definir/i`, aparece nota al pie: "Precios de referencia del mercado colombiano 2025. Verificar con cotización real del mercado local." ✅ 2026-05-17
- ~~**BotonEnviarRevision + ModalValidacionExport**~~ — `BotonEnviarRevision.tsx` permite al usuario enviar el presupuesto a revisión desde el editor; `ModalValidacionExport.tsx` muestra validación pre-PDF (alertas de campos faltantes, estado, etc.); `presupuesto-estados.ts` centraliza las transiciones del estado machine; `ResumenFinanciero.tsx` y `ResumenFinancieroVisual.tsx` como variantes de presentación del resumen ✅ 2026-05-17
- ~~**configuracion-fiscal Server Action**~~ — `src/actions/configuracion-fiscal.ts` gestiona parámetros IVA/AIU/retenciones del presupuesto ✅ 2026-05-17
- ~~**Flujo de aprobación de presupuestos**~~ — Máquina de estados `borrador → en_revision → aprobado` con posibilidad de reabrir (`aprobado → borrador`). Migración `20260517100000_budget_aprobacion.sql`: constraint normalizado, trigger `fn_increment_budget_version` llena/limpia `aprobado_en` automáticamente. Server Actions `aprobarPresupuesto` + `reabrirPresupuesto` en `src/actions/presupuestos.ts` (admin client, RLS-safe). `EditorPresupuesto`: botón verde "Marcar como aprobado" en `en_revision`; banner verde + editor bloqueado vía `<fieldset disabled>` + botón "Reabrir para edición" con `ConfirmDialog` en `aprobado`. `tsc` + `pnpm build` limpios ✅ 2026-05-17
- ~~Dashboard analytics global~~ — `/dashboard` rediseñado con KPIs corregidos + 3 secciones nuevas: (1) **Análisis financiero** — `DistribucionCDChart` (barras apiladas CSS material/MO/equipo desde `apus`) + `ComparativaPresupuestos` (tabla con barra proporcional por `total_oferta`); (2) **Vigencia** — `VencimientoAlert` con semáforo rojo/ámbar/azul, oculto si no hay vencimientos ≤30 días; (3) **Estado de presupuestos** — barra apilada proporcional + contadores. Alimentado desde `v_resumen_presupuesto` + `apus` + `budgets` + `projects`. Sin dependencias nuevas — barras CSS puras. **Bugs corregidos:** (a) `proyectosActivos` filtraba por `['activo','cotizacion','ejecucion']` (estados eliminados en 2026-05-11); ahora usa `proyectos_en_progreso` del KPI con estados correctos `borrador|en_progreso|finalizado|archivado`. (b) "Total presupuestado" usaba `budgets.costo_directo` (CD bruto); ahora muestra `total_oferta` (CD + AIU + IVA) desde `v_resumen_presupuesto`. Archivos: `src/actions/analytics.ts`, `src/components/dashboard/{DistribucionCDChart,ComparativaPresupuestos,VencimientoAlert}.tsx`, `src/app/(dashboard)/dashboard/page.tsx` ✅ 2026-05-17
- ~~Panel APU — buscador de Mano de Obra~~ — `PanelAPU.tsx` tiene botón 🔍 en la sección Mano de Obra (igual que Materiales y Equipos); `searchInsumos` en `src/actions/insumos.ts` ahora consulta `trabajadores` (no `labor`) para `type === 'mano_obra'`, mapeando `especialidad→nombre`, `jornal_con_prestaciones→precio_unitario`, `'jornal'→unidad`; filtra `activo=true`. `searchType` extendido a `'material'|'equipo'|'mano_obra'` ✅ 2026-05-16
- ~~Duplicados en buscador de insumos (tabla `materials`)~~ — migración `20260516300000_fix_materials_duplicados.sql` eliminó 7 filas duplicadas (Cemento Portland ×3, Acero figurado ×3, Bloque/Concreto/Vinilo ×2) y creó `UNIQUE INDEX materials_nombre_categoria_unique`; tabla queda con 46 filas limpias ✅ 2026-05-16
- ~~Módulo Proveedores (`/proveedores`)~~ — CRUD completo con 7 categorías de construcción colombiana (ferretería/contratista/equipos/laboratorio/transporte/servicios/otro); grid de cards con filtros tipo + categoría + búsqueda; badges con color por categoría; íconos de teléfono/email/sitio web; soft-delete con `deleted_at`; sidebar con `Truck` entre Clientes e Insumos; `proveedor_id` nullable en `apu_items` para futura asociación. Archivos: `src/actions/proveedores.ts`, `src/app/(dashboard)/proveedores/page.tsx`, `src/components/proveedores/{ProveedoresList,ProveedoresNewButton,ModalProveedor}.tsx` ✅ 2026-05-16
- ~~Módulo Mano de Obra (`/mano-obra`)~~ — Tabla visual de referencia salarial Colombia 2026: `src/actions/mano-obra.ts` (`getTrabajadoresReferencia`), `src/app/(dashboard)/mano-obra/page.tsx` (solo lectura, buscador client-side, ordenamiento por columna, `formatearCOP`); sidebar con enlace `HardHat` entre Insumos y Perfil; jornales actualizados vía migración `20260516100000_update_trabajadores_2026.sql` ✅ 2026-05-16
- ~~Discrepancia de totales: header vs ResumenFinancieroTab~~ — Header (`EditorPresupuesto.tsx` líneas 98-112) ignoraba `budget.metodo_iva` y hardcodeaba "IVA sobre utilidad"; reemplazado con el mismo switch de 4 casos (`sobre_utilidad | sobre_aiu | sobre_total | default→0`) que usa la pestaña. Ahora header y pestaña muestran exactamente el mismo número ✅ 2026-05-16
- ~~Fallback `ivaPct` incorrecto en ResumenFinancieroTab~~ — `Number(budget.iva_porcentaje) || 19` devolvía 19 cuando `iva_porcentaje = 0`; corregido a `budget.iva_porcentaje != null ? Number(...) : 0` ✅ 2026-05-16
- ~~`barColor` derivado con `replace()` en ExplosionInsumosView~~ — `cfg.color.replace('text-', 'bg-')` reemplazado por propiedad explícita `barColor` en `TIPO_CONFIG` (`bg-burn-orange`, `bg-steel-mid`, `bg-green-500`, `bg-amber-400`, `bg-gray-400`) — evita purge de Tailwind v4 en producción ✅ 2026-05-16
- ~~Rediseño UI/UX del editor de presupuesto~~ — `EditorPresupuesto.tsx` reescrito (header con pill estado + auto-save indicator + total prominente; tabla con editable-cell hints + APU button mejorado + DropdownMenu Duplicar/Mover/Eliminar + HTML5 drag & drop local); `PanelAPU.tsx` con contraste mejorado + tooltips Info en HM/EPP + feedback "Aplicado"; `ExplosionInsumosView.tsx` con columna `% CD` por fila y por grupo; `ResumenFinancieroTab.tsx` nuevo como 3ª pestaña; `Sidebar.tsx` con link Clientes ✅ 2026-05-16
- ~~Limpieza módulo IA~~ — `src/actions/ia.ts` eliminado, `src/lib/security/encryption.ts` eliminado, `src/app/(dashboard)/configuracion/ia/` eliminado, `Profile.consultas_ia_este_mes` removido de tipos, `ANTHROPIC_API_KEY` removido de env vars y docs ✅ 2026-05-16
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
- ~~`pnpm run seed:apu`~~ — 175 filas en `catalogo_apu_items` (31 actividades con ítems de referencia)

