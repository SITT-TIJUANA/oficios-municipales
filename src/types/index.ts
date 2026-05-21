// ================================================================
// TIPOS TYPESCRIPT - Sistema de Oficios Municipales
// ================================================================

export type Rol = 'administrador' | 'usuario' | 'solo_lectura'

export type EstadoOficio =
  | 'recibido'
  | 'en_proceso'
  | 'firmado'
  | 'requiere_respuesta'
  | 'sin_respuesta'
  | 'reiterado'
  | 'respondido'
  | 'terminado'
  | 'archivado'

export type Prioridad = 'alta' | 'media' | 'baja'
export type TipoDocumento = 'oficio' | 'memorandum' | 'circular' | 'acuerdo' | 'peticion'
export type EstadoInstruccion = 'pendiente' | 'en_proceso' | 'completada' | 'cancelada'
export type TipoArchivo = 'documento' | 'evidencia' | 'foto' | 'reporte' | 'otro'

// ----------------------------------------------------------------
export interface Departamento {
  id: string
  nombre: string
  descripcion: string | null
  activo: boolean
  created_at: string
}

// ----------------------------------------------------------------
export interface Perfil {
  id: string
  nombre_completo: string
  cargo: string | null
  departamento_id: string | null
  rol: Rol
  avatar_url: string | null
  activo: boolean
  created_at: string
  updated_at: string
  // relaciones expandidas
  departamento?: Departamento
}

// ----------------------------------------------------------------
export interface Oficio {
  id: string
  numero_oficio: string
  tema: string
  descripcion: string | null
  estado: EstadoOficio
  prioridad: Prioridad
  tipo_documento: TipoDocumento
  requiere_respuesta: boolean
  asignado_a: string | null
  departamento_id: string | null
  oficio_relacionado: string | null
  fecha_recepcion: string
  fecha_despacho: string | null
  fecha_respuesta: string | null
  fecha_terminacion: string | null
  fecha_limite: string | null
  remitente_nombre: string | null
  remitente_cargo: string | null
  remitente_institucion: string | null
  destinatario_nombre: string | null
  observaciones: string | null
  palabras_clave: string[] | null
  creado_por: string | null
  created_at: string
  updated_at: string
  // relaciones expandidas (view)
  asignado_nombre?: string
  asignado_cargo?: string
  departamento_nombre?: string
  dias_transcurridos?: number
  total_archivos?: number
  total_comentarios?: number
  ultimo_movimiento?: string
}

// ----------------------------------------------------------------
export interface MovimientoOficio {
  id: string
  oficio_id: string
  estado_anterior: string | null
  estado_nuevo: string
  comentario: string | null
  realizado_por: string | null
  fecha: string
  metadata: Record<string, unknown> | null
  // relaciones
  perfil?: Perfil
}

// ----------------------------------------------------------------
export interface ArchivoOficio {
  id: string
  oficio_id: string
  nombre: string
  nombre_storage: string
  tipo_mime: string | null
  tamano_bytes: number | null
  tipo_archivo: TipoArchivo
  url_publica: string | null
  subido_por: string | null
  created_at: string
}

// ----------------------------------------------------------------
export interface Instruccion {
  id: string
  folio: string
  instruccion: string
  descripcion: string | null
  estado: EstadoInstruccion
  prioridad: Prioridad
  asignado_a: string | null
  departamento_id: string | null
  fecha_limite: string | null
  comentarios: string | null
  convertido_a_oficio: string | null
  creado_por: string | null
  created_at: string
  updated_at: string
  // relaciones expandidas
  asignado?: Perfil
  departamento?: Departamento
}

// ----------------------------------------------------------------
export interface ComentarioOficio {
  id: string
  oficio_id: string
  comentario: string
  es_interno: boolean
  autor_id: string | null
  created_at: string
  autor?: Perfil
}

// ----------------------------------------------------------------
export interface Notificacion {
  id: string
  usuario_id: string
  titulo: string
  mensaje: string
  tipo: 'info' | 'alerta' | 'urgente' | 'exito'
  leida: boolean
  oficio_id: string | null
  instruccion_id: string | null
  created_at: string
}

