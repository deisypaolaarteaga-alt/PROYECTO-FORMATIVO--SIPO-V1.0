import { z } from 'zod';

// ============ Project schemas ============

export const createProjectSchema = z.object({
  nombre: z.string().min(1, 'El nombre de la obra es obligatorio').max(200)
    .regex(/^(?=.*[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ])[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.,\-&()'"#/]+$/, 'Debe contener al menos una letra'),
  descripcion: z.string().max(500).optional(),
  ubicacion: z.string().min(1, 'La ciudad es obligatoria'),
  area_m2: z.coerce.number().positive('El área debe ser mayor a 0'),
  tipo_obra: z.enum(['residencial', 'comercial', 'industrial', 'infraestructura', 'institucional', 'hotelero', 'otro'], { message: 'El tipo de obra es obligatorio' }),
  cliente_id: z.string({ message: 'El cliente es obligatorio' }).uuid({ message: 'El cliente es obligatorio' }),
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
  duracion_meses: z.coerce.number().int().min(1).max(60).nullable().optional(),
  metodo_iva: z.enum(['no_aplica', 'sobre_utilidad', 'sobre_aiu', 'sobre_total']).optional(),
  iva_porcentaje: z.coerce.number().min(0).max(100).optional(),
  mostrar_retenciones: z.boolean().optional(),
  retefuente_pct: z.coerce.number().min(0).max(100).optional(),
  ica_pct: z.coerce.number().min(0).max(100).optional(),
  reteiva_pct: z.coerce.number().min(0).max(100).optional(),
  ciudad_ica: z.string().optional(),
  vigencia_dias: z.coerce.number().min(1).optional(),
  area_m2: z.coerce.number().positive('El área debe ser mayor a 0').nullable().optional(),
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
  precio_editado_manual: z.boolean().nullable().optional().default(false),
});

// ============ User Material schemas ============

export const createUserMaterialSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(200),
  descripcion: z.string().max(500).optional(),
  tipo: z.enum(['material', 'mano_obra', 'equipo']),
  unidad: z.string().min(1, 'La unidad es obligatoria'),
  precio_unitario: z.coerce.number().min(0).default(0),
});

// ============ Profile update schema ============

