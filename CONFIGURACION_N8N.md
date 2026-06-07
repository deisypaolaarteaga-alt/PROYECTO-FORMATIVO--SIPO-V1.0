# Configuración de n8n para SIPO

URL de SIPO en producción: `https://proyecto-formativo-sipo-v1-0.vercel.app`
URL de n8n: `https://sipo-proyecto.app.n8n.cloud`

## Header de autenticación (todas las rutas)

Todas las llamadas deben incluir:

```
Authorization: Bearer sipo-n8n-2026-secret
Content-Type: application/json
```

---

## Workflow 1 — Recordatorio de vencimiento (cron diario)

**Trigger:** Schedule — todos los días a las 9:00 AM  
**Timezone:** America/Bogota

**Nodo HTTP Request:**
- Method: `POST`
- URL: `https://proyecto-formativo-sipo-v1-0.vercel.app/api/n8n/recordatorio-vencimiento`
- Headers:
  - `Authorization: Bearer sipo-n8n-2026-secret`
  - `Content-Type: application/json`
- Body: *(vacío — el endpoint calcula la fecha internamente)*

**Cron expression:** `0 9 * * *`

**Respuesta esperada:**
```json
{ "enviados": 3, "presupuestos": ["uuid1", "uuid2", "uuid3"] }
```

---

## Workflow 2 — Alerta cuando cliente abre el presupuesto (Supabase webhook)

**Trigger:** Webhook — Supabase Database Trigger

### Configurar en Supabase Dashboard

1. Ir a **Database → Functions** → Crear función:
```sql
CREATE OR REPLACE FUNCTION notify_presupuesto_visto()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.visto_at IS NULL AND NEW.visto_at IS NOT NULL THEN
    PERFORM net.http_post(
      url := 'https://sipo-proyecto.app.n8n.cloud/webhook/presupuesto-visto',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := json_build_object(
        'token_id', NEW.id,
        'budget_id', NEW.budget_id,
        'cliente_email', NEW.cliente_email,
        'cliente_nombre', NEW.cliente_nombre,
        'visto_at', NEW.visto_at
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$;
```

2. Crear el trigger:
```sql
DROP TRIGGER IF EXISTS trg_notify_presupuesto_visto ON presupuesto_tokens;
CREATE TRIGGER trg_notify_presupuesto_visto
  AFTER UPDATE ON presupuesto_tokens
  FOR EACH ROW EXECUTE FUNCTION notify_presupuesto_visto();
```

**Nodo n8n — Webhook (receiver):**
- Path: `/webhook/presupuesto-visto`
- Method: POST

**Nodo HTTP Request (llamada a SIPO):**
- Method: `POST`
- URL: `https://proyecto-formativo-sipo-v1-0.vercel.app/api/n8n/alerta-presupuesto-visto`
- Headers:
  - `Authorization: Bearer sipo-n8n-2026-secret`
  - `Content-Type: application/json`
- Body (JSON):
```json
{
  "token_id": "{{ $json.token_id }}",
  "budget_id": "{{ $json.budget_id }}",
  "cliente_email": "{{ $json.cliente_email }}",
  "cliente_nombre": "{{ $json.cliente_nombre }}",
  "visto_at": "{{ $json.visto_at }}"
}
```

**Respuesta esperada:**
```json
{ "success": true }
```

---

## Workflow 3 — Recordatorio al cliente sin respuesta (cron diario)

**Trigger:** Schedule — todos los días a las 10:00 AM  
**Timezone:** America/Bogota

**Nodo HTTP Request:**
- Method: `POST`
- URL: `https://proyecto-formativo-sipo-v1-0.vercel.app/api/n8n/recordatorio-sin-respuesta`
- Headers:
  - `Authorization: Bearer sipo-n8n-2026-secret`
  - `Content-Type: application/json`
- Body: *(vacío)*

**Cron expression:** `0 10 * * *`

**Respuesta esperada:**
```json
{ "enviados": 2 }
```

---

## Workflow 4 — Alerta al constructor: presupuesto venció sin respuesta (cron diario)

**Trigger:** Schedule — todos los días a las 8:00 AM  
**Timezone:** America/Bogota

**Nodo HTTP Request:**
- Method: `POST`
- URL: `https://proyecto-formativo-sipo-v1-0.vercel.app/api/n8n/alerta-vencimiento-sin-respuesta`
- Headers:
  - `Authorization: Bearer sipo-n8n-2026-secret`
  - `Content-Type: application/json`
- Body: *(vacío)*

**Cron expression:** `0 8 * * *`

**Respuesta esperada:**
```json
{ "alertas": 1 }
```

