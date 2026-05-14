/**
 * Validación de variables de entorno al arrancar el servidor.
 * Este módulo se importa en src/lib/supabase/server.ts para ejecutarse
 * en el primer uso de cualquier Server Action o Server Component.
 * Nunca se incluye en bundles del cliente (no tiene 'use client').
 */

import { z } from 'zod';

const CLAVE_DEV_INSEGURA = 'sipo-dev-secret-key-32-chars-long-!!!';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('NEXT_PUBLIC_SUPABASE_URL debe ser una URL válida (ej: https://xxx.supabase.co)'),

  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY no puede estar vacía'),

  NEXT_PUBLIC_APP_URL: z
    .string()
    .url('NEXT_PUBLIC_APP_URL debe ser una URL válida (ej: http://localhost:3000)'),

  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, 'SUPABASE_SERVICE_ROLE_KEY no puede estar vacía'),

  ENCRYPTION_KEY: z
    .string()
    .min(64, 'ENCRYPTION_KEY debe tener al menos 64 caracteres hexadecimales (32 bytes)')
    .refine(
      (k) => k !== CLAVE_DEV_INSEGURA,
      'ENCRYPTION_KEY no puede ser la clave de desarrollo hardcodeada. ' +
      'Genera una nueva con: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    ),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const detalle = result.error.issues
      .map((i) => `  • ${String(i.path[0])}: ${i.message}`)
      .join('\n');
    throw new Error(
      `\n\n❌ SIPO — Variables de entorno inválidas o faltantes:\n${detalle}\n\n` +
      'Copia .env.example → .env y completa los valores requeridos.\n'
    );
  }
  return result.data;
}

export const env = validateEnv();
