'use client'

import { useState } from 'react'
import { ETAPAS_FLUJO, ESTADO_LABELS } from '@/types'
import type { EstadoOficio } from '@/types'
import { cn } from '@/lib/utils'
import {
  Inbox, PenLine, PenSquare, MailQuestion, MailX,
  RefreshCw, MailCheck, CheckCircle2, Archive,
  ArrowRight, Info
} from 'lucide-react'

const ICONOS: Record<string, React.ComponentType<{ size: number; className?: string }>> = {
  Inbox, PenLine, PenSquare, MailQuestion, MailX,
  RefreshCw, MailCheck, CheckCircle2, Archive,
}

const DESCRIPCIONES_DETALLE: Record<EstadoOficio, { descripcion: string; acciones: string[]; siguiente: string[] }> = {
  recibido: {
    descripcion: 'El oficio acaba de ingresar al sistema. Se registra con número de folio, remitente, tema y fecha de recepción.',
    acciones: ['Asignar responsable', 'Clasificar por prioridad', 'Registrar en el sistema', 'Adjuntar archivo físico escaneado'],
    siguiente: ['en_proceso'],
  },
  en_proceso: {
    descripcion: 'El oficio fue asignado y está siendo atendido. El responsable trabaja en la elaboración de la respuesta o gestión.',
    acciones: ['Elaborar respuesta o dictamen', 'Coordinar con otros departamentos', 'Actualizar avances', 'Subir documentos de trabajo'],
    siguiente: ['firmado'],
  },
  firmado: {
    descripcion: 'El documento fue revisado, aprobado y firmado por el funcionario correspondiente. Listo para despacho.',
    acciones: ['Registrar fecha de despacho', 'Enviar al destinatario', 'Archivar copia física', 'Registrar número de envío'],
    siguiente: ['requiere_respuesta', 'terminado'],
  },
  requiere_respuesta: {
    descripcion: 'Se enviaron documentos que requieren respuesta por parte del destinatario. Se monitorea el plazo.',
    acciones: ['Monitorear plazo de respuesta', 'Registrar acuse de recibo', 'Preparar reitera si no hay respuesta'],
    siguiente: ['respondido', 'sin_respuesta'],
  },
  sin_respuesta: {
    descripcion: 'El plazo venció y no se recibió respuesta. Se prepara un oficio de reiteración de la petición.',
    acciones: ['Elaborar oficio de reiteración', 'Notificar a superiores', 'Establecer nuevo plazo'],
    siguiente: ['reiterado'],
  },
  reiterado: {
    descripcion: 'Se envió un segundo oficio reiterando la petición original al destinatario, con nueva fecha límite.',
    acciones: ['Dar seguimiento a la reiteración', 'Registrar envío de reiteración', 'Monitorear respuesta'],
    siguiente: ['requiere_respuesta'],
  },
  respondido: {
    descripcion: 'Se recibió respuesta del destinatario. Se revisa el contenido y se evalúa si el asunto queda concluido.',
    acciones: ['Registrar fecha de respuesta', 'Adjuntar respuesta recibida', 'Evaluar si se requiere acción adicional'],
    siguiente: ['terminado'],
  },
  terminado: {
    descripcion: 'El asunto fue atendido completamente y el proceso administrativo ha concluido satisfactoriamente.',
    acciones: ['Registrar fecha de terminación', 'Elaborar resumen ejecutivo', 'Preparar para archivo'],
    siguiente: ['archivado'],
  },
  archivado: {
    descripcion: 'El expediente completo fue archivado en el sistema. Permanece disponible para consulta histórica.',
    acciones: ['Asignar número de expediente', 'Registrar ubicación física', 'Cerrar el ciclo documental'],
    siguiente: [],
  },
}

const COLOR_MAP: Record<string, string> = {
  blue:   'bg-blue-500',
  purple: 'bg-purple-500',
  indigo: 'bg-indigo-500',
  amber:  'bg-amber-500',
  red:    'bg-red-500',
  orange: 'bg-orange-500',
  teal:   'bg-teal-500',
  green:  'bg-green-500',
  gray:   'bg-gray-400',
}

const CARD_COLOR_MAP: Record<string, string> = {
  blue:   'border-blue-200 bg-blue-50 hover:border-blue-400',
  purple: 'border-purple-200 bg-purple-50 hover:border-purple-400',
  indigo: 'border-indigo-200 bg-indigo-50 hover:border-indigo-400',
  amber:  'border-amber-200 bg-amber-50 hover:border-amber-400',
  red:    'border-red-200 bg-red-50 hover:border-red-400',
  orange: 'border-orange-200 bg-orange-50 hover:border-orange-400',
  teal:   'border-teal-200 bg-teal-50 hover:border-teal-400',
  green:  'border-green-200 bg-green-50 hover:border-green-400',
  gray:   'border-gray-200 bg-gray-50 hover:border-gray-400',
}

const TEXT_COLOR_MAP: Record<string, string> = {
  blue:   'text-blue-700',
  purple: 'text-purple-700',
  indigo: 'text-indigo-700',
  amber:  'text-amber-700',
  red:    'text-red-700',
  orange: 'text-orange-700',
  teal:   'text-teal-700',
  green:  'text-green-700',
  gray:   'text-gray-600',
}

