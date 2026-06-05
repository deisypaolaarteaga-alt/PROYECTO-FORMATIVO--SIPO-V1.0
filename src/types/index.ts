// ============================================================
// SIPO — Tipos del sistema de presupuestación
// Metodología colombiana de presupuestos de obra
// ============================================================

// ── Nivel 1: Proyecto ──
export interface Project {
  id: string;
  user_id: string;
  nombre: string;
  descripcion: string | null;
  ubicacion: string | null;         // Ciudad determina precios de insumos
  area_m2: number | null;
  tipo_obra: TipoObra | null;
  cliente_id: string | null;
  cliente_nombre: string | null;    // Legacy
  cliente_email: string | null;     // Legacy
  cliente_telefono: string | null;  // Legacy
  estado: EstadoProyecto;
  created_at: string;
  updated_at: string;
  // Relación
  cliente?: Cliente;
}

// ── Proveedor ──
export type CategoriaProveedor =
  | 'ferreteria'
  | 'contratista'
  | 'equipos'
  | 'laboratorio'
  | 'transporte'
  | 'servicios'
  | 'otro';

export const CATEGORIA_PROVEEDOR_LABELS: Record<CategoriaProveedor, string> = {
  ferreteria:  'Ferretería / Materiales',
  contratista: 'Contratista especializado',
  equipos:     'Arriendo de equipos y maquinaria',
  laboratorio: 'Laboratorio de suelos y concretos',
  transporte:  'Transporte y volquetas',
  servicios:   'Servicios técnicos varios',
  otro:        'Otro',
};

export interface Proveedor {
  id: string
  user_id: string
  tipo: 'persona' | 'empresa'
  nombre_razon_social: string
  nit_cedula?: string
  categoria: CategoriaProveedor
  ciudad?: string
  email?: string
  telefono?: string
  sitio_web?: string
  notas?: string
  activo?: boolean
  deleted_at?: string | null
  created_at: string
  updated_at: string
}

export interface Cliente {
  id: string
  user_id: string
  tipo: 'persona_natural' | 'empresa'
  nombre_razon_social: string
  nit_cedula?: string
  nombre_contacto?: string
  cargo_contacto?: string
  telefono?: string
  email?: string
  ciudad?: string
  departamento?: string
  direccion?: string
  activo: boolean
  notas?: string
  created_at: string
  updated_at: string
  // Relación
  proyectos?: Project[]
}

export type TipoObra =
  | 'residencial'
  | 'comercial'
  | 'industrial'
  | 'infraestructura'
  | 'institucional'
  | 'hotelero'
  | 'otro';

export type EstadoProyecto = 'borrador' | 'en_progreso' | 'finalizado' | 'archivado';

export const TIPO_OBRA_LABELS: Record<TipoObra, string> = {
  residencial:    'Residencial',
  comercial:      'Comercial',
  industrial:     'Industrial',
  infraestructura:'Infraestructura',
  institucional:  'Institucional',
  hotelero:       'Hotelero',
  otro:           'Otro',
};

export const ESTADO_PROYECTO_LABELS: Record<EstadoProyecto, string> = {
  borrador:    'Borrador',
  en_progreso: 'En progreso',
  finalizado:  'Finalizado',
  archivado:   'Archivado',
};

// ── Insumos con precio personalizable ──
export interface MaterialConPrecio {
  id: string;
  nombre: string;
  descripcion: string;
  unidad: string;
  precio_referencia: number;
  departamento: string;
  categoria: string;
  precio_usuario: number | null;
  activo: boolean;
}

export interface EquipoConPrecio {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: string;
  precio_diario: number;
  precio_semanal: number;
  precio_mensual: number;
  departamento: string;
  precio_usuario: number | null;
  activo: boolean;
}

// ── Nivel 2: Presupuesto ──
export interface Budget {
  id: string;
  project_id: string;
  user_id: string;
  titulo: string;
  numero_presupuesto: string | null;
  descripcion: string | null;
  fecha_elaboracion: string | null;
  vigencia_dias: number;             // Vigencia de la oferta en días
  estado: EstadoPresupuesto;
  
  // Costo directo = suma de todos los capítulos
  costo_directo: number;
  valor_total: number;              // Total final calculado (CD + AIU + IVA)
  
  // AIU
  metodo_aiu: MetodoAIU;
  administracion_pct: number;
  imprevistos_pct: number;
  utilidad_pct: number;
  gastos_fijos_mensuales: number;
  duracion_meses: number;

