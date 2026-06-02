import { z } from 'zod';

/**
 * Sanitizador de strings: trim y rechazo de HTML tags
 */
const cleanString = z.string()
  .trim()
  .regex(/^[^<>]*$/, { message: 'No se permiten caracteres especiales HTML (<, >)' });

export const proyectoSchema = z.object({
  nombre: cleanString.min(3, 'Nombre muy corto').max(200, 'Nombre muy largo'),
  descripcion: cleanString.max(500, 'Descripción muy larga').optional().or(z.literal('')),
  ubicacion: cleanString.min(1, 'La ubicación/ciudad es requerida'),
  tipo_obra: z.string().optional(),
  cliente_nombre: cleanString.optional().or(z.literal('')),
});

export const presupuestoSchema = z.object({
  titulo: cleanString.min(3, 'Título muy corto').max(200, 'Título muy largo'),
  estado: z.enum(['borrador', 'revision', 'enviado', 'aprobado']),
  administracion_pct: z.number().min(0).max(30),
  imprevistos_pct: z.number().min(0).max(20),
  utilidad_pct: z.number().min(0).max(30),
  iva_porcentaje: z.number().min(0).max(100),
  retefuente_pct: z.number().min(0).max(10),
  ica_pct: z.number().min(0).max(5),
});

export const capituloSchema = z.object({
  nombre: cleanString.min(2, 'Nombre muy corto').max(200, 'Nombre muy largo'),
  numero: z.number().int().positive('El orden debe ser un número positivo'),
});

export const actividadSchema = z.object({
  nombre: cleanString.min(1, 'El nombre es obligatorio'),
  unidad: z.string().min(1, 'La unidad es obligatoria'),
  cantidad: z.number().positive('La cantidad debe ser mayor a cero'),
  precio_unitario: z.number().min(0, 'El precio no puede ser negativo'),
});

export const apuItemSchema = z.object({
  tipo: z.enum(['material', 'mano_obra', 'equipo', 'herramienta_menor', 'epp']),
  nombre: cleanString.min(1, 'El nombre es obligatorio'),
  descripcion: cleanString.optional().or(z.literal('')),
  unidad: z.string().min(1, 'La unidad es obligatoria'),
  cantidad: z.number().positive('La cantidad debe ser mayor a cero'),
  precio_unitario: z.number().min(0, 'El precio no puede ser negativo'),
});

export const createUserMaterialSchema = z.object({
  nombre: cleanString.min(2, 'Nombre muy corto'),
  unidad: z.string().min(1, 'Unidad requerida'),
  precio_unitario: z.number().min(0),
  categoria: cleanString.optional().or(z.literal('')),
});

export const guardarPlantillaSchema = z.object({
  nombre: cleanString.min(3, 'El nombre de la plantilla debe tener al menos 3 caracteres').max(200, 'Nombre muy largo'),
});

export const aplicarPlantillaSchema = z.object({
  plantillaId: z.string().uuid('ID de plantilla inválido'),
  budgetId: z.string().uuid('ID de presupuesto inválido'),
  modo: z.enum(['estructura', 'todo']),
});

export const renombrarPlantillaSchema = z.object({
  plantillaId: z.string().uuid('ID de plantilla inválido'),
  nuevoNombre: cleanString.min(3, 'El nombre debe tener al menos 3 caracteres').max(200, 'Nombre muy largo'),
});

export const capituloPlantillaInputSchema = z.object({
  nombre: cleanString.min(1, 'Nombre del capítulo requerido').max(200, 'Nombre muy largo'),
  actividades: z.array(z.object({
    nombre:          cleanString.min(1, 'Nombre de actividad requerido').max(300, 'Nombre muy largo'),
    unidad:          z.string().min(1, 'Unidad requerida').max(20, 'Unidad muy larga'),
    cantidad:        z.number().min(0, 'Cantidad no puede ser negativa'),
    precio_unitario: z.number().min(0, 'Precio no puede ser negativo'),
  })),
});

export const actualizarEstructuraPlantillaSchema = z.object({
  plantillaId: z.string().uuid('ID de plantilla inválido'),
  capitulos:   z.array(capituloPlantillaInputSchema),
});
