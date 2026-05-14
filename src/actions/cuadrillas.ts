'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import type {
  CuadrillaConTrabajadores,
  CuadrillaCosto,
} from '@/lib/calculos/presupuesto';
import { calcularCostoCuadrilla } from '@/lib/calculos/presupuesto';

/**
 * Obtiene todas las cuadrillas disponibles para el usuario actual.
 * Incluye cuadrillas del sistema + las propias del usuario.
 */
export async function getCuadrillas(categoriaFiltro?: string): Promise<CuadrillaConTrabajadores[]> {
  const supabase = await createClient();

  let query = supabase
    .from('cuadrillas')
    .select(`
      id,
      nombre,
      descripcion,
      categoria_actividad,
      es_sistema,
      cuadrilla_trabajadores (
        cantidad,
        es_fraccion,
        trabajadores (
          id,
          especialidad,
          categoria,
          jornal_base,
          factor_prestacional,
          jornal_con_prestaciones
        )
      ),
      rendimientos (
        id,
        actividad_tipo,
        unidad,
        rendimiento_minimo,
        rendimiento_normal,
        rendimiento_optimo,
        condiciones,
        fuente
      )
    `)
    .eq('activa', true)
    .order('categoria_actividad', { ascending: true })
    .order('nombre', { ascending: true });

  if (categoriaFiltro) {
    query = query.eq('categoria_actividad', categoriaFiltro);
  }

  const { data, error } = await query;

  if (error || !data) return [];

  // Mapear al tipo CuadrillaConTrabajadores
  return data.map((c: any) => ({
    id: c.id,
    nombre: c.nombre,
    descripcion: c.descripcion,
    categoria_actividad: c.categoria_actividad,
    es_sistema: c.es_sistema,
    trabajadores: (c.cuadrilla_trabajadores || []).map((ct: any) => ({
      id: ct.trabajadores?.id ?? '',
      especialidad: ct.trabajadores?.especialidad ?? '',
      categoria: ct.trabajadores?.categoria ?? '',
      jornal_base: Number(ct.trabajadores?.jornal_base ?? 0),
      factor_prestacional: Number(ct.trabajadores?.factor_prestacional ?? 1.5988),
      jornal_con_prestaciones: Number(ct.trabajadores?.jornal_con_prestaciones ?? 0),
      cantidad: Number(ct.cantidad ?? 1),
    })),
    rendimientos: (c.rendimientos || []).map((r: any) => ({
      id: r.id,
      actividad_tipo: r.actividad_tipo,
      unidad: r.unidad,
      rendimiento_minimo: r.rendimiento_minimo !== null ? Number(r.rendimiento_minimo) : null,
      rendimiento_normal: Number(r.rendimiento_normal),
      rendimiento_optimo: r.rendimiento_optimo !== null ? Number(r.rendimiento_optimo) : null,
      condiciones: r.condiciones,
      fuente: r.fuente ?? 'SIPO Colombia 2025',
    })),
  }));
}

/**
 * Obtiene las categorías de actividades únicas disponibles en las cuadrillas del sistema.
 */
export async function getCategoriasCuadrillas(): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cuadrillas')
    .select('categoria_actividad')
    .eq('activa', true)
    .eq('es_sistema', true)
    .not('categoria_actividad', 'is', null);

  if (error || !data) return [];

  const categorias = [...new Set(data.map((c: any) => c.categoria_actividad).filter(Boolean))];
  return categorias.sort();
}

/**
 * Calcula el costo de mano de obra para una cuadrilla y rendimiento dados,
 * y devuelve los datos listos para agregar al APU.
 */
export async function calcularMOCuadrilla(
  cuadrillaId: string,
  rendimiento: number,
  unidad: string
): Promise<{ success: boolean; data?: CuadrillaCosto; error?: string }> {
  try {
    const cuadrillas = await getCuadrillas();
    const cuadrilla = cuadrillas.find((c) => c.id === cuadrillaId);

    if (!cuadrilla) {
      return { success: false, error: 'Cuadrilla no encontrada' };
    }

    if (cuadrilla.trabajadores.length === 0) {
      return { success: false, error: 'La cuadrilla no tiene trabajadores asignados' };
    }

    const costo = calcularCostoCuadrilla(cuadrilla, rendimiento, unidad);
    return { success: true, data: costo };
  } catch (err: any) {
    console.error('[calcularMOCuadrilla] error:', err);
    return { success: false, error: 'Error en el cálculo de la cuadrilla.' };
  }
}

/**
 * Crea una cuadrilla personalizada del usuario
 */
