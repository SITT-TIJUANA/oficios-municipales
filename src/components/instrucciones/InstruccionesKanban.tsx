'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, ArrowRight, FileText, Calendar, User, Loader2, X } from 'lucide-react'
import { formatDate, prioridadConfig, cn } from '@/lib/utils'
import type { Instruccion, Departamento, Perfil, EstadoInstruccion, Prioridad } from '@/types'

const COLUMNAS: { estado: EstadoInstruccion; label: string; color: string }[] = [
  { estado: 'pendiente',   label: 'Pendientes',  color: 'bg-amber-50 border-amber-100' },
  { estado: 'en_proceso',  label: 'En proceso',  color: 'bg-blue-50 border-blue-100' },
  { estado: 'completada',  label: 'Completadas', color: 'bg-green-50 border-green-100' },
]

interface Props {
  instrucciones: Instruccion[]
  departamentos: Departamento[]
  perfiles: Perfil[]
}

export default function InstruccionesKanban({ instrucciones, departamentos, perfiles }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showModal, setShowModal] = useState(false)
  const [convirtiendo, setConvirtiendo] = useState<string | null>(null)

  const porEstado = (estado: EstadoInstruccion) =>
    instrucciones.filter(i => i.estado === estado)

  const handleConvertir = async (instruccionId: string) => {
    setConvirtiendo(instruccionId)
    const res = await fetch(`/api/instrucciones/${instruccionId}/convertir`, { method: 'POST' })
    if (res.ok) {
      const { numero_oficio } = await res.json()
      toast.success(`Convertido a oficio ${numero_oficio}`)
      startTransition(() => router.refresh())
    } else {
      toast.error('Error al convertir la instrucción')
    }
    setConvirtiendo(null)
  }

  const handleGuardar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const payload = {
      instruccion: formData.get('instruccion'),
      descripcion: formData.get('descripcion'),
      prioridad: formData.get('prioridad'),
      asignado_a: formData.get('asignado_a') || null,
      departamento_id: formData.get('departamento_id') || null,
      fecha_limite: formData.get('fecha_limite') || null,
      comentarios: formData.get('comentarios') || null,
    }

    const res = await fetch('/api/instrucciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      toast.success('Instrucción creada correctamente')
      setShowModal(false)
      startTransition(() => router.refresh())
    } else {
      toast.error('Error al guardar la instrucción')
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">{instrucciones.length} instrucciones en total</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary text-xs">
          <Plus size={13} />
          Nueva instrucción
        </button>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNAS.map(col => {
          const items = porEstado(col.estado)
          return (
            <div key={col.estado} className={`rounded-xl p-3 border ${col.color} min-h-[200px]`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{col.label}</span>
                <span className="w-5 h-5 rounded-full bg-white border border-gray-200 text-[10px] flex items-center justify-center font-bold text-gray-600">
                  {items.length}
                </span>
              </div>

              <div className="space-y-2">
                {items.map(item => {
                  const priorCfg = prioridadConfig[item.prioridad]
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'kanban-card border-l-4',
                        item.prioridad === 'alta' ? 'border-l-red-400' :
                        item.prioridad === 'media' ? 'border-l-amber-400' : 'border-l-green-400'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-mono text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                          {item.folio}
                        </span>
                        <span className={`badge text-[10px] ${priorCfg.badgeClass}`}>
                          {priorCfg.label}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-gray-900 mb-1 leading-tight">
                        {item.instruccion}
                      </p>
                      {item.descripcion && (
                        <p className="text-[10px] text-gray-500 leading-relaxed mb-2 line-clamp-2">
                          {item.descripcion}
                        </p>
                      )}
                      <div className="space-y-1 mb-3">
                        {(item as { asignado?: { nombre_completo: string } }).asignado?.nombre_completo && (
                          <div className="flex items-center gap-1 text-[10px] text-gray-500">
                            <User size={9} />
                            {(item as { asignado?: { nombre_completo: string } }).asignado?.nombre_completo}
                          </div>
                        )}
                        {item.fecha_limite && (
                          <div className="flex items-center gap-1 text-[10px] text-gray-500">
                            <Calendar size={9} />
                            Vence: {formatDate(item.fecha_limite)}
                          </div>
                        )}
                      </div>

                      {/* Acciones */}
                      <div className="flex gap-1.5">
                        {item.estado !== 'completada' && (
                          <button
                            onClick={() => handleConvertir(item.id)}
                            disabled={convirtiendo === item.id}
                            className="flex items-center gap-1 text-[10px] text-guinda hover:text-guinda-700 font-medium px-2 py-1 rounded-lg hover:bg-guinda-50 transition-colors"
                          >
                            {convirtiendo === item.id ? (
                              <Loader2 size={9} className="animate-spin" />
                            ) : (
                              <FileText size={9} />
                            )}
                            Convertir en oficio
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}

                {items.length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-[10px] text-gray-400">Sin instrucciones</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal nueva instrucción */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900">Nueva instrucción</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleGuardar} className="space-y-4">
              <div>
                <label className="form-label">Instrucción <span className="text-red-500">*</span></label>
                <input type="text" name="instruccion" className="form-input" placeholder="Descripción de la instrucción" required />
              </div>
              <div>
                <label className="form-label">Detalle adicional</label>
                <textarea name="descripcion" className="form-input" rows={2} placeholder="Información adicional..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Prioridad</label>
                  <select name="prioridad" className="form-input">
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Fecha límite</label>
                  <input type="date" name="fecha_limite" className="form-input" />
                </div>
                <div>
                  <label className="form-label">Asignado a</label>
                  <select name="asignado_a" className="form-input">
                    <option value="">Sin asignar</option>
                    {perfiles.map(p => <option key={p.id} value={p.id}>{p.nombre_completo}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Departamento</label>
                  <select name="departamento_id" className="form-input">
                    <option value="">Seleccionar</option>
                    {departamentos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Comentarios iniciales</label>
                <textarea name="comentarios" className="form-input" rows={2} placeholder="Notas..." />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={isPending} className="btn-primary">
                  Guardar instrucción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
