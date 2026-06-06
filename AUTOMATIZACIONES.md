# AUTOMATIZACIONES DE VALOR REAL CON n8n — SIPO

> **Auditoría realizada el 2026-06-06**
> Rama: `rama-deisy` | Solo lectura, cero cambios al código.

---

## CONTEXTO: LO QUE SIPO YA HACE HOY

Antes de proponer automatizaciones, estos flujos **ya están implementados en código** y NO deben replicarse en n8n:

| Evento | Qué hace SIPO hoy |
|--------|-------------------|
| Constructor envía presupuesto al cliente | Email via Brevo con link al portal (`enviarEmailPresupuesto`) |
| Cliente abre el portal | Registra `visto_at` y `visto_count`; avanza estado a `visto_por_cliente` |
| Cliente responde (aprueba/rechaza/observa) | Email al constructor via Brevo (`enviarEmailNotificacionConstructor`) |
| Constructor aprueba formalmente | Email al cliente con PDF adjunto (`enviarEmailConfirmacionCliente`) |
| Generación de carta ejecutiva | Groq genera carta + cuerpo de correo al enviar al cliente |
| Sugerencia de insumos | Gemini 1.5 Flash sugiere insumos en el Panel APU |
| Chat sobre el presupuesto | Groq responde preguntas sobre flujo de caja, materiales, secuencia |

---

## AUTOMATIZACIONES DE VALOR REAL CON n8n

### 1. Recordatorio de vigencia al cliente (3 días antes de expirar)

**Trigger:** n8n Cron diario a las 8:00 a.m. → HTTP Request a Supabase REST API

```sql
-- Condición que n8n evalúa:
SELECT pt.cliente_email, pt.cliente_nombre, pt.expires_at,
       b.titulo, p.nombre AS proyecto,
       pr.empresa, pr.nombre_completo
FROM presupuesto_tokens pt
JOIN budgets b ON b.id = pt.budget_id
JOIN projects p ON p.id = b.project_id
JOIN profiles pr ON pr.id = b.user_id
WHERE pt.expires_at BETWEEN NOW() AND NOW() + INTERVAL '3 days'
  AND pt.cliente_accion IS NULL
  AND b.deleted_at IS NULL
```

**Qué hace:** Detecta presupuestos que vencen en 3 días sin respuesta del cliente y envía un email de recordatorio amigable al cliente vía Brevo. Ejemplo: "Estimado [nombre], su presupuesto para [proyecto] vence el [fecha]. ¿Tiene alguna pregunta?"

**Valor real:** En Colombia, el 60–70% de los presupuestos no reciben respuesta en tiempo. Este recordatorio automático reduce la tasa de expiración sin decisión y evita que el constructor tenga que hacer seguimiento manual uno a uno.

**Complejidad n8n:** Baja — Cron trigger → HTTP Request (Supabase) → IF (results.length > 0) → loop → Brevo Send Email.

**Datos disponibles en BD:**
- `presupuesto_tokens.cliente_email` ✅
- `presupuesto_tokens.cliente_nombre` ✅
- `presupuesto_tokens.expires_at` ✅
- `presupuesto_tokens.cliente_accion` (IS NULL = sin respuesta) ✅
- `budgets.titulo` ✅
- `projects.nombre` ✅
- `profiles.empresa` / `profiles.nombre_completo` ✅

**Integración sugerida:** Supabase REST API (con `SUPABASE_SERVICE_ROLE_KEY`) → n8n Cron → Brevo Send Email

---

### 2. Alerta al constructor cuando el cliente abre el presupuesto por primera vez

**Trigger:** Supabase Database Webhook → evento `UPDATE` en tabla `presupuesto_tokens` cuando `visto_count` pasa de 0 a 1 → HTTP POST a n8n Webhook URL

**Qué hace:** El constructor recibe un email (y opcionalmente un WhatsApp) en el instante en que el cliente abre el presupuesto por primera vez. Mensaje ejemplo: "¡Buenas noticias! [Cliente] acaba de abrir tu presupuesto '[Título]' del proyecto '[Proyecto]'. Este es el momento ideal para hacer seguimiento."