  // IVA
  metodo_iva: MetodoIVA;
  iva_porcentaje: number;
  
  // Retenciones
  mostrar_retenciones: boolean;
  retefuente_pct: number;
  ica_pct: number;
  reteiva_pct: number;              // % sobre el valor del IVA
  ciudad_ica: string;

  moneda: string;
  aprobado_en: string | null;   // Timestamp auto-rellenado por trigger al aprobar
  created_at: string;
  updated_at: string;

  // Relaciones expandidas
  projects?: Partial<Project>;
  chapters?: Chapter[];
}

export type EstadoPresupuesto =
  | 'borrador'
  | 'en_revision'
  | 'aprobado'
  | 'rechazado'
  | 'archivado'
  | 'enviado_a_cliente'
  | 'visto_por_cliente'
  | 'aprobado_por_cliente'
  | 'rechazado_por_cliente'
  | 'con_observaciones';
export type MetodoAIU = 'porcentaje' | 'detallado';
export type MetodoIVA = 'no_aplica' | 'sobre_utilidad' | 'sobre_aiu' | 'sobre_total';

/** Config centralizada de estados de presupuesto — única fuente de verdad para labels, colores y dots */
export const ESTADO_PRESUPUESTO_CONFIG: Record<EstadoPresupuesto, {
  label: string;
  badge: string;  // clases bg + text para el pill (añade border-radius en el componente)
  dot: string;    // bg-* para el indicador de punto en tabs
}> = {
  borrador:             { label: 'Borrador',             badge: 'bg-[#F3F4F6] text-[#4B5563]', dot: 'bg-[#D1D5DB]' },
  en_revision:          { label: 'En revisión',          badge: 'bg-[#FFF4EE] text-[#D95510]', dot: 'bg-[#D97706]' },
  aprobado:             { label: 'Aprobado',             badge: 'bg-[#EBFAF0] text-[#166534]', dot: 'bg-[#16A34A]' },
  rechazado:            { label: 'Rechazado',            badge: 'bg-[#FEF0F0] text-[#991B1B]', dot: 'bg-[#DC2626]' },
  archivado:            { label: 'Archivado',            badge: 'bg-[#F3F4F6] text-[#9CA3AF]', dot: 'bg-[#9CA3AF]' },
  enviado_a_cliente:    { label: 'Enviado al cliente',   badge: 'bg-[#EFF6FF] text-[#1D4ED8]', dot: 'bg-[#3B82F6]' },
  visto_por_cliente:    { label: 'Visto por cliente',    badge: 'bg-[#F0F9FF] text-[#0369A1]', dot: 'bg-[#0EA5E9]' },
  aprobado_por_cliente: { label: 'Aprobado por cliente', badge: 'bg-[#EBFAF0] text-[#166534]', dot: 'bg-[#16A34A]' },
  rechazado_por_cliente:{ label: 'Rechazado por cliente',badge: 'bg-[#FEF0F0] text-[#991B1B]', dot: 'bg-[#DC2626]' },
  con_observaciones:    { label: 'Con observaciones',    badge: 'bg-[#FFFBEB] text-[#92400E]', dot: 'bg-[#F59E0B]' },
};

export interface ConfigAIU {
  metodo: MetodoAIU;
  administracion: number;    // %
  imprevistos: number;       // %
  utilidad: number;          // %
  gastosFijosMensuales?: number;
  duracionMeses?: number;
}

export interface ConfigRetenciones {
  mostrar_en_resumen: boolean;
  retefuente_pct: number;
  ica_pct: number;
  reteiva_pct: number;
  ciudad_ica: string;
}

// ── Nivel 3: Capítulo ──
export interface Chapter {
  id: string;
  budget_id: string;
  user_id: string;
  nombre: string;
  descripcion: string | null;
  numero: number;                    // Orden: 01, 02, 03...
  valor_subtotal: number;            // Calculado: suma de actividades
  created_at: string;
  updated_at: string;
  // Relación expandida
  activities?: Activity[];
}

// ── Nivel 4: Actividad ──
export interface Activity {
  id: string;
  chapter_id: string;
  budget_id: string;
  user_id: string;
  numero: number;                    // Orden dentro del capítulo: 1, 2, 3...
  nombre: string;                    // Descripción completa
  unidad: UnidadMedida;
  cantidad: number;                  // Metrado de la obra
  precio_unitario: number;           // SOLO LECTURA — viene del APU
  subtotal: number;                  // Generated: cantidad × precio_unitario
  precio_desde_apu: boolean;
  catalogo_actividad_id?: string | null;
  created_at: string;
  updated_at: string;
  // Relación expandida
  apu?: APU | null;
  apu_items?: APUItem[];
}