// ----------------------------------------------------------------
export interface PlantillaReporte {
  id: string
  nombre: string
  descripcion: string | null
  tipo: 'pdf' | 'docx' | 'excel'
  contenido: string | null
  variables: Record<string, string> | null
  activo: boolean
  creado_por: string | null
  created_at: string
  updated_at: string
}

// ----------------------------------------------------------------
// Stats para dashboard
export interface EstadisticasDashboard {
  pendientes: number
  concluidos: number
  archivados: number
  urgentes: number
  sin_respuesta: number
  promedio_dias_resolucion: number | null
  total: number
}

// ----------------------------------------------------------------
// Para formularios
export interface OficioFormData {
  numero_oficio: string
  tema: string
  descripcion: string
  estado: EstadoOficio
  prioridad: Prioridad
  tipo_documento: TipoDocumento
  requiere_respuesta: boolean
  asignado_a: string
  departamento_id: string
  fecha_recepcion: string
  fecha_despacho: string
  fecha_respuesta: string
  fecha_terminacion: string
  fecha_limite: string
  remitente_nombre: string
  remitente_cargo: string
  remitente_institucion: string
  destinatario_nombre: string
  observaciones: string
  oficio_relacionado: string
}

export interface InstruccionFormData {
  folio: string
  instruccion: string
  descripcion: string
  estado: EstadoInstruccion
  prioridad: Prioridad
  asignado_a: string
  departamento_id: string
  fecha_limite: string
  comentarios: string
}

// ----------------------------------------------------------------
// Etapas del flujo visual (basado en diagrama)
export const ETAPAS_FLUJO: {
  estado: EstadoOficio
  label: string
  descripcion: string
  color: string
  icono: string
}[] = [
  { estado: 'recibido',           label: 'Oficio recibido',       descripcion: 'Registrado en el sistema', color: 'blue',   icono: 'Inbox' },
  { estado: 'en_proceso',         label: 'En elaboración',        descripcion: 'Asignado, en proceso',     color: 'purple', icono: 'PenLine' },
  { estado: 'firmado',            label: 'Firmado / Despachado',  descripcion: 'Fecha de despacho',        color: 'indigo', icono: 'PenSquare' },
  { estado: 'requiere_respuesta', label: 'Requiere respuesta',    descripcion: 'Esperando respuesta',      color: 'amber',  icono: 'MailQuestion' },
  { estado: 'sin_respuesta',      label: 'Sin respuesta',         descripcion: 'No se recibió respuesta', color: 'red',    icono: 'MailX' },
  { estado: 'reiterado',          label: 'Petición reiterada',    descripcion: 'Se envió recordatorio',    color: 'orange', icono: 'RefreshCw' },
  { estado: 'respondido',         label: 'Oficio respondido',     descripcion: 'Respuesta recibida',       color: 'teal',   icono: 'MailCheck' },
  { estado: 'terminado',          label: 'Asunto terminado',      descripcion: 'Se concluyó el asunto',    color: 'green',  icono: 'CheckCircle2' },
  { estado: 'archivado',          label: 'Archivado',             descripcion: 'Expediente archivado',     color: 'gray',   icono: 'Archive' },
]

export const ESTADO_LABELS: Record<EstadoOficio, string> = {
  recibido:           'Recibido',
  en_proceso:         'En proceso',
  firmado:            'Firmado',
  requiere_respuesta: 'Requiere respuesta',
  sin_respuesta:      'Sin respuesta',
  reiterado:          'Reiterado',
  respondido:         'Respondido',
  terminado:          'Terminado',
  archivado:          'Archivado',
}

export const PRIORIDAD_LABELS: Record<Prioridad, string> = {
  alta:  'Alta',
  media: 'Media',
  baja:  'Baja',
}

export const TIPO_DOC_LABELS: Record<TipoDocumento, string> = {
  oficio:      'Oficio',
  memorandum:  'Memorándum',
  circular:    'Circular',
  acuerdo:     'Acuerdo',
  peticion:    'Petición',
}
