// PeriodoPicker: 'todo' | 'este_mes' | 'mes_pasado' | 'este_anio' | 'anio_pasado'
//               | 'personalizado:YYYY-MM-DD:YYYY-MM-DD'
export type PeriodoPicker = string;

export interface RangoPersonalizado {
  desde: Date;
  hasta: Date;
}

export interface MesPicker {
  label: string;
  value: string;
  desde: Date;
  hasta: Date;
}

export interface RangoPeriodo {
  desde: Date;
  hasta: Date;
}

function getBogotaComponents(d: Date): { year: number; month: number } {
  // 'en-CA' gives YYYY-MM-DD format
  const s = d.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
  const [year, month] = s.split('-').map(Number);
  return { year, month };
}

function bogotaStartOfMonth(year: number, month: number): Date {
  const pad = (n: number) => String(n).padStart(2, '0');
  return new Date(`${year}-${pad(month)}-01T00:00:00-05:00`);
}

function addMonths(year: number, month: number, n: number): { year: number; month: number } {
  const total = year * 12 + (month - 1) + n;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

function endOfMonth(year: number, month: number): Date {
  const next = addMonths(year, month, 1);
  return new Date(bogotaStartOfMonth(next.year, next.month).getTime() - 1);
}

/**
 * Retorna las 5 opciones fijas de período (excluyendo 'todo', que va hardcodeado
 * en SelectorPeriodo). El parámetro se ignora — existe solo para mantener la firma.
 */
export function getMesesDisponibles(_mesesAtras = 24): MesPicker[] {
  const { year, month } = getBogotaComponents(new Date());
  const prev = addMonths(year, month, -1);

  return [
    {
      value: 'este_mes',
      label: 'Este mes',
      desde: bogotaStartOfMonth(year, month),
      hasta: endOfMonth(year, month),
    },
    {
      value: 'mes_pasado',
      label: 'Mes pasado',
      desde: bogotaStartOfMonth(prev.year, prev.month),
      hasta: endOfMonth(prev.year, prev.month),
    },
    {
      value: 'este_anio',
      label: 'Este año',
      desde: bogotaStartOfMonth(year, 1),
      hasta: endOfMonth(year, 12),
    },
    {
      value: 'anio_pasado',
      label: 'Año pasado',
      desde: bogotaStartOfMonth(year - 1, 1),
      hasta: endOfMonth(year - 1, 12),
    },
  ];
}

/**
 * Calcula el rango de fechas para el período indicado, usando zona horaria
 * America/Bogota. Retorna null para 'todo' (sin filtro de fecha).
 */
export function getRangoPeriodo(periodo: PeriodoPicker): RangoPeriodo | null {
  if (!periodo || periodo === 'todo') return null;

  const { year, month } = getBogotaComponents(new Date());

  // Rango personalizado: 'personalizado:YYYY-MM-DD:YYYY-MM-DD'
  if (periodo.startsWith('personalizado:')) {
    const parts = periodo.split(':');
    if (parts.length < 3) return null;
    const desdeStr = parts[1];
    const hastaStr = parts[2];
    const desde = new Date(`${desdeStr}T00:00:00-05:00`);
    const hasta = new Date(`${hastaStr}T23:59:59.999-05:00`);
    if (isNaN(desde.getTime()) || isNaN(hasta.getTime())) return null;
    return { desde, hasta };
  }

  switch (periodo) {
    case 'este_mes': {
      return { desde: bogotaStartOfMonth(year, month), hasta: endOfMonth(year, month) };
    }
    case 'mes_pasado': {
      const prev = addMonths(year, month, -1);
      return { desde: bogotaStartOfMonth(prev.year, prev.month), hasta: endOfMonth(prev.year, prev.month) };
    }
    case 'este_anio': {
      return { desde: bogotaStartOfMonth(year, 1), hasta: endOfMonth(year, 12) };
    }
    case 'anio_pasado': {
      return { desde: bogotaStartOfMonth(year - 1, 1), hasta: endOfMonth(year - 1, 12) };
    }
    default:
      return null;
  }
}

/**
 * Retorna el label legible de un período para el empty state de ProyectosGrid.
 */
export function getLabelPeriodo(periodo: PeriodoPicker): string {
  if (periodo.startsWith('personalizado:')) return 'el rango personalizado';
  switch (periodo) {
    case 'este_mes':    return 'este mes';
    case 'mes_pasado':  return 'el mes pasado';
    case 'este_anio':   return 'este año';
    case 'anio_pasado': return 'el año pasado';
    default:            return 'todos los períodos';
  }
}
