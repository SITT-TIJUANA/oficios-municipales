import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'
import type { EstadoOficio, Prioridad } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ----------------------------------------------------------------
// Formateo de fechas en español
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, "dd/MMM/yyyy", { locale: es })
  } catch {
    return '—'
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, "dd/MMM/yyyy HH:mm", { locale: es })
  } catch {
    return '—'
  }
}

export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return formatDistanceToNow(d, { locale: es, addSuffix: true })
  } catch {
    return '—'
  }
}

export function diasTranscurridos(fecha: string | null | undefined): number {
  if (!fecha) return 0
  try {
    return differenceInDays(new Date(), parseISO(fecha))
  } catch {
    return 0
  }
}

// ----------------------------------------------------------------
// Colores por estado
export const estadoConfig: Record<EstadoOficio, {
  label: string
  badgeClass: string
  dotClass: string
}> = {
  recibido: {
    label: 'Recibido',
    badgeClass: 'bg-blue-50 text-blue-800 border border-blue-200',
    dotClass: 'bg-blue-500',
  },
  en_proceso: {
    label: 'En proceso',
    badgeClass: 'bg-purple-50 text-purple-800 border border-purple-200',
    dotClass: 'bg-purple-500',
  },
  firmado: {
    label: 'Firmado',
    badgeClass: 'bg-indigo-50 text-indigo-800 border border-indigo-200',
    dotClass: 'bg-indigo-500',
  },
  requiere_respuesta: {
    label: 'Req. respuesta',
    badgeClass: 'bg-amber-50 text-amber-800 border border-amber-200',
    dotClass: 'bg-amber-500',
  },
  sin_respuesta: {
    label: 'Sin respuesta',
    badgeClass: 'bg-red-50 text-red-800 border border-red-200',
    dotClass: 'bg-red-500',
  },
  reiterado: {
    label: 'Reiterado',
    badgeClass: 'bg-orange-50 text-orange-800 border border-orange-200',
    dotClass: 'bg-orange-500',
  },
  respondido: {
    label: 'Respondido',
    badgeClass: 'bg-teal-50 text-teal-800 border border-teal-200',
    dotClass: 'bg-teal-500',
  },
  terminado: {
    label: 'Terminado',
    badgeClass: 'bg-green-50 text-green-800 border border-green-200',
    dotClass: 'bg-green-500',
  },
  archivado: {
    label: 'Archivado',
    badgeClass: 'bg-gray-100 text-gray-600 border border-gray-200',
    dotClass: 'bg-gray-400',
  },
}

export const prioridadConfig: Record<Prioridad, {
  label: string
  badgeClass: string
  dotClass: string
}> = {
  alta: {
    label: 'Alta',
    badgeClass: 'bg-red-50 text-red-700 border border-red-200',
    dotClass: 'bg-red-500',
  },
  media: {
    label: 'Media',
    badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',
    dotClass: 'bg-amber-400',
  },
  baja: {
    label: 'Baja',
    badgeClass: 'bg-green-50 text-green-700 border border-green-200',
    dotClass: 'bg-green-400',
  },
}

// ----------------------------------------------------------------
// Formato de tamaño de archivo
export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return '—'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// ----------------------------------------------------------------
// Siguiente estado en el flujo
export function siguienteEstado(actual: EstadoOficio, requiereRespuesta?: boolean): EstadoOficio {
  const flujo: Partial<Record<EstadoOficio, EstadoOficio>> = {
    recibido:           'en_proceso',
    en_proceso:         'firmado',
    firmado:            requiereRespuesta ? 'requiere_respuesta' : 'terminado',
    requiere_respuesta: 'respondido',
    sin_respuesta:      'reiterado',
    reiterado:          'requiere_respuesta',
    respondido:         'terminado',
    terminado:          'archivado',
  }
  return flujo[actual] || actual
}

// ----------------------------------------------------------------
// Validar si estado es "activo" (no concluido)
export function esEstadoActivo(estado: EstadoOficio): boolean {
  return !['terminado', 'archivado'].includes(estado)
}

// ----------------------------------------------------------------
// Truncar texto
export function truncate(str: string | null | undefined, n: number): string {
  if (!str) return ''
  return str.length > n ? str.substring(0, n) + '…' : str
}

// ----------------------------------------------------------------
// Generar iniciales para avatar
export function getInitials(name: string | null | undefined): string {
  if (!name) return '??'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}
