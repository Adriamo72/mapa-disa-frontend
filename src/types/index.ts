export interface Institucion {
  id: number;
  destino: string;
  nombre: string;
  tipo: 'hospital' | 'enfermeria' | 'destino_enn';
  categoria?: 'I' | 'II' | 'III' | 'N/A'; // CAMBIO: solo I, II o III
  telefono?: string;
  latitud: number | string;
  longitud: number | string;
  created_at?: string;
  personal?: any[];
}

export interface PersonalAsignado {
  tipoPersonal: TipoPersonal;
  especialidad?: Especialidad;
  cantidad: number;
}

export interface TipoPersonal {
  id: number;
  nombre: string;
  color: string;
  descripcion: string;
}

export interface Especialidad {
  id: number;
  nombre: string;
  color: string;
}

// INTERFAZ FILTROS CORREGIDA - ACTUALIZAR para incluir 'destino_enn'
export interface Filtros {
  tiposPersonal: number[];
  especialidades: number[];
  tipoInstitucion: ('hospital' | 'enfermeria' | 'destino_enn')[]; // ACTUALIZADO: agregar 'destino_enn'
}

// TIPOS PARA EL SISTEMA DE PERSONAL MILITAR/CIVIL

export interface PersonalMilitar {
  id: number;
  tipo: 'militar';
  jerarquia: string;
  apellido: string;
  nombre: string;
  documento: string;
  profesion: string;
  especialidad?: Especialidad;
  especialidad_id?: number;
  fecha_ingreso: string;
  unidad?: string;
  activo: boolean;
  orden_importacion?: number; // ← AGREGAR ESTE CAMPO
}

export interface PersonalCivil {
  id: number;
  tipo: 'civil';
  apellido: string;
  nombre: string;
  documento: string;
  profesion: string;
  especialidad?: Especialidad;
  especialidad_id?: number;
  fecha_ingreso: string;
  matricula?: string;
  activo: boolean;
  orden_importacion?: number; // ← AGREGAR ESTE CAMPO
}

export type Personal = PersonalMilitar | PersonalCivil;

export interface AsignacionPersonal {
  id: number;
  institucion_id: number;
  recurso_humano_id: number;
  tipo_personal_id: number;
  especialidad_id?: number;
  fecha_asignacion: string;
  fecha_fin?: string;
  activo: boolean;
  personal?: Personal;
  institucion?: Institucion;
  tipoPersonal?: TipoPersonal;
  especialidad?: Especialidad;
}

// Interfaces para las respuestas de API
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  total?: number;
}

// Interfaces para formularios y filtros
export interface FiltroPersonal {
  tipo: 'todos' | 'militar' | 'civil';
  activo: boolean;
}

export interface FiltroAsignaciones {
  institucion_id: number | '';
  activo: boolean;
}