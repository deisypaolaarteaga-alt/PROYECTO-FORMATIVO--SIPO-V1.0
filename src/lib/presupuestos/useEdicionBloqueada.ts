/**
 * Hook para determinar si un presupuesto está bloqueado para edición
 * basado en su estado actual.
 */

type EstadoPresupuesto = 'borrador' | 'en_revision' | 'aprobado' | 'rechazado' | 'archivado';

export function useEdicionBloqueada(estado: EstadoPresupuesto) {
  const bloqueado = ['aprobado', 'archivado', 'en_revision'].includes(estado);
  
  let razon = '';
  if (estado === 'aprobado') razon = 'Este presupuesto está aprobado y bloqueado.';
  if (estado === 'en_revision') razon = 'Este presupuesto está en revisión y no puede editarse.';
  if (estado === 'archivado') razon = 'Este presupuesto está archivado.';

  return {
    bloqueado,
    razon,
    permiteExportar: ['aprobado', 'en_revision'].includes(estado)
  };
}
