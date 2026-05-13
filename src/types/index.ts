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
  created_at: string;
  updated_at: string;
  
  // Relaciones expandidas
  projects?: Partial<Project>;
  chapters?: Chapter[];
}

export type EstadoPresupuesto = 'borrador' | 'en_revision' | 'aprobado' | 'rechazado' | 'archivado';
export type MetodoAIU = 'porcentaje' | 'detallado';
export type MetodoIVA = 'no_aplica' | 'sobre_utilidad' | 'sobre_aiu' | 'sobre_total';

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
  suscripcion: 'gratis' | 'pro';
  consultas_ia_este_mes: number;
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
}

// ── Explosión de Insumos (Lista Global de Materiales) ──
export interface InsumoExplotado {
  nombre: string;
  unidad: string;
  tipo: TipoAPUItem;
  cantidad_total: number;
  precio_unitario: number;
  subtotal_total: number;
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

// ── Ciudades de Colombia ──
export const CIUDADES_COLOMBIA = [
  'Bogotá D.C.', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
  'Bucaramanga', 'Pereira', 'Manizales', 'Santa Marta', 'Cúcuta',
  'Ibagué', 'Villavicencio', 'Pasto', 'Neiva', 'Armenia',
  'Montería', 'Popayán', 'Tunja', 'Sincelejo', 'Valledupar',
  'Florencia', 'Riohacha', 'Quibdó', 'Yopal', 'Mocoa',
  'Leticia', 'San José del Guaviare', 'Inírida', 'Puerto Carreño', 'Mitú',
] as const;