---

## Workflow 5 — Resumen semanal al constructor (cron cada lunes)

**Trigger:** Schedule — todos los lunes a las 7:30 AM  
**Timezone:** America/Bogota

**Nodo HTTP Request:**
- Method: `POST`
- URL: `https://proyecto-formativo-sipo-v1-0.vercel.app/api/n8n/resumen-semanal`
- Headers:
  - `Authorization: Bearer sipo-n8n-2026-secret`
  - `Content-Type: application/json`
- Body: *(vacío)*

**Cron expression:** `30 7 * * 1`

**Respuesta esperada:**
```json
{ "enviados": 5 }
```

---

## Workflow 6 — Registro en Google Sheets cuando se aprueba un presupuesto

**Trigger:** Webhook — Supabase Database Trigger

### Configurar en Supabase Dashboard

1. Ir a **Database → Functions** → Crear función:
```sql
CREATE OR REPLACE FUNCTION notify_presupuesto_aprobado()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.estado = 'aprobado_por_cliente' AND OLD.estado != 'aprobado_por_cliente' THEN
    PERFORM net.http_post(
      url := 'https://sipo-proyecto.app.n8n.cloud/webhook/presupuesto-aprobado',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := json_build_object(
        'budget_id', NEW.id,
        'user_id', NEW.user_id
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$;
```

2. Crear el trigger:
```sql
DROP TRIGGER IF EXISTS trg_notify_presupuesto_aprobado ON budgets;
CREATE TRIGGER trg_notify_presupuesto_aprobado
  AFTER UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION notify_presupuesto_aprobado();
```

> **Nota:** Para que `net.http_post` funcione en Supabase, debe estar habilitada la extensión `pg_net` en **Database → Extensions**.

**Nodo n8n — Webhook (receiver):**
- Path: `/webhook/presupuesto-aprobado`
- Method: POST

**Nodo HTTP Request (obtener datos de SIPO):**
- Method: `POST`
- URL: `https://proyecto-formativo-sipo-v1-0.vercel.app/api/n8n/registro-google-sheets`
- Headers:
  - `Authorization: Bearer sipo-n8n-2026-secret`
  - `Content-Type: application/json`
- Body (JSON):
```json
{
  "budget_id": "{{ $json.budget_id }}",
  "user_id": "{{ $json.user_id }}"
}
```

**Nodo Google Sheets (escribir fila):**
- Operation: Append Row
- Spreadsheet: *(seleccionar tu hoja)*
- Sheet: *(seleccionar pestaña)*
- Columns mapping:
  - `Fecha` → `{{ $json.fecha }}`
  - `Proyecto` → `{{ $json.proyecto }}`
  - `Cliente` → `{{ $json.cliente }}`
  - `Tipo de obra` → `{{ $json.tipo_obra }}`
  - `Costo directo` → `{{ $json.costo_directo }}`
  - `Total oferta` → `{{ $json.total_oferta }}`
  - `Utilidad` → `{{ $json.utilidad }}`
  - `Margen (%)` → `{{ $json.margen_pct }}`
  - `Constructor` → `{{ $json.constructor }}`

**Respuesta esperada de SIPO:**
```json
{
  "fecha": "06/06/2026",
  "proyecto": "Edificio Rosales",
  "cliente": "Constructora ABC",
  "tipo_obra": "residencial",
  "costo_directo": 150000000,
  "total_oferta": 187500000,
  "utilidad": 22500000,
  "margen_pct": 12.0,
  "constructor": "Juan Pérez"
}
```

---

## Variables de entorno requeridas

### En SIPO (.env / Vercel)
```
N8N_WEBHOOK_SECRET=sipo-n8n-2026-secret
```

> ⚠️ **Recordatorio:** Agregar `N8N_WEBHOOK_SECRET=sipo-n8n-2026-secret`  
> en **Vercel → Settings → Environment Variables** (Production + Preview + Development).

### En n8n
No se requieren variables adicionales — el secret va directo en el header de cada nodo HTTP Request.

---

## Verificación de la integración

Para probar un endpoint desde n8n o con curl:

```bash
curl -X POST https://proyecto-formativo-sipo-v1-0.vercel.app/api/n8n/recordatorio-vencimiento \
  -H "Authorization: Bearer sipo-n8n-2026-secret" \
  -H "Content-Type: application/json"
```

Respuesta esperada (si no hay vencimientos hoy):
```json
{ "enviados": 0, "presupuestos": [] }
```

Si el header falta o es incorrecto:
```json
{ "error": "No autorizado" }  → HTTP 401
```