export default function FlujoVisual() {
  const [seleccionado, setSeleccionado] = useState<EstadoOficio | null>('recibido')

  const etapaSeleccionada = ETAPAS_FLUJO.find(e => e.estado === seleccionado)
  const detalle = seleccionado ? DESCRIPCIONES_DETALLE[seleccionado] : null

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <p className="text-xs text-gray-500">Haz clic en cualquier etapa para ver detalles del proceso</p>
      </div>

      {/* Diagrama de flujo */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-6">Flujo completo del proceso documental</h3>

        {/* Etapas lineales principales */}
        <div className="mb-8">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Flujo principal</p>
          <div className="flex items-center gap-0 flex-wrap">
            {['recibido', 'en_proceso', 'firmado', 'terminado', 'archivado'].map((estado, i, arr) => {
              const etapa = ETAPAS_FLUJO.find(e => e.estado === estado)!
              const Icon = ICONOS[etapa.icono]
              const isSelected = seleccionado === estado
              return (
                <div key={estado} className="flex items-center">
                  <button
                    onClick={() => setSeleccionado(estado as EstadoOficio)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all min-w-[100px] text-center',
                      isSelected
                        ? `border-2 shadow-lg scale-105 ${CARD_COLOR_MAP[etapa.color]}`
                        : `border-gray-100 hover:border-gray-200 bg-white ${CARD_COLOR_MAP[etapa.color].replace('border', 'hover:border')}`
                    )}
                  >
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white', COLOR_MAP[etapa.color])}>
                      <Icon size={15} />
                    </div>
                    <p className={cn('text-[10px] font-semibold leading-tight', isSelected ? TEXT_COLOR_MAP[etapa.color] : 'text-gray-600')}>
                      {etapa.label}
                    </p>
                  </button>
                  {i < arr.length - 1 && (
                    <ArrowRight size={16} className="text-gray-300 mx-1 flex-shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Rama: cuando requiere respuesta */}
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Rama: cuando requiere respuesta del destinatario
          </p>
          <div className="flex items-center gap-0 pl-8 border-l-2 border-dashed border-amber-200">
            {['requiere_respuesta', 'sin_respuesta', 'reiterado', 'respondido'].map((estado, i, arr) => {
              const etapa = ETAPAS_FLUJO.find(e => e.estado === estado)!
              const Icon = ICONOS[etapa.icono]
              const isSelected = seleccionado === estado
              return (
                <div key={estado} className="flex items-center">
                  <button
                    onClick={() => setSeleccionado(estado as EstadoOficio)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all min-w-[100px] text-center',
                      isSelected
                        ? `shadow-lg scale-105 ${CARD_COLOR_MAP[etapa.color]}`
                        : `border-gray-100 bg-white hover:bg-gray-50`
                    )}
                  >
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white', COLOR_MAP[etapa.color])}>
                      <Icon size={15} />
                    </div>
                    <p className={cn('text-[10px] font-semibold leading-tight', isSelected ? TEXT_COLOR_MAP[etapa.color] : 'text-gray-600')}>
                      {etapa.label}
                    </p>
                  </button>
                  {i < arr.length - 1 && (
                    <ArrowRight size={14} className="text-gray-300 mx-1 flex-shrink-0" />
                  )}
                </div>
              )
            })}
            <ArrowRight size={14} className="text-gray-300 mx-1" />
            <p className="text-[10px] text-gray-400 italic">→ Terminado</p>
          </div>
        </div>
      </div>

      {/* Panel de detalle */}
      {seleccionado && etapaSeleccionada && detalle && (
        <div className={cn('card p-5 border-l-4', `border-l-${etapaSeleccionada.color}-400`)}>
          <div className="flex items-start gap-4">
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white', COLOR_MAP[etapaSeleccionada.color])}>
              {(() => { const Icon = ICONOS[etapaSeleccionada.icono]; return <Icon size={22} /> })()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-base font-bold text-gray-900">{etapaSeleccionada.label}</h3>
                <span className={cn('badge text-[10px]', CARD_COLOR_MAP[etapaSeleccionada.color], TEXT_COLOR_MAP[etapaSeleccionada.color])}>
                  Estado: {seleccionado}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">{detalle.descripcion}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Acciones en esta etapa</p>
                  <ul className="space-y-1.5">
                    {detalle.acciones.map(accion => (
                      <li key={accion} className="flex items-start gap-2 text-xs text-gray-700">
                        <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0', COLOR_MAP[etapaSeleccionada.color])} />
                        {accion}
                      </li>
                    ))}
                  </ul>
                </div>
                {detalle.siguiente.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Puede avanzar a</p>
                    <div className="space-y-2">
                      {detalle.siguiente.map(sig => {
                        const etapaSig = ETAPAS_FLUJO.find(e => e.estado === sig)
                        if (!etapaSig) return null
                        return (
                          <button
                            key={sig}
                            onClick={() => setSeleccionado(sig as EstadoOficio)}
                            className={cn(
                              'flex items-center gap-2 p-2 rounded-lg border w-full text-left transition-all hover:scale-105',
                              CARD_COLOR_MAP[etapaSig.color]
                            )}
                          >
                            <ArrowRight size={12} className={TEXT_COLOR_MAP[etapaSig.color]} />
                            <span className={cn('text-xs font-medium', TEXT_COLOR_MAP[etapaSig.color])}>
                              {etapaSig.label}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leyenda */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Info size={13} className="text-gray-400" />
          <p className="text-xs font-semibold text-gray-600">Resumen de los 9 estados del flujo</p>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {ETAPAS_FLUJO.map(e => (
            <div
              key={e.estado}
              className={cn('text-[10px] px-2 py-1.5 rounded-lg border text-center cursor-pointer transition-all',
                seleccionado === e.estado
                  ? cn(CARD_COLOR_MAP[e.color], TEXT_COLOR_MAP[e.color], 'font-semibold')
                  : 'border-gray-100 text-gray-500 hover:border-gray-200'
              )}
              onClick={() => setSeleccionado(e.estado)}
            >
              {e.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