**Valor real:** El momento de mayor receptividad del cliente es exactamente cuando está mirando el presupuesto. El constructor colombiano que llama o envía un WhatsApp en ese momento tiene una tasa de cierre significativamente mayor. Hoy SIPO muestra este dato en el dashboard pero no notifica proactivamente.

**Complejidad n8n:** Media — requiere configurar Supabase Database Webhook (Dashboard → Database → Webhooks) + condición en n8n para filtrar solo `visto_count = 1`.

**Datos disponibles en BD:**
- `presupuesto_tokens.visto_at` ✅ (primera apertura)
- `presupuesto_tokens.visto_count` ✅ (= 1 en primera apertura)
- `presupuesto_tokens.cliente_nombre` ✅
- `presupuesto_tokens.budget_id` → join `budgets.titulo`, `projects.nombre` ✅
- `profiles.email_empresa` → email del constructor ✅
- `profiles.telefono` → WhatsApp del constructor (si está registrado) ✅

**Integración sugerida:** Supabase webhook (UPDATE `presupuesto_tokens`) → n8n Webhook → Brevo Email al constructor + opcional WhatsApp Business API / Twilio SMS

---

### 3. Recordatorio diario al constructor: presupuesto "visto" sin respuesta en 72 horas

**Trigger:** n8n Cron diario a las 9:00 a.m. → HTTP Request a Supabase REST API

```sql
-- Condición que n8n evalúa:
SELECT b.id, b.titulo, b.user_id,
       pt.cliente_nombre, pt.cliente_email,
       pt.visto_at, b.updated_at,
       pr.email_empresa, pr.nombre_completo
FROM budgets b
JOIN presupuesto_tokens pt ON pt.budget_id = b.id
JOIN profiles pr ON pr.id = b.user_id
WHERE b.estado = 'visto_por_cliente'
  AND b.updated_at < NOW() - INTERVAL '72 hours'
  AND pt.cliente_accion IS NULL
  AND b.deleted_at IS NULL
ORDER BY b.updated_at ASC
```

**Qué hace:** Detecta presupuestos que el cliente ya vio (estado `visto_por_cliente`) pero llevan más de 72 horas sin respuesta. Envía un email al constructor: "Tu cliente [nombre] vio tu presupuesto hace [X] días y aún no ha respondido. ¿Quieres contactarlo?"

**Valor real:** El silencio post-vista es la mayor fuente de ansiedad del constructor. Este recordatorio activa el momento correcto para el seguimiento comercial sin que el constructor tenga que monitorear el dashboard a diario. Especialmente útil cuando el constructor está en obra.

**Complejidad n8n:** Baja — Cron trigger → HTTP Request (Supabase) → Loop → Brevo Send Email.

**Datos disponibles en BD:**
- `budgets.estado = 'visto_por_cliente'` ✅
- `budgets.updated_at` (marca cuándo cambió al estado) ✅
- `presupuesto_tokens.cliente_nombre` ✅
- `presupuesto_tokens.visto_at` ✅
- `profiles.email_empresa` ✅

**Integración sugerida:** Supabase REST API → n8n Cron → Brevo Send Email

---

### 4. Registro automático en Google Sheets al aprobar un presupuesto

**Trigger:** Supabase Database Webhook → evento `UPDATE` en tabla `budgets` cuando `estado` cambia a `'aprobado'` → HTTP POST a n8n Webhook URL

**Qué hace:** Cada vez que el constructor aprueba formalmente un presupuesto, n8n agrega automáticamente una fila en un Google Sheet del constructor con: fecha de aprobación, nombre del proyecto, nombre del cliente, ciudad de la obra, tipo de obra, costo directo, total oferta, AIU%, duración estimada.

**Valor real:** En Colombia, la gran mayoría de constructores llevan registro de sus contratos ganados en Excel/Sheets de forma manual. Esta automatización construye la bitácora de cartera de proyectos sin intervención humana. También facilita la contabilidad y el reporte a socios o bancos.

