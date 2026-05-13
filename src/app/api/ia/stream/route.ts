import { anthropic } from '@/lib/anthropic/client';
import { SYSTEM_PROMPT } from '@/lib/anthropic/prompts';
import { checkRateLimit, incrementUsage } from '@/lib/anthropic/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { addMessage, createConversacion } from '@/actions/conversaciones';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt, conversationId, projectId } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Falta el prompt' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 1. Verificar Rate Limit
    const limit = await checkRateLimit(user.id);
    if (!limit.allowed) {
      return NextResponse.json({ error: limit.message }, { status: 429 });
    }

    // 2. Si no hay conversación, crear una
    let currentId = conversationId;
    if (!currentId) {
      const conv = await createConversacion(projectId);
      if (!conv.success) throw new Error(conv.error);
      currentId = (conv.data as any).id;
    }

    // 3. Guardar mensaje del usuario
    await addMessage(currentId, 'user', prompt);

    // 4. Verificar disponibilidad de IA
    if (!anthropic) {
      return NextResponse.json({ error: 'IA no disponible. Configura ANTHROPIC_API_KEY.' }, { status: 503 });
    }
    const anthropicClient = anthropic;

    // 5. Configurar streaming
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = '';

        try {
          const anthropicStream = await anthropicClient.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4000,
            system: SYSTEM_PROMPT,
            messages: [{ role: 'user', content: prompt }],
            stream: true,
          });

          // Enviar el ID de conversación primero (metadata personalizada)
          controller.enqueue(new TextEncoder().encode(`__METADATA__:${currentId}\n`));

          for await (const event of anthropicStream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              const text = (event.delta as any).text || '';
              fullResponse += text;
              controller.enqueue(new TextEncoder().encode(text));
            }
          }

          // 5. Guardar mensaje de la IA al finalizar
          await addMessage(currentId, 'assistant', fullResponse);
          
          // 6. Incrementar uso
          await incrementUsage(user.id);

          controller.close();
        } catch (err) {
          console.error('Error in stream:', err);
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}
