import { Budget, Profile, Project, Chapter, Activity } from './index';

export interface PresupuestoPDFData extends Budget {
  projects?: Partial<Project>;
  chapters?: (Chapter & {
    activities?: Activity[];
  })[];
}

export interface ConfigPDFProfesional {
  logo_url?: string | null;
  nombre_completo?: string | null;
  empresa?: string | null;
  nit?: string | null;
  regimen_tributario?: 'responsable_iva' | 'no_responsable';
  matricula_profesional?: string | null;
  ciudad?: string | null;
  /** Cargo o título profesional del firmante (ej: "Ingeniero Civil"). No existe aún en la BD — campo reservado. */
  cargo?: string | null;
  profesion?: string | null;
}

export interface ParametrosFiscales {
  año: number;
  smmlv: number;
  aux_transporte: number;
  factor_prestacional_riesgo_i: number;
  factor_prestacional_riesgo_ii: number;
  factor_prestacional_riesgo_iii: number;
  factor_prestacional_riesgo_iv: number;
  factor_prestacional_riesgo_v: number;
  divisor_apu: number;
  tpnl_porcentaje: number;
  herramienta_menor_porcentaje: number;
  epp_porcentaje: number;
}

export interface PDFExportOptions {
  incluirAPUs?: boolean;
  incluirRetenciones?: boolean;
  incluirGrafico?: boolean;
  clienteNombre?: string;
  vigencia?: number;
  parametrosFiscales?: ParametrosFiscales;
}