**Complejidad n8n:** Media — requiere configurar Supabase webhook + OAuth2 de Google en n8n + una query adicional para obtener `total_oferta` desde `v_resumen_presupuesto`.

**Datos disponibles en BD:**
- `budgets.estado` (trigger: `aprobado`) ✅
- `budgets.costo_directo` ✅
- `budgets.administracion_pct`, `imprevistos_pct`, `utilidad_pct` ✅
- `budgets.duracion_meses` ✅
- `budgets.ciudad_ica` ✅
- `projects.nombre` ✅
- `projects.tipo_obra` ✅
- `projects.ubicacion` ✅
- `clientes.nombre_razon_social` ✅
- `v_resumen_presupuesto.total_oferta` (vista calculada) ✅

**Integración sugerida:** Supabase webhook (UPDATE `budgets` WHERE estado = 'aprobado') → n8n Webhook → HTTP Request (Supabase REST, obtiene datos completos) → Google Sheets: Append Row

---

### 5. Alerta al constructor cuando un presupuesto vence sin respuesta

**Trigger:** n8n Cron diario a las 7:00 a.m. → HTTP Request a Supabase REST API

```sql
-- Detecta tokens vencidos SIN respuesta (ventana: vencieron ayer)
SELECT pt.cliente_email, pt.cliente_nombre, pt.expires_at,
       b.titulo, b.vigencia_dias,
       p.nombre AS proyecto,
       pr.email_empresa, pr.nombre_completo, pr.empresa
FROM presupuesto_tokens pt
JOIN budgets b ON b.id = pt.budget_id
JOIN projects p ON p.id = b.project_id
JOIN profiles pr ON pr.id = b.user_id
WHERE pt.expires_at BETWEEN NOW() - INTERVAL '24 hours' AND NOW()
  AND pt.cliente_accion IS NULL
  AND b.deleted_at IS NULL
```

**Qué hace:** El día que vence un presupuesto sin respuesta del cliente, envía un email al constructor: "El presupuesto '[Título]' para [Cliente] expiró sin respuesta. Considera renovarlo con una nueva vigencia en SIPO o contactar directamente al cliente."