export type UnidadMedida =
  | 'm²' | 'ml' | 'm³' | 'kg' | 'gl' | 'un'
  | 'hr' | 'pto' | 'vje' | 'día' | 'ton' | 'lt';

export const UNIDADES_MEDIDA: UnidadMedida[] = [
  'm²', 'ml', 'm³', 'kg', 'gl', 'un', 'hr', 'pto', 'vje', 'día', 'ton', 'lt'
];

// ── Nivel 5: APU (Análisis de Precio Unitario) ──
export interface APU {
  id: string;
  activity_id: string;
  budget_id: string;
  user_id: string;
  codigo_apu: string | null;
  descripcion: string | null;
  rendimiento: number;
  costo_material: number;
  costo_mano_obra: number;
  costo_equipo: number;
  costo_herramienta_menor: number;
  costo_epp: number;
  pct_herramienta_menor: number;     // % sobre MO (típico 3%)
  pct_epp: number;                   // % sobre MO (típico 1%)
  costo_total: number;
  created_at: string;
  updated_at: string;
  // Relación expandida (incluida cuando se hace join con apu_items)
  apu_items?: APUItem[];
}

// ── Ítem de APU ──
export interface APUItem {
  id: string;
  apu_id: string;
  user_id: string;
  nombre: string;
  descripcion: string | null;
  tipo: TipoAPUItem;
  unidad: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  cuadrilla_id?: string | null;
  precio_editado_manual?: boolean;
  created_at: string;
  updated_at: string;
}

export type TipoAPUItem =
  | 'material'
  | 'mano_obra'
  | 'equipo'
  | 'herramienta_menor'
  | 'epp';

export interface TrabajadorApu {
  jornal: number;
  nivelRiesgo: 1 | 2 | 3 | 4 | 5;
  cantidad: number;
  especialidad?: string;
}

export interface ApuItemMO extends APUItem {
  rendimiento: number;
  trabajadores: TrabajadorApu[];
}

export const TIPO_APU_LABELS: Record<TipoAPUItem, string> = {
  material:           'Material',
  mano_obra:          'Mano de Obra',
  equipo:             'Equipo',
  herramienta_menor:  'Herramienta Menor',
  epp:                'EPP',
};

// ── Tipos compuestos para el editor ──

/** Actividad con su APU adjunto (resultado de obtenerPresupuesto) */
export type ActivityWithAPU = Activity & {
  apus?: APU[];
};

/** Capítulo con actividades y APUs (resultado de obtenerPresupuesto) */
export type ChapterWithActivities = Chapter & {
  activities?: ActivityWithAPU[];
};

/** Presupuesto completo con relaciones expandidas (resultado de obtenerPresupuesto) */
export type BudgetCompleto = Budget & {
  projects?: {
    nombre: string;
    ubicacion: string | null;
    cliente_id: string | null;
    cliente_nombre: string | null;
    tipo_obra: string | null;
    clientes?: Cliente;
  };
  chapters?: ChapterWithActivities[];
};

// ── Cálculos del presupuesto ──
export interface ResumenPresupuesto {
  costoDirecto: number;
  administracion: number;
  imprevistos: number;
  utilidad: number;
  aiu: number;
  subtotalConAIU: number;
  iva: number;
  totalOferta: number;
  // Retenciones
  retefuente: number;
  ica: number;
  reteiva: number;
  totalRetenciones: number;
  totalNeto: number;
}

// ── Plantillas de capítulos por tipo de obra ──
export const CAPITULOS_TIPICOS = [
  '01. PRELIMINARES',
  '02. CIMENTACIÓN',
  '03. ESTRUCTURA',
  '04. MAMPOSTERÍA',
  '05. INSTALACIONES',
  '06. ACABADOS',
] as const;

