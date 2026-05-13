import type { Budget, Chapter, Activity, APU, APUItem } from '@/types';

export interface ValidacionExportacion {
  valido: boolean;
  errores: string[];
  advertencias: string[];
}

const getApuFromActivity = (activity: any): { apu: APU | null; items: APUItem[] } => {
  if (!activity) return { apu: null, items: [] };

  if (activity.apu) {
    return { apu: activity.apu, items: activity.apu_items || [] };
  }

  if (Array.isArray(activity.apus) && activity.apus.length > 0) {
    const apu = activity.apus[0] as APU;
    return { apu, items: activity.apu_items || [] };
  }

  return { apu: null, items: activity.apu_items || [] };
};

export function validarAntesDeExportar(budget: any, profile: any): ValidacionExportacion {
  const errores: string[] = [];
  const advertencias: string[] = [];

  const chapters: any[] = budget.chapters || budget.capitulos || [];

  // Único bloqueo real: presupuesto sin ninguna actividad
  const totalActividades = chapters.reduce(
    (sum: number, ch: any) => sum + (ch.activities?.length || 0),
    0
  );
  if (totalActividades === 0) {
    errores.push('El presupuesto no tiene actividades. Agrega al menos una actividad antes de exportar.');
    return { valido: false, errores, advertencias };
  }

  // A partir de aquí todo es advertencia — no bloquea la exportación
  if (budget.estado === 'borrador') {
    advertencias.push('El presupuesto está en borrador — considera cambiarlo a "En revisión" antes de enviarlo al cliente.');
  }

  chapters.forEach((chapter, index) => {
    const activities = chapter.activities || [];
    if (!Array.isArray(activities) || activities.length === 0) {
      advertencias.push(`El capítulo "${chapter.nombre || index + 1}" no tiene actividades.`);
      return;
    }

    activities.forEach((activity: any, activityIndex: number) => {
      const precio = activity.precio_unitario;
      if (precio == null || Number.isNaN(Number(precio)) || Number(precio) === 0) {
        advertencias.push(`La actividad "${activity.nombre || `#${activityIndex + 1}`}" tiene precio $0 — aparecerá así en el PDF.`);
      }

      const { apu, items } = getApuFromActivity(activity);
      if (apu && Number(apu.rendimiento) === 0) {
        advertencias.push(`La actividad "${activity.nombre || `#${activityIndex + 1}`}" tiene un APU con rendimiento 0.`);
      }

      (items || []).forEach((item: any) => {
        if (item.tipo === 'material' && Number(item.precio_unitario) > 0 && Number(item.precio_unitario) < 100) {
          advertencias.push(`El material "${item.nombre || 'sin nombre'}" tiene un precio muy bajo (${item.precio_unitario}).`);
        }
      });
    });
  });

  if (!profile || !profile.nit) {
    advertencias.push('El perfil no tiene NIT — aparecerá en blanco en el PDF.');
  }

  if (!profile || (!profile.nombre_completo && !profile.empresa)) {
    advertencias.push('El perfil no tiene nombre ni empresa — aparecerá en blanco en el PDF.');
  }

  const aiuTotal = Number(budget.administracion_pct || 0)
    + Number(budget.imprevistos_pct || 0)
    + Number(budget.utilidad_pct || 0);

  if (aiuTotal > 35) {
    advertencias.push(`El AIU total es ${aiuTotal}%, lo que se considera inusualmente alto.`);
  }

  if (!budget.vigencia_dias || Number(budget.vigencia_dias) <= 0) {
    advertencias.push('El presupuesto no tiene fecha de validez configurada.');
  }

  return {
    valido: errores.length === 0,
    errores,
    advertencias,
  };
}
