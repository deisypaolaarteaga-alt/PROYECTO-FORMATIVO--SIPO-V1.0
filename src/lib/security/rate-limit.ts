/**
 * Rate Limiter simple en memoria para Server Actions.
 *
 * LIMITACIÓN CONOCIDA: En entornos serverless (Vercel, AWS Lambda) este Map
 * se resetea en cada cold start y no se comparte entre instancias, por lo que
 * el límite no es efectivo en producción distribuida.
 * Para producción real, migrar los contadores a la tabla `ai_usage` en Supabase
 * (o una tabla `rate_limit_counters` dedicada).
 * En desarrollo con un solo proceso Next.js funciona correctamente.
 */

const userWriteCounts = new Map<string, { count: number, resetAt: number }>();

const LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto
const MAX_WRITES = 30;

export function checkRateLimit(userId: string): { success: boolean, retryAfter?: number } {
  const now = Date.now();
  const userData = userWriteCounts.get(userId);

  if (!userData || now > userData.resetAt) {
    // Primera vez o ventana expirada
    userWriteCounts.set(userId, { count: 1, resetAt: now + LIMIT_WINDOW_MS });
    return { success: true };
  }

  if (userData.count >= MAX_WRITES) {
    return { 
      success: false, 
      retryAfter: Math.ceil((userData.resetAt - now) / 1000) 
    };
  }

  userData.count++;
  return { success: true };
}
