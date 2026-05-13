import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient, handleAnthropicError } from '@/lib/anthropic/client';
import { decrypt } from '@/lib/security/encryption';

const HOUR_MS = 60 * 60 * 1000;
const MAX_QUERIES_PER_HOUR = 10;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 1. Verificar Rate Limiting y Preferencias
    const { data: profile } = await supabase
      .from('profiles')
      .select('anthropic_key_enc, ia_global_enabled')
      .eq('id', user.id)
      .single();

    if (profile?.ia_global_enabled === false) {
      return NextResponse.json({ error: 'IA desactivada globalmente en tu perfil.' }, { status: 403 });
    }

    const { data: usage } = await supabase
      .from('ai_usage')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    const now = new Date();
    let consultasHoy = usage?.consultas_hoy || 0;

    if (usage && usage.ultima_consulta_at) {
      const diff = now.getTime() - new Date(usage.ultima_consulta_at).getTime();
      if (diff >= HOUR_MS) {
        consultasHoy = 0;
      } else if (consultasHoy >= MAX_QUERIES_PER_HOUR) {
        return NextResponse.json({ 
          error: `Límite de consultas IA alcanzado. Intenta en ${Math.ceil((HOUR_MS - diff) / 60000)} minutos.` 
        }, { status: 429 });
      }
    }

    // 2. Preparar el cliente de Anthropic
    let userKey: string | undefined;
    if (profile?.anthropic_key_enc) {
      try {
        userKey = decrypt(profile.anthropic_key_enc);
      } catch (e) {
        console.error('Error desencriptando key del usuario');
      }
    }

    const { disponible, client, error: clientError } = getAnthropicClient(userKey);
    if (!disponible || !client) {
      return NextResponse.json({ error: clientError }, { status: 400 });
    }

    // 3. Procesar Solicitud (Strip Sensitive Info)
    const { prompt, context } = await req.json();
    
    // Limpiar contexto (No enviar NIT, emails, etc.)
    const cleanContext = {
      tipo_obra: context.tipo_obra,
      area: context.area,
      descripcion: context.descripcion?.substring(0, 500)
    };

    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    // 4. Llamada a Anthropic (Claude 3.5 Sonnet)
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
      system: `Eres SIPO, un experto en presupuestos de obra para Colombia. Genera estructuras de presupuesto (capítulos y actividades) en formato JSON. No incluyas datos personales ni nombres de clientes reales.`
    }, { signal: controller.signal });

    clearTimeout(timeoutId);

    const endTime = Date.now();
    const duration = endTime - startTime;

    // 5. Registrar Uso y Log
    const tokens = response.usage.input_tokens + response.usage.output_tokens;
    const costo_estimado = (response.usage.input_tokens * 0.000003) + (response.usage.output_tokens * 0.000015);
    
    // Actualizar contadores
    await supabase.from('ai_usage').upsert({
      user_id: user.id,
      consultas_hoy: consultasHoy + 1,
      ultima_consulta_at: now.toISOString(),
      total_tokens: (Number(usage?.total_tokens) || 0) + tokens
    });

    // Guardar conversación para auditoría
    await supabase.from('ai_conversations').insert({
      user_id: user.id,
      mensaje_usuario: prompt.substring(0, 500),
      respuesta_ia: typeof response.content[0] === 'object' && 'text' in response.content[0] ? response.content[0].text : 'Error parsing response',
      tokens_utilizados: tokens,
      costo_estimado: costo_estimado,
      tiempo_respuesta_ms: duration,
      modelo: 'claude-3-5-sonnet'
    });

    return NextResponse.json({ 
      data: response.content[0],
      tokens,
      consultas_restantes: MAX_QUERIES_PER_HOUR - (consultasHoy + 1)
    });

  } catch (error: any) {
    const message = handleAnthropicError(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