export const PLANTILLAS_CAPITULOS: Record<string, string[]> = {
  residencial: [
    'PRELIMINARES Y DESCAPOTE',
    'CIMENTACIÓN',
    'ESTRUCTURA EN CONCRETO',
    'MAMPOSTERÍA',
    'CUBIERTA',
    'INSTALACIONES HIDROSANITARIAS',
    'INSTALACIONES ELÉCTRICAS',
    'PAÑETES Y REVOQUES',
    'PISOS Y ENCHAPES',
    'PINTURA Y ACABADOS',
    'CARPINTERÍA METÁLICA Y MADERA',
    'APARATOS Y ACCESORIOS',
    'OBRAS EXTERIORES'
  ],
  comercial: [
    'PRELIMINARES',
    'ESTRUCTURA',
    'MAMPOSTERÍA Y DIVISORIOS',
    'INSTALACIONES ELÉCTRICAS Y REDES',
    'CLIMATIZACIÓN Y AA',
    'REDES CONTRA INCENDIO',
    'ACABADOS Y PISOS',
    'ILUMINACIÓN PROFESIONAL',
    'FACHADAS Y VITRINAS',
    'ASEO Y ENTREGA'
  ],
  industrial: [
    'PRELIMINARES Y EXCAVACIÓN',
    'CIMENTACIÓN Y PLACAS',
    'ESTRUCTURA METÁLICA',
    'CERRAMIENTOS',
    'PISOS INDUSTRIALES',
    'REDES ELÉCTRICAS ALTA TENSIÓN',
    'REDES HIDRÁULICAS Y CONTRA INCENDIO',
    'OFICINAS Y SERVICIOS'
  ],
  infraestructura: [
    'PRELIMINARES Y LOCALIZACIÓN',
    'MOVIMIENTO DE TIERRAS',
    'OBRAS DE ARTE Y DRENAJE',
    'SUB-BASE Y BASE',
    'PAVIMENTO / ASFALTO',
    'SEÑALIZACIÓN',
    'URBANISMO'
  ],
  institucional: [
    'PRELIMINARES Y DEMOLICIONES',
    'CIMENTACIÓN Y ESTRUCTURA',
    'MAMPOSTERÍA Y DIVISIONES',
    'CUBIERTA E IMPERMEABILIZACIÓN',
    'ACABADOS INSTITUCIONALES',
    'INSTALACIONES HIDROSANITARIAS',
    'INSTALACIONES ELÉCTRICAS Y VOZ/DATOS',
    'CARPINTERÍA METÁLICA Y VIDRIOS',
    'OBRAS EXTERIORES Y URBANISMO',
    'EQUIPAMIENTO ESPECIAL'
  ],
  hotelero: [
    'PRELIMINARES',
    'CIMENTACIÓN Y ESTRUCTURA',
    'MAMPOSTERÍA Y DIVISIONES',
    'CUBIERTA',
    'ACABADOS DE ALTA GAMA',
    'INSTALACIONES HIDROSANITARIAS HOTELERAS',
    'INSTALACIONES ELÉCTRICAS Y AUTOMATIZACIÓN',
    'CARPINTERÍA FINA Y VIDRIOS',
    'ZONAS HÚMEDAS Y PISCINA',
    'ÁREAS SOCIALES Y EXTERIORES'
  ]
};

// ── Perfil de usuario ──
export interface Profile {
  id: string;
  email: string;
  nombre_completo: string | null;
  empresa: string | null;
  ciudad: string | null;
  nit: string | null;
  logo_url: string | null;
  cargo_firma: string | null;
  firma_url: string | null;
  suscripcion: 'gratis' | 'pro';
  rol: 'usuario' | 'super_admin';
  preferences?: UserPreferences | null;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  accentColor: string;
  density: 'compact' | 'normal' | 'spacious';
  showCompanyName: boolean;
  defaultCity: string;
}

// ── Server Action result ──
export interface ActionResult<T = unknown> {
  success: boolean;
  error?: string;
  message?: string;
  data?: T;
  field?: string;
}

// ── Explosión de Insumos (Lista Global de Materiales) ──
export interface InsumoExplotado {
  nombre: string;
  unidad: string;
  tipo: TipoAPUItem;
  cantidad_total: number;
  precio_unitario: number;
  subtotal_total: number;
  proveedor_id: string | null;
}

export interface ExplosionInsumos {
  budget_id: string;
  items: InsumoExplotado[];
  totales: {
    material: number;
    mano_obra: number;
    equipo: number;
    herramienta_menor: number;
    epp: number;
    gran_total: number;
  };
}

// ── Catálogo de referencia ──
export interface CatalogoCapitulo {
  id: string;
  codigo: string;
  nombre: string;
  tipo_obra: string;
  numero: number;
  descripcion: string | null;
  catalogo_actividades?: CatalogoActividad[];
}