export async function crearCuadrillaPersonalizada(data: {
  nombre: string;
  descripcion?: string;
  categoria_actividad?: string;
  trabajadores: { trabajador_id: string; cantidad: number }[];
}): Promise<{ success: boolean; data?: any; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autorizado' };

  const { data: cuadrilla, error: errCuadrilla } = await supabase
    .from('cuadrillas')
    .insert({
      user_id: user.id,
      nombre: data.nombre,
      descripcion: data.descripcion,
      categoria_actividad: data.categoria_actividad,
      es_sistema: false,
    })
    .select()
    .single();

  if (errCuadrilla || !cuadrilla) {
    return { success: false, error: 'No se pudo crear la cuadrilla' };
  }

  if (data.trabajadores.length > 0) {
    const { error: errTrabajadores } = await supabase
      .from('cuadrilla_trabajadores')
      .insert(
        data.trabajadores.map((t) => ({
          cuadrilla_id: cuadrilla.id,
          trabajador_id: t.trabajador_id,
          cantidad: t.cantidad,
        }))
      );

    if (errTrabajadores) {
      return { success: false, error: 'Cuadrilla creada pero sin trabajadores' };
    }
  }

  return { success: true, data: cuadrilla };
}

/**
 * Elimina una cuadrilla personalizada del usuario (nunca las de sistema)
 */
export async function deleteCuadrilla(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autorizado' };

  const { error } = await supabase
    .from('cuadrillas')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('es_sistema', false);

  if (error) return { success: false, error: 'No se pudo eliminar la cuadrilla' };
  return { success: true };
}

/**
 * Lista los trabajadores disponibles en el sistema
 */
export async function getTrabajadores(categoria?: string): Promise<any[]> {
  const supabase = await createClient();

  let query = supabase
    .from('trabajadores')
    .select('*')
    .eq('activo', true)
    .order('categoria', { ascending: true })
    .order('especialidad', { ascending: true });

  if (categoria) {
    query = query.eq('categoria', categoria);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data;
}

export interface TrabajadorBase {
  id: string;
  especialidad: string;
  categoria: string;
  jornal_base: number;
  factor_prestacional: number;
  jornal_con_prestaciones: number;
  ciudad_referencia: string;
}

function mapearOficio(oficio: string): string {
  const o = (oficio || '').toLowerCase();
  if (o.includes('director') || o.includes('gerente')) return 'director';
  if (o.includes('residente') || o.includes('supervisor')) return 'residente';
  if (o.includes('maestro') || o.includes('capataz')) return 'maestro';
  if (o.includes('ayudante') || o.includes('auxiliar') || o.includes('cotero')) return 'ayudante';
  if (o.includes('especialista') || o.includes('técnico') || o.includes('tec') ||
      o.includes('operador') || o.includes('topógrafo')) return 'especialista';
  return 'oficial';
}

/**
 * Importa un ítem del catálogo `labor` (Mano de Obra) como trabajador en la tabla
 * `trabajadores`, haciéndolo disponible para armar cuadrillas.
 * Si ya existe un trabajador con el mismo nombre, devuelve el existente sin duplicar.
 * Usa admin client porque `trabajadores` es un catálogo compartido sin INSERT policy de usuario.
 */
export async function importarLaborComoTrabajador(
  laborId: string
): Promise<{ success: boolean; trabajador?: TrabajadorBase; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autorizado' };

  const { data: labor } = await supabase
    .from('labor')
    .select('*')
    .eq('id', laborId)
    .single();
  if (!labor) return { success: false, error: 'Elemento no encontrado en catálogo' };

  // Si ya existe un trabajador con ese nombre, devolverlo
  const { data: existing } = await supabase
    .from('trabajadores')
    .select('*')
    .eq('especialidad', labor.nombre)
    .maybeSingle();
  if (existing) return { success: true, trabajador: existing as TrabajadorBase };

  // Calcular factor prestacional desde prestaciones_porcentaje
  const pct = Number(labor.prestaciones_porcentaje) || 50;
  const factor = parseFloat((1 + pct / 100).toFixed(4));

  const admin = createAdminClient();
  const { data: nuevo, error } = await admin
    .from('trabajadores')
    .insert({
      especialidad: labor.nombre,
      categoria: mapearOficio(labor.oficio),
      jornal_base: labor.precio_diario,
      factor_prestacional: factor,
      ciudad_referencia: labor.departamento || 'Nacional',
    })
    .select('*')
    .single();

  if (error || !nuevo) {
    console.error('[importarLaborComoTrabajador] error:', error);
    return { success: false, error: 'No se pudo importar el trabajador desde el catálogo.' };
  }
  return { success: true, trabajador: nuevo as TrabajadorBase };
}
