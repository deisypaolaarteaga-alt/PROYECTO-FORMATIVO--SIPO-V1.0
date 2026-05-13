export function formatearCOP(valor: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor)
}

export function parsearCOP(texto: string): number {
  // Elimina todo lo que no sea número
  const limpio = texto.replace(/[^0-9]/g, '')
  return parseInt(limpio) || 0
}