export const updateProfileSchema = z.object({
  nombre_completo: z.string().min(1).max(100).optional(),
  empresa: z.string().max(200).regex(/^$|^(?=.*[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ])[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.,\-&()'"#/]+$/, 'Debe contener al menos una letra').optional(),
  ciudad: z.string().optional(),
  nit: z.string().max(20).regex(/^$|^[\d.\-]+$/, 'NIT inválido — solo números, puntos y guión').optional(),
  telefono: z.string().max(20).regex(/^$|^\d{7,10}$/, 'Teléfono inválido — solo dígitos, 7 a 10 caracteres').optional(),
});

// ============ Cliente schema ============

export const clienteSchema = z.object({
  tipo: z.enum(['persona_natural', 'empresa']),
  nombre_razon_social: z.string().min(2, 'Nombre requerido').max(200)
    .regex(/^(?=.*[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ])[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.,\-&()'"#/]+$/, 'Debe contener al menos una letra'),
  nit_cedula: z.string().max(20).regex(/^$|^[\d.\-]+$/, 'NIT inválido — solo números, puntos y guión').optional(),
  nombre_contacto: z.string().max(100).regex(/^$|^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.\-]+$/, 'Este campo solo acepta letras').optional(),
  cargo_contacto: z.string().max(100).regex(/^$|^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.\-]+$/, 'Este campo solo acepta letras').optional(),
  telefono: z.string().max(20).regex(/^$|^\d{7,10}$/, 'Teléfono inválido — solo dígitos, 7 a 10 caracteres').optional(),
  email: z.union([z.string().email('Email inválido'), z.literal('')]).optional(),
  ciudad: z.string().min(1, 'La ciudad es obligatoria').max(100),
  departamento: z.string().max(100).optional(),
  direccion: z.string().max(200).optional(),
  notas: z.string().max(500).optional(),
});

// ============ Proveedor schema ============

export const proveedorSchema = z.object({
  tipo: z.enum(['persona', 'empresa']),
  nombre_razon_social: z.string().min(2, 'Nombre requerido').max(200)
    .regex(/^(?=.*[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ])[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.,\-&()'"#/]+$/, 'Debe contener al menos una letra'),
  nit_cedula: z.string().max(20).regex(/^$|^[\d.\-]+$/, 'NIT inválido — solo números, puntos y guión').optional(),
  categoria: z.enum(['ferreteria', 'contratista', 'equipos', 'laboratorio', 'transporte', 'servicios', 'otro']),
  ciudad: z.string().max(100).optional(),
  email: z.union([z.string().email('Email inválido'), z.literal('')]).optional(),
  telefono: z.string().max(20).regex(/^$|^\d{7,10}$/, 'Teléfono inválido — solo dígitos, 7 a 10 caracteres').optional(),
  sitio_web: z.union([z.string().url('URL inválida'), z.literal('')]).optional(),
  notas: z.string().max(500).optional(),
});

// ============ CSV Import schemas ============

export const csvClienteRowSchema = z.object({
  nombre_razon_social: z.string().min(2, 'Nombre requerido').max(200),
  tipo: z.enum(['persona_natural', 'empresa'], { message: 'tipo debe ser persona_natural o empresa' }),
  nit_cedula: z.string().max(20).optional().default(''),
  email: z.union([z.string().email('Email inválido'), z.literal('')]).optional().default(''),
  telefono: z.string().max(20).optional().default(''),
  ciudad: z.string().min(1, 'Ciudad requerida').max(100),
  nombre_contacto: z.string().max(100).optional().default(''),
  cargo_contacto: z.string().max(100).optional().default(''),
});

export const csvProveedorRowSchema = z.object({
  nombre_razon_social: z.string().min(2, 'Nombre requerido').max(200),
  tipo: z.enum(['persona', 'empresa'], { message: 'tipo debe ser persona o empresa' }),
  categoria: z.enum(
    ['ferreteria', 'contratista', 'equipos', 'laboratorio', 'transporte', 'servicios', 'otro'],
    { message: 'categoria inválida — usa: ferreteria|contratista|equipos|laboratorio|transporte|servicios|otro' }
  ),
  nit_cedula: z.string().max(20).optional().default(''),
  email: z.union([z.string().email('Email inválido'), z.literal('')]).optional().default(''),
  telefono: z.string().max(20).optional().default(''),
  ciudad: z.string().max(100).optional().default(''),
  sitio_web: z.union([z.string().url('URL inválida'), z.literal('')]).optional().default(''),
});

export const csvInsumoRowSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(200),
  categoria: z.string().max(100).optional().default(''),
  unidad: z.string().min(1, 'Unidad requerida').max(50),
  precio_unitario: z.preprocess(
    (v) => (v === '' || v == null ? 0 : Number(v)),
    z.number().min(0, 'Precio debe ser ≥ 0')
  ),
});

export type CsvClienteRow = z.infer<typeof csvClienteRowSchema>;
export type CsvProveedorRow = z.infer<typeof csvProveedorRowSchema>;
export type CsvInsumoRow = z.infer<typeof csvInsumoRowSchema>;

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

// ============ Catálogo editable — schemas super_admin ============

const TIPO_OBRA_CATALOGO = ['residencial', 'comercial', 'industrial', 'infraestructura', 'institucional', 'hotelero'] as const;
const TIPO_APU_ITEM = ['material', 'mano_obra', 'equipo', 'herramienta_menor', 'epp'] as const;

export const crearCapituloSchema = z.object({
  nombre:    z.string().min(2, 'El nombre es obligatorio').max(200),
  tipo_obra: z.enum(TIPO_OBRA_CATALOGO, { message: 'Tipo de obra inválido' }),
  codigo:    z.string().max(20).optional(),
});

export const actualizarCapituloSchema = z.object({
  nombre:    z.string().min(2, 'El nombre es obligatorio').max(200).optional(),
  tipo_obra: z.enum(TIPO_OBRA_CATALOGO, { message: 'Tipo de obra inválido' }).optional(),
});

export const crearActividadCatalogoSchema = z.object({
  capitulo_id:                z.uuid({ message: 'ID de capítulo inválido' }),
  nombre:                     z.string().min(2, 'El nombre es obligatorio').max(300),
  unidad:                     z.string().min(1, 'La unidad es obligatoria').max(20),
  precio_referencia_nacional: z.coerce.number().min(0).default(0),
  rango_min:                  z.coerce.number().min(0).default(0),
  rango_max:                  z.coerce.number().min(0).default(0),
});

export const actualizarActividadCatalogoSchema = z.object({
  nombre:                     z.string().min(2, 'El nombre es obligatorio').max(300).optional(),
  unidad:                     z.string().min(1, 'La unidad es obligatoria').max(20).optional(),
  precio_referencia_nacional: z.coerce.number().min(0).optional(),
  rango_min:                  z.coerce.number().min(0).optional(),
  rango_max:                  z.coerce.number().min(0).optional(),
});

export const crearCatalogoAPUItemSchema = z.object({
  actividad_id:   z.uuid({ message: 'ID de actividad inválido' }),
  nombre:         z.string().min(2, 'El nombre es obligatorio').max(200),
  unidad:         z.string().min(1, 'La unidad es obligatoria').max(20),
  cantidad:       z.coerce.number().min(0, 'La cantidad debe ser ≥ 0'),
  precio_unitario:z.coerce.number().min(0, 'El precio debe ser ≥ 0'),
  tipo:           z.enum(TIPO_APU_ITEM, { message: 'Tipo de ítem inválido' }),
  orden:          z.coerce.number().min(0).default(0),
});

export const actualizarCatalogoAPUItemSchema = z.object({
  nombre:         z.string().min(2, 'El nombre es obligatorio').max(200).optional(),
  unidad:         z.string().min(1).max(20).optional(),
  cantidad:       z.coerce.number().min(0).optional(),
  precio_unitario:z.coerce.number().min(0).optional(),
  tipo:           z.enum(TIPO_APU_ITEM).optional(),
});

export type CrearCapituloInput              = z.infer<typeof crearCapituloSchema>;
export type ActualizarCapituloInput         = z.infer<typeof actualizarCapituloSchema>;
export type CrearActividadCatalogoInput     = z.infer<typeof crearActividadCatalogoSchema>;
export type ActualizarActividadCatalogoInput= z.infer<typeof actualizarActividadCatalogoSchema>;
export type CrearCatalogoAPUItemInput       = z.infer<typeof crearCatalogoAPUItemSchema>;
export type ActualizarCatalogoAPUItemInput  = z.infer<typeof actualizarCatalogoAPUItemSchema>;

// ============ AIU Componentes schema ============

export const aiuComponenteSchema = z.object({
  nombre:        z.string().min(1, 'El nombre es obligatorio').max(200),
  valor_mensual: z.coerce.number().min(0, 'El valor debe ser mayor o igual a 0'),
});

export type AIUComponenteInput = z.infer<typeof aiuComponenteSchema>;

// ============ Backwards compatibility aliases ============
export const presupuestoSchema = updateBudgetSchema;
export const capituloSchema = createChapterSchema;
export const actividadSchema = createActivitySchema;
export const apuItemSchema = createApuItemSchema;
export const proyectoSchema = createProjectSchema;
