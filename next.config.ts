import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';

// Extrae el host de Supabase para las directivas connect-src e img-src
function getSupabaseHost(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return '*.supabase.co';
  try {
    return new URL(url).hostname;
  } catch {
    return '*.supabase.co';
  }
}

const supabaseHost = getSupabaseHost();

// Content Security Policy
// - unsafe-eval solo en dev (Next.js HMR lo requiere)
// - unsafe-inline en script-src es necesario en App Router hasta migrar a nonce completo
// - unsafe-inline en style-src es requerido por Tailwind v4 (inyección de CSS en runtime)
const cspParts = [
  "default-src 'self'",
  isDev
    ? "script-src 'self' 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval'"
    : "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://${supabaseHost}`,
  [
    "connect-src 'self' blob:",
    `https://${supabaseHost}`,
    `wss://${supabaseHost}`,
    isDev ? 'ws://localhost:* http://localhost:*' : '',
  ].filter(Boolean).join(' '),
  "font-src 'self' data:",
  "frame-src 'self' blob:",
  "worker-src 'self' blob:",
  "object-src blob:",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  !isDev ? 'upgrade-insecure-requests' : '',
].filter(Boolean).join('; ');

const securityHeaders = [
  // Protección principal contra XSS y clickjacking
  { key: 'Content-Security-Policy', value: cspParts },

  // Clickjacking — compatibilidad con navegadores antiguos (frame-ancestors lo cubre en modernos)
  { key: 'X-Frame-Options', value: 'DENY' },

  // Evita MIME sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },

  // No envía path completo en Referer al hacer cross-origin (protege UUIDs de presupuestos en URLs)
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

  // Permisos de hardware
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
];

// HSTS solo en producción — en dev HTTPS no suele estar activo
if (!isDev) {
  securityHeaders.push({
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  });
}

const nextConfig: NextConfig = {
  // Elimina el header X-Powered-By: Next.js que revela el stack
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
