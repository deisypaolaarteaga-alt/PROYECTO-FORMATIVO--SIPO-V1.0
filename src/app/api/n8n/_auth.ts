import { NextRequest, NextResponse } from 'next/server';

export function verificarSecretoN8N(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const secretEsperado = process.env.N8N_WEBHOOK_SECRET ?? '';

  if (!secretEsperado || token !== secretEsperado) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return null;
}
