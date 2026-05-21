'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ArrowLeft, Clock, User, Building2, Calendar, FileText,
  MessageSquare, Paperclip, ArrowRight, RotateCcw, Archive,
  CheckCircle2, Download, Send, ChevronDown, AlertCircle
} from 'lucide-react'
import { formatDate, formatDateTime, formatRelative, estadoConfig, prioridadConfig, siguienteEstado, cn, getInitials, diasTranscurridos } from '@/lib/utils'
import { ETAPAS_FLUJO } from '@/types'
import type { Oficio, MovimientoOficio, ArchivoOficio, ComentarioOficio, EstadoOficio } from '@/types'
import { generarPDF } from '@/lib/reportes'

interface Props {
  oficio: Oficio
  movimientos: MovimientoOficio[]
  archivos: ArchivoOficio[]
  comentarios: ComentarioOficio[]
}

export default function OficioDetalle({ oficio, movimientos, archivos, comentarios }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [comentario, setComentario] = useState('')
  const [activeTab, setActiveTab] = useState<'info' | 'historial' | 'archivos' | 'comentarios'>('info')
  const [showAvanzarModal, setShowAvanzarModal] = useState(false)
  const [comentarioMovimiento, setComentarioMovimiento] = useState('')

  const estadoCfg = estadoConfig[oficio.estado]
  const priorCfg = prioridadConfig[oficio.prioridad]
  const diasActivos = Math.round(diasTranscurridos(oficio.fecha_recepcion))

  const handleAvanzarEstado = async () => {
    const nuevoEstado = siguienteEstado(oficio.estado, oficio.requiere_respuesta)
    const res = await fetch(`/api/oficios/${oficio.id}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado, comentario: comentarioMovimiento }),
    })

    if (!res.ok) {
      toast.error('Error al actualizar el estado')
      return
    }

    toast.success(`Estado actualizado: ${estadoConfig[nuevoEstado]?.label}`)
    setShowAvanzarModal(false)
    setComentarioMovimiento('')
    startTransition(() => router.refresh())
  }

  const handleComentario = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comentario.trim()) return

    const res = await fetch(`/api/oficios/${oficio.id}/comentarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comentario }),
    })

    if (res.ok) {
      toast.success('Comentario agregado')
      setComentario('')
      startTransition(() => router.refresh())
    } else {
      toast.error('Error al guardar el comentario')
    }
  }

  const handleReiterar = async () => {
    const res = await fetch(`/api/oficios/${oficio.id}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'reiterado', comentario: 'Se reiteró la petición al destinatario.' }),
    })
    if (res.ok) {
      toast.success('Petición reiterada correctamente')
      startTransition(() => router.refresh())
    }
  }

  const handleGenerarPDF = () => {
    generarPDF({
      oficios: [oficio],
      titulo: `Oficio ${oficio.numero_oficio}`,
    })
    toast.success('PDF generado')
  }

  const siguienteEtapaLabel = estadoConfig[siguienteEstado(oficio.estado, oficio.requiere_respuesta)]?.label

  // Calcular índice de etapa actual en el flujo
  const etapaActualIdx = ETAPAS_FLUJO.findIndex(e => e.estado === oficio.estado)

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/oficios" className="flex items-center gap-1 hover:text-guinda">
          <ArrowLeft size={12} /> Oficios
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{oficio.numero_oficio}</span>
      </div>

      {/* Header card */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-guinda bg-guinda-50 px-2 py-1 rounded-md border border-guinda-100">
                {oficio.numero_oficio}
              </span>
              <span className={`badge ${estadoCfg.badgeClass}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${estadoCfg.dotClass}`} />
                {estadoCfg.label}
              </span>
              <span className={`badge ${priorCfg.badgeClass}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${priorCfg.dotClass}`} />
                {priorCfg.label}
              </span>
              {diasActivos > 15 && (
                <span className="badge bg-red-50 text-red-700 border border-red-200">
                  <AlertCircle size={10} />
                  {diasActivos} días
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-gray-900 leading-tight mb-1">{oficio.tema}</h2>
            {oficio.descripcion && (
              <p className="text-sm text-gray-600 leading-relaxed">{oficio.descripcion}</p>
            )}
          </div>

          {/* Acciones */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            {!['terminado', 'archivado'].includes(oficio.estado) && (
              <button
                onClick={() => setShowAvanzarModal(true)}
                disabled={isPending}
                className="btn-primary text-xs"
              >
                <ArrowRight size={13} />
                {siguienteEtapaLabel}
              </button>
            )}
            {oficio.estado === 'requiere_respuesta' && (
              <button onClick={handleReiterar} className="btn-secondary text-xs">
                <RotateCcw size={13} />
                Reiterar petición
              </button>
            )}
            <button onClick={handleGenerarPDF} className="btn-secondary text-xs">
              <Download size={13} />
              Generar PDF
            </button>
            <Link href={`/oficios/${oficio.id}/editar`} className="btn-ghost text-xs justify-center">
              Editar oficio
            </Link>
          </div>
        </div>

        {/* Metadatos rápidos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-gray-100">
          {[
            { icon: User, label: 'Asignado a', value: oficio.asignado_nombre || '—' },
            { icon: Building2, label: 'Departamento', value: oficio.departamento_nombre || '—' },
            { icon: Calendar, label: 'Fecha recepción', value: formatDate(oficio.fecha_recepcion) },
            { icon: Clock, label: 'Días transcurridos', value: `${diasActivos} días`, alert: diasActivos > 15 },
          ].map(item => (
            <div key={item.label} className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <item.icon size={14} className="text-gray-500" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-medium">{item.label}</p>
                <p className={cn('text-xs font-semibold', item.alert ? 'text-red-600' : 'text-gray-800')}>
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FLUJO VISUAL */}
      <div className="card p-5 overflow-x-auto">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Flujo del proceso</h3>
        <div className="flex items-center gap-0 min-w-[700px]">
          {ETAPAS_FLUJO.map((etapa, i) => {
            const isPast = i < etapaActualIdx
            const isCurrent = i === etapaActualIdx
            const isFuture = i > etapaActualIdx

            return (
              <div key={etapa.estado} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
                    isPast ? 'bg-green-500 border-green-500 text-white' : '',
                    isCurrent ? 'bg-guinda border-guinda text-white shadow-lg shadow-guinda/30 scale-110' : '',
                    isFuture ? 'bg-gray-100 border-gray-200 text-gray-400' : '',
                  )}>
                    {isPast ? <CheckCircle2 size={14} /> : i + 1}
                  </div>
                  <p className={cn(
                    'text-[9px] text-center max-w-[70px] leading-tight font-medium',
                    isCurrent ? 'text-guinda' : isPast ? 'text-green-600' : 'text-gray-400'
                  )}>
                    {etapa.label}
                  </p>
                </div>
                {i < ETAPAS_FLUJO.length - 1 && (
                  <div className={cn('flex-1 h-0.5 mx-1', isPast ? 'bg-green-400' : 'bg-gray-200')} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="card overflow-hidden">
        <div className="border-b border-gray-100 flex">
          {([
            { key: 'info', label: 'Información', icon: FileText },
            { key: 'historial', label: `Historial (${movimientos.length})`, icon: Clock },
            { key: 'archivos', label: `Archivos (${archivos.length})`, icon: Paperclip },
            { key: 'comentarios', label: `Comentarios (${comentarios.length})`, icon: MessageSquare },
          ] as { key: typeof activeTab; label: string; icon: React.ComponentType<{ size: number }> }[]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-all',
                activeTab === tab.key
                  ? 'border-guinda text-guinda'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <tab.icon size={13} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* TAB: Información */}
          {activeTab === 'info' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4">
              {[
                { label: 'Tipo de documento', value: oficio.tipo_documento },
                { label: 'Requiere respuesta', value: oficio.requiere_respuesta ? 'Sí' : 'No' },
                { label: 'Fecha de despacho', value: formatDate(oficio.fecha_despacho) },
                { label: 'Fecha de respuesta', value: formatDate(oficio.fecha_respuesta) },
                { label: 'Fecha de terminación', value: formatDate(oficio.fecha_terminacion) },
                { label: 'Fecha límite', value: formatDate(oficio.fecha_limite) },
                { label: 'Remitente', value: oficio.remitente_nombre || '—' },
                { label: 'Cargo remitente', value: oficio.remitente_cargo || '—' },
                { label: 'Institución', value: oficio.remitente_institucion || '—' },
                { label: 'Destinatario', value: oficio.destinatario_nombre || '—' },
                { label: 'Total archivos', value: String(archivos.length) },
                { label: 'Registrado', value: formatDateTime(oficio.created_at) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-0.5">{label}</p>
                  <p className="text-sm text-gray-800">{value}</p>
                </div>
              ))}
              {oficio.observaciones && (
                <div className="col-span-full">
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-0.5">Observaciones</p>
                  <p className="text-sm text-gray-800 leading-relaxed">{oficio.observaciones}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB: Historial */}
          {activeTab === 'historial' && (
            <div className="space-y-0">
              {movimientos.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm">Sin movimientos registrados</p>
              ) : movimientos.map((mov, i) => {
                const cfg = estadoConfig[mov.estado_nuevo as EstadoOficio]
                return (
                  <div key={mov.id} className="flex gap-4 pb-6 relative">
                    {i < movimientos.length - 1 && (
                      <div className="absolute left-4 top-8 bottom-0 w-px bg-gray-100" />
                    )}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${cfg?.badgeClass || 'bg-gray-100'}`}>
                      <div className={`w-2 h-2 rounded-full ${cfg?.dotClass || 'bg-gray-400'}`} />
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-semibold text-gray-900">{cfg?.label || mov.estado_nuevo}</p>
                        {mov.estado_anterior && (
                          <span className="text-[10px] text-gray-400">desde: {estadoConfig[mov.estado_anterior as EstadoOficio]?.label || mov.estado_anterior}</span>
                        )}
                      </div>
                      {mov.comentario && (
                        <p className="text-xs text-gray-600 mb-1 italic">"{mov.comentario}"</p>
                      )}
                      <p className="text-[10px] text-gray-400">
                        {(mov as { perfil?: { nombre_completo: string } }).perfil?.nombre_completo || 'Sistema'} · {formatDateTime(mov.fecha)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* TAB: Archivos */}
          {activeTab === 'archivos' && (
            <div>
              {archivos.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm">Sin archivos adjuntos</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {archivos.map(archivo => (
                    <a
                      key={archivo.id}
                      href={archivo.url_publica || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:border-guinda-200 hover:bg-guinda-50/30 transition-all group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-guinda-50 flex items-center justify-center flex-shrink-0">
                        <Paperclip size={14} className="text-guinda" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-800 truncate">{archivo.nombre}</p>
                        <p className="text-[10px] text-gray-400 capitalize">{archivo.tipo_archivo}</p>
                      </div>
                      <Download size={12} className="text-gray-300 group-hover:text-guinda flex-shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: Comentarios */}
          {activeTab === 'comentarios' && (
            <div>
              <div className="space-y-4 mb-6">
                {comentarios.length === 0 ? (
                  <p className="text-center py-6 text-gray-400 text-sm">Sin comentarios</p>
                ) : comentarios.map(com => (
                  <div key={com.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-guinda-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-guinda">
                      {getInitials((com as { autor?: { nombre_completo: string } }).autor?.nombre_completo)}
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-xl rounded-tl-none p-3">
                        <p className="text-xs font-semibold text-gray-900 mb-0.5">
                          {(com as { autor?: { nombre_completo: string } }).autor?.nombre_completo || 'Usuario'}
                          {com.es_interno && <span className="ml-2 text-[9px] text-guinda bg-guinda-50 px-1.5 py-0.5 rounded">Interno</span>}
                        </p>
                        <p className="text-xs text-gray-700 leading-relaxed">{com.comentario}</p>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 ml-3">{formatRelative(com.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleComentario} className="flex gap-3">
                <textarea
                  value={comentario}
                  onChange={e => setComentario(e.target.value)}
                  placeholder="Agregar comentario interno..."
                  rows={2}
                  className="form-input flex-1 resize-none"
                />
                <button type="submit" disabled={!comentario.trim()} className="btn-primary self-end">
                  <Send size={14} />
                  Enviar
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Avanzar estado */}
      {showAvanzarModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in">
            <h3 className="text-base font-bold text-gray-900 mb-1">Avanzar etapa del oficio</h3>
            <p className="text-sm text-gray-500 mb-4">
              Cambiar estado a: <span className="font-semibold text-guinda">{siguienteEtapaLabel}</span>
            </p>
            <textarea
              value={comentarioMovimiento}
              onChange={e => setComentarioMovimiento(e.target.value)}
              placeholder="Comentario del movimiento (opcional)..."
              rows={3}
              className="form-input mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowAvanzarModal(false)} className="btn-secondary">Cancelar</button>
              <button onClick={handleAvanzarEstado} disabled={isPending} className="btn-primary">
                {isPending ? 'Guardando...' : 'Confirmar avance'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