**Valor real:** Complemento natural al recordatorio de 3 días (automatización #1). Cierra el ciclo: si el cliente no respondió ni con el recordatorio, el constructor necesita saber que el token está muerto para tomar acción. Sin esta alerta, el presupuesto queda en limbo hasta que el constructor revisa el dashboard.

**Complejidad n8n:** Baja — Cron trigger → HTTP Request (Supabase) → Loop → Brevo Send Email.

**Datos disponibles en BD:**
- `presupuesto_tokens.expires_at` ✅
- `presupuesto_tokens.cliente_accion` (IS NULL = sin respuesta) ✅
- `presupuesto_tokens.cliente_nombre` ✅
- `budgets.titulo` ✅
- `budgets.vigencia_dias` ✅
- `profiles.email_empresa` ✅

**Integración sugerida:** Supabase REST API → n8n Cron → Brevo Send Email

---

### 6. Resumen semanal de actividad comercial para el constructor

**Trigger:** n8n Cron cada lunes a las 7:30 a.m.

**Qué hace:** Envía al constructor un email de resumen de la semana pasada con:
- Presupuestos enviados al cliente (cantidad + valor total)
- Presupuestos vistos por clientes (cantidad)
- Presupuestos aprobados (cantidad + valor)
- Presupuestos rechazados (cantidad)
- Presupuestos próximos a vencer en los próximos 7 días
- Tasa de conversión de la semana (aprobados / enviados)

**Valor real:** El constructor colombiano que está en obra o en reuniones no revisa el dashboard a diario. Un resumen en su correo cada lunes le da visión de negocio en 30 segundos. Especialmente útil para constructores con varios proyectos simultáneos. Ninguna funcionalidad de SIPO hoy genera este resumen proactivamente.

**Complejidad n8n:** Alta — Cron trigger → 5 queries paralelas a Supabase REST API → agregación de datos en n8n (Code node con JavaScript) → Brevo Send Email con tabla HTML formateada.

**Datos disponibles en BD:**
- `budgets.estado` + `budgets.created_at` + `budgets.updated_at` ✅
- `presupuesto_tokens.visto_at` + `expires_at` ✅
- `v_resumen_presupuesto.total_oferta` ✅
- `profiles.email_empresa` ✅

**Integración sugerida:** n8n Cron → múltiples HTTP Requests (Supabase REST API) → Code Node (agrega métricas) → Brevo Send Email

---

## TABLA RESUMEN

| # | Automatización | Trigger | Complejidad | Integración |
|---|---------------|---------|-------------|-------------|
| 1 | Recordatorio de vigencia al cliente (3 días antes) | Cron diario | Baja | Supabase REST → Brevo |
| 2 | Alerta al constructor: cliente abrió por primera vez | Supabase webhook | Media | Supabase webhook → Brevo + WhatsApp |
| 3 | Recordatorio: presupuesto "visto" sin respuesta (72h) | Cron diario | Baja | Supabase REST → Brevo |
| 4 | Registro en Google Sheets al aprobar presupuesto | Supabase webhook | Media | Supabase webhook → Sheets |
| 5 | Alerta: presupuesto vencido sin respuesta | Cron diario | Baja | Supabase REST → Brevo |
| 6 | Resumen semanal de actividad comercial | Cron semanal | Alta | Supabase REST → Brevo |

---

## NOTAS TÉCNICAS DE IMPLEMENTACIÓN

### Autenticación Supabase desde n8n
Usar `SUPABASE_SERVICE_ROLE_KEY` como Bearer token en los HTTP Requests. Nunca usar la ANON_KEY — las queries de n8n necesitan leer datos de todos los usuarios del plan, no de un usuario autenticado específico.

### Configurar Supabase Database Webhooks (para #2 y #4)
1. Supabase Dashboard → Database → Webhooks → Create new webhook
2. Tabla: `presupuesto_tokens` (para #2) o `budgets` (para #4)
3. Evento: `UPDATE`
4. URL: Webhook URL del flujo n8n correspondiente

### Filtro anti-duplicados (crítico)
Los crons diarios (#1, #3, #5) deben llevar un registro de qué presupuestos ya notificaron para no enviar emails repetidos. Opciones:
- **Opción A (recomendada):** Agregar una tabla `n8n_notificaciones` en Supabase con `(tipo_notificacion, budget_id, enviado_at)` y verificar antes de enviar.
- **Opción B:** Usar el nodo "Deduplication" de n8n con almacenamiento estático (solo funciona si el flujo no se reinicia).

### WhatsApp Business API (para #2)
Requiere cuenta de WhatsApp Business aprobada por Meta. Alternativa más simple: Twilio SMS usando `profiles.telefono` del constructor. n8n tiene nodos nativos para ambas integraciones.

---

## AUTOMATIZACIONES DESCARTADAS Y POR QUÉ

| Candidato descartado | Razón |
|---------------------|-------|
| Notificación al constructor cuando cliente aprueba/rechaza | **SIPO ya lo hace** — `enviarEmailNotificacionConstructor` |
| Email al cliente al enviar presupuesto | **SIPO ya lo hace** — `enviarEmailPresupuesto` |
| Email al cliente con PDF al aprobar | **SIPO ya lo hace** — `enviarEmailConfirmacionCliente` |
| Generación de carta ejecutiva IA | **SIPO ya lo hace** — `generarCartaPresentacion` con Groq |
| Notificación cuando se crea un proyecto | Sin dolor real — el constructor crea el proyecto él mismo |
| Sincronización con HubSpot/CRM | Genérica, no específica de construcción colombiana |
| Backup PDF en Google Drive al aprobar | `budget_snapshots` ya guarda el JSON completo; el PDF ya se envía al cliente por email |
| Alerta cuando jornal de trabajadores cambia | Sin webhook natural; el catálogo se actualiza por migraciones, no por eventos de usuario |
