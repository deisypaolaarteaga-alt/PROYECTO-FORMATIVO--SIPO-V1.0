import 'server-only';
import Anthropic from '@anthropic-ai/sdk';

/**
 * Instancia singleton de Anthropic para streaming.
 * Es null si ANTHROPIC_API_KEY no está configurada.
 */
export const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

/**
 * Cliente de Anthropic (Server-Only)
 * Proporciona acceso seguro a la API de Claude.
 */

export function getAnthropicClient(apiKey?: string) {
  const key = apiKey || process.env.ANTHROPIC_API_KEY;

  if (!key) {
    return {
      disponible: false,
      error: 'API Key de Anthropic no configurada.'
    };
  }

  try {
    const client = new Anthropic({
      apiKey: key,
    });
    return {
      disponible: true,
      client
    };
  } catch (err) {
    return {
      disponible: false,
      error: 'Error al inicializar el cliente de Anthropic.'
    };
  }
}

/**
 * Helper para manejar errores de la API de forma amigable para el usuario
 */
export const handleAnthropicError = (error: any) => {
  console.error('⚠️ SIPO IA Error:', error);
  
  if (error.status === 401) {
    return 'API Key inválida o expirada. Verifica tu configuración.';
  }
  if (error.status === 429) {
    return 'Límite de velocidad de Anthropic alcanzado. Intenta de nuevo en unos minutos.';
  }
  if (error.status >= 500) {
    return 'Los servidores de Claude están experimentando problemas. Reintenta en breve.';
  }
  
  return 'Ocurrió un error inesperado al procesar la solicitud con IA.';
};
