export async function generarTexto(prompt: string): Promise<string | null> {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1024,
        temperature: 0.7
      }),
      signal: AbortSignal.timeout(15000)
    });
    const data = await res.json();
    console.log('Groq status:', res.status);
    console.log('Groq data:', JSON.stringify(data, null, 2));
    return data.choices?.[0]?.message?.content ?? null;
  } catch (error) {
    console.error('Groq error:', error instanceof Error ? error.message : String(error));
    return null;
  }
}
