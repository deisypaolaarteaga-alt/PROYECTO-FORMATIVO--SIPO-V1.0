# 🚀 Guía de Despliegue — SIPO

Sigue estos pasos para desplegar SIPO en producción utilizando Vercel y Supabase.

## 1. Configuración de Supabase (Producción)

1. Crea un nuevo proyecto en [Supabase](https://supabase.com).
2. Ejecuta los siguientes archivos en el **SQL Editor**:
   - `schema.sql`: Estructura base de datos y RLS.
   - `ai-tables.sql`: Tablas de IA y Rate Limiting.
   - `trigger-profiles.sql`: Trigger para creación automática de perfiles.
   - `seed.sql`: Datos maestros de materiales e insumos.

## 2. Configuración de Variables de Entorno

En el dashboard de **Vercel**, agrega las siguientes variables:

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Key anónima de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Key de servicio (solo para acciones administrativas si se requiere) |
| `ANTHROPIC_API_KEY` | Tu clave de API de Anthropic (Claude 3.5 Sonnet) |

## 3. Despliegue en Vercel

1. Conecta tu repositorio de GitHub a Vercel.
2. Asegúrate de que el comando de build sea `next build`.
3. El directorio de salida debe ser `.next`.
4. ¡Haz clic en **Deploy**!

## 4. Verificaciones Post-Despliegue

- [ ] Verifica que el login y registro funcionan.
- [ ] Prueba el asistente de IA con un presupuesto simple.
- [ ] Genera y descarga un PDF para validar el renderizado.
- [ ] Revisa que el perfil de usuario guarda correctamente el logo de la empresa.

---
**SIPO — Sistema Inteligente de Presupuestos de Obra**
sipo.com.co
