import { z } from 'zod';

// ============ Project schemas ============

export const createProjectSchema = z.object({
  nombre: z.string().min(1, 'El nombre de la obra es obligatorio').max(200),
  descripcion: z.string().max(500).optional(),
  ubicacion: z.string().min(1, 'La ciudad es obligatoria'),
  area_m2: z.coerce.number().positive('El área debe ser mayor a 0').optional().nullable(),
  tipo_obra: z.enum(['residencial', 'comercial', 'industrial', 'infraestructura', 'institucional', 'hotelero', 'otro']).optional().nullable(),
  cliente_id: z.string().uuid().optional().nullable(),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  estado: z.enum(['borrador', 'en_progreso', 'finalizado', 'archivado']).optional(),
});

// ============ Budget schemas ============

export const createBudgetSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(200),
  descripcion: z.string().max(500).optional(),
});

export const updateBudgetSchema = z.object({
  titulo: z.string().min(1).max(200).optional(),
  descripcion: z.string().max(500).optional(),
  estado: z.enum(['borrador', 'en_revision', 'aprobado', 'rechazado', 'archivado']).optional(),
  metodo_aiu: z.enum(['porcentaje', 'detallado']).optional(),
  administracion_pct: z.coerce.number().min(0).max(100).optional(),
  imprevistos_pct: z.coerce.number().min(0).max(100).optional(),
  utilidad_pct: z.coerce.number().min(0).max(100).optional(),
  gastos_fijos_mensuales: z.coerce.number().min(0).optional(),
  duracion_meses: z.coerce.number().min(1).optional(),
  metodo_iva: z.enum(['no_aplica', 'sobre_utilidad', 'sobre_aiu', 'sobre_total']).optional(),
  iva_porcentaje: z.coerce.number().min(0).max(100).optional(),
  mostrar_retenciones: z.boolean().optional(),
  retefuente_pct: z.coerce.number().min(0).max(100).optional(),
  ica_pct: z.coerce.number().min(0).max(100).optional(),
  reteiva_pct: z.coerce.number().min(0).max(100).optional(),
  ciudad_ica: z.string().optional(),
  vigencia_dias: z.coerce.number().min(1).optional(),
});

// ============ Chapter schemas ============

export const createChapterSchema = z.object({
  nombre: z.string().min(1, 'El nombre del capítulo es obligatorio').max(200),
});

// ============ Activity schemas ============

export const createActivitySchema = z.object({
  nombre: z.string().min(1, 'La descripción es obligatoria').max(300),
  unidad: z.string().min(1, 'La unidad es obligatoria'),
  cantidad: z.coerce.number().min(0, 'La cantidad debe ser mayor o igual a 0'),
  precio_unitario: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0'),
});

export const updateActivitySchema = createActivitySchema.partial();

// ============ APU Item schemas ============

export const createApuItemSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  tipo: z.enum(['material', 'mano_obra', 'equipo', 'herramienta_menor', 'epp']),
  unidad: z.string().min(1, 'La unidad es obligatoria'),
  cantidad: z.coerce.number().min(0),
  precio_unitario: z.coerce.number().min(0),
  cuadrilla_id: z.string().uuid().optional().nullable(),
  precio_editado_manual: z.boolean().optional(),
});

// ============ User Material schemas ============

export const createUserMaterialSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(200),
  descripcion: z.string().max(500).optional(),
  tipo: z.enum(['material', 'mano_obra', 'equipo']),
  unidad: z.string().min(1, 'La unidad es obligatoria'),
  precio_unitario: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0'),
});

// ============ Profile update schema ============

export const updateProfileSchema = z.object({
  nombre_completo: z.string().min(1).max(100).optional(),
  empresa: z.string().max(200).optional(),
  ciudad: z.string().optional(),
  nit: z.string().max(20).optional(),
  telefono: z.string().max(20).optional(),
});

// ============ Cliente schema ============

export const clienteSchema = z.object({
  tipo: z.enum(['persona_natural', 'empresa']),
  nombre_razon_social: z.string().min(2, 'Nombre requerido').max(200),
  nit_cedula: z.string().max(20).optional(),
  nombre_contacto: z.string().max(100).optional(),
  cargo_contacto: z.string().max(100).optional(),
  telefono: z.string().max(20).optional(),
  email: z.union([z.string().email('Email inválido'), z.literal('')]).optional(),
  ciudad: z.string().max(100).optional(),
  departamento: z.string().max(100).optional(),
  direccion: z.string().max(200).optional(),
  notas: z.string().max(500).optional(),
});

// ============ Proveedor schema ============

export const proveedorSchema = z.object({
  tipo: z.enum(['persona', 'empresa']),
  nombre_razon_social: z.string().min(2, 'Nombre requerido').max(200),
  nit_cedula: z.string().max(20).optional(),
  categoria: z.enum(['ferreteria', 'contratista', 'equipos', 'laboratorio', 'transporte', 'servicios', 'otro']),
  ciudad: z.string().max(100).optional(),
  email: z.union([z.string().email('Email inválido'), z.literal('')]).optional(),
  telefono: z.string().max(20).optional(),
  sitio_web: z.union([z.string().url('URL inválida'), z.literal('')]).optional(),
  notas: z.string().max(500).optional(),
});

// ============ Auth schemas ============

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

export const registroSchema = z.object({
  nombre_completo: z.string().min(2, 'Nombre requerido').max(100),
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe tener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe tener al menos un número')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/, 
      'Debe tener al menos un carácter especial'),
  confirmar_password: z.string(),
}).refine(
  (data) => data.password === data.confirmar_password,
  { message: 'Las contraseñas no coinciden', path: ['confirmar_password'] }
);

export const recuperarContrasenaSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const nuevaContrasenaSchema = z.object({
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe tener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe tener al menos un número')
    .regex(/[!@#$%^&*()_+\-=\[\]{}]/, 
      'Debe tener al menos un carácter especial'),
  confirmar_password: z.string(),
}).refine(
  (data) => data.password === data.confirmar_password,
  { message: 'Las contraseñas no coinciden', path: ['confirmar_password'] }
);

export const onboardingEmpresaSchema = z.object({
  empresa: z.string().min(1, 'El nombre de la empresa es obligatorio').max(200),
  ciudad: z.string().min(1, 'Selecciona una ciudad'),
  nit: z.string().optional(),
  telefono: z.string().optional(),
});

export const onboardingProyectoSchema = z.object({
  nombre: z.string().min(1, 'El nombre de la obra es obligatorio').max(200),
  cliente_nombre: z.string().optional(),
  ubicacion: z.string().min(1, 'Selecciona la ciudad de la obra'),
  descripcion: z.string().max(500).optional(),
});

// Types
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
export type CreateChapterInput = z.infer<typeof createChapterSchema>;
export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type CreateApuItemInput = z.infer<typeof createApuItemSchema>;
export type CreateUserMaterialInput = z.infer<typeof createUserMaterialSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type RegistroInput = z.infer<typeof registroSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RecuperarContrasenaInput = z.infer<typeof recuperarContrasenaSchema>;
export type NuevaContrasenaInput = z.infer<typeof nuevaContrasenaSchema>;
export type OnboardingEmpresaInput = z.infer<typeof onboardingEmpresaSchema>;
export type OnboardingProyectoInput = z.infer<typeof onboardingProyectoSchema>;

// ============ Backwards compatibility aliases ============
export const presupuestoSchema = updateBudgetSchema;
export const capituloSchema = createChapterSchema;
export const actividadSchema = createActivitySchema;
export const apuItemSchema = createApuItemSchema;
export const proyectoSchema = createProjectSchema;