export interface CatalogoActividad {
  id: string;
  catalogo_capitulo_id: string;
  tipo_obra: string;
  codigo: string;
  nombre: string;
  unidad: string;
  precio_referencia_nacional: number;
  rango_min: number;
  rango_max: number;
  descripcion: string | null;
  catalogo_apu_items?: CatalogoApuItem[];
}

export interface CatalogoApuItem {
  id: string;
  catalogo_actividad_id: string;
  tipo: TipoAPUItem;
  nombre: string;
  descripcion: string | null;
  unidad: string;
  /** Cantidad por unidad de la actividad (rendimiento = 1) */
  cantidad: number;
  precio_unitario: number;
  orden: number;
}

// ── Búsqueda de insumos del catálogo ──
export interface ResultadoBusquedaInsumo {
  id: string;
  nombre: string;
  unidad: string;
  precio_unitario: number;
  origen: 'material' | 'trabajador' | 'equipo';
}

export interface TrabajadorCuadrilla {
  nombre: string;
  cantidad: number;
  jornal: number;
  unidad: string;
}

export interface ResultadoBusquedaCuadrilla {
  id: string;
  nombre: string;
  costo_total_dia: number;
  es_sistema: boolean;
  trabajadores: TrabajadorCuadrilla[];
}

// ── Plantillas personales de usuario ──
export type ModoAplicarPlantilla = 'estructura' | 'todo';

export interface UserPlantilla {
  id: string
  nombre: string
  tipo_obra?: string
  descripcion?: string
  created_at: string
  _count?: { capitulos: number }
}

export interface PlantillaDetalle {
  id: string
  nombre: string
  created_at: string
  capitulos: CapituloPlantilla[]
}

export interface CapituloPlantilla {
  id: string
  nombre: string
  orden: number
  actividades: ActividadPlantilla[]
}

export interface ActividadPlantilla {
  id: string
  nombre: string
  unidad: string
  cantidad: number
  precio_unitario: number
  orden: number
}

export interface CapituloPlantillaInput {
  nombre: string
  actividades: { nombre: string; unidad: string; cantidad: number; precio_unitario: number }[]
}

// ── Portal del Cliente ──
export interface PresupuestoToken {
  id: string;
  budget_id: string;
  token: string;
  expires_at: string;
  cliente_email: string;
  cliente_nombre: string | null;
  cliente_accion: 'aprobado' | 'rechazado' | 'comentado' | null;
  cliente_comentario: string | null;
  cliente_firma_nombre: string | null;
  cliente_respondio_at: string | null;
  visto_at: string | null;
  visto_count: number;
}

// ── Versionado de presupuestos ───────────────────────────────────────────────

export interface BudgetSnapshot {
  id: string
  budget_id: string
  version: number
  motivo: 'rechazo_cliente' | 'reapertura_manual' | 'aprobacion' | 'envio_cliente'
  estado_budget: string
  total_oferta: number
  costo_directo: number
  created_at: string
  data?: SnapshotData
}

export interface SnapshotData {
  version: number
  costo_directo: number
  metodo_aiu: string
  administracion_pct: number
  imprevistos_pct: number
  utilidad_pct: number
  metodo_iva: string
  iva_porcentaje: number
  capitulos: SnapshotCapitulo[]
}

export interface SnapshotCapitulo {
  id: string
  nombre: string
  orden: number
  valor_subtotal: number
  actividades: SnapshotActividad[]
}

export interface SnapshotActividad {
  id: string
  nombre: string
  unidad: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  apu?: SnapshotAPU
}

export interface SnapshotAPU {
  rendimiento: number
  pct_herramienta_menor: number
  pct_epp: number
  costo_material: number
  costo_mano_obra: number
  costo_equipo: number
  items: SnapshotAPUItem[]
}

export interface SnapshotAPUItem {
  tipo: string
  nombre: string
  unidad: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

// ── Ciudades de Colombia ──
export const CIUDADES_COLOMBIA = [
  'Bogotá D.C.', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
  'Bucaramanga', 'Pereira', 'Manizales', 'Santa Marta', 'Cúcuta',
  'Ibagué', 'Villavicencio', 'Pasto', 'Neiva', 'Armenia',
  'Montería', 'Popayán', 'Tunja', 'Sincelejo', 'Valledupar',
  'Florencia', 'Riohacha', 'Quibdó', 'Yopal', 'Mocoa',
  'Leticia', 'San José del Guaviare', 'Inírida', 'Puerto Carreño', 'Mitú',
] as const;
