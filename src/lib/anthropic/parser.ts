/**
 * Utilidades para parsear las respuestas de la IA
 */

interface APUItem {
  nombre: string;
  unidad: string;
  cantidad: number;
  precio: number;
}

interface Activity {
  nombre: string;
  unidad: string;
  cantidad: number;
  precio_unitario: number;
  apu?: {
    materiales: APUItem[];
    mano_obra: APUItem[];
    equipos: APUItem[];
  };
}

interface Chapter {
  nombre: string;
  actividades: Activity[];
}

interface ParsedBudget {
  titulo: string;
  capitulos: Chapter[];
}

/**
 * Extrae el JSON estructurado de la respuesta de la IA
 */
export function parseBudgetResponse(aiResponse: string): ParsedBudget | null {
  try {
    const marker = 'JSON_BUDGET_DATA:';
    const startIndex = aiResponse.indexOf(marker);
    
    if (startIndex === -1) return null;

    // Extraer el texto después del marcador
    let jsonText = aiResponse.substring(startIndex + marker.length).trim();

    // Limpiar posibles bloques de código markdown
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const data = JSON.parse(jsonText);
    
    // Validación básica de estructura
    if (!data.capitulos || !Array.isArray(data.capitulos)) {
      return null;
    }

    return data as ParsedBudget;
  } catch (error) {
    console.error('Error parsing budget JSON from AI:', error);
    return null;
  }
}

/**
 * Limpia la respuesta de la IA para mostrarla al usuario 
 * (remueve el bloque JSON técnico si existe)
 */
export function cleanAIResponse(aiResponse: string): string {
  const marker = 'JSON_BUDGET_DATA:';
  const index = aiResponse.indexOf(marker);
  
  if (index === -1) return aiResponse;
  
  return aiResponse.substring(0, index).trim();
}
