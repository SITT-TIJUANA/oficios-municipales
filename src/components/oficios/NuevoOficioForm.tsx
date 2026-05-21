'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Upload, X, FileText, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { Departamento, Perfil } from '@/types'

interface Props {
  departamentos: Departamento[]
  perfiles: Perfil[]
}

export default function NuevoOficioForm({ departamentos, perfiles }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [archivosSeleccionados, setArchivosSeleccionados] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    setArchivosSeleccionados(prev => [...prev, ...files])
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const payload = {
      numero_oficio: formData.get('numero_oficio') as string,
      tema: formData.get('tema') as string,
      descripcion: formData.get('descripcion') as string,
      prioridad: formData.get('prioridad') as string,
      tipo_documento: formData.get('tipo_documento') as string,
      requiere_respuesta: formData.get('requiere_respuesta') === 'si',
      asignado_a: formData.get('asignado_a') as string,
      departamento_id: formData.get('departamento_id') as string,
      fecha_recepcion: formData.get('fecha_recepcion') as string,
      fecha_limite: formData.get('fecha_limite') as string,
      remitente_nombre: formData.get('remitente_nombre') as string,
      remitente_cargo: formData.get('remitente_cargo') as string,
      remitente_institucion: formData.get('remitente_institucion') as string,
      destinatario_nombre: formData.get('destinatario_nombre') as string,
      observaciones: formData.get('observaciones') as string,
    }

    const res = await fetch('/api/oficios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.json()
      toast.error('Error al guardar', { description: err.error })
      return
    }

    const { id, numero_oficio } = await res.json()

    // Subir archivos si hay
    for (const archivo of archivosSeleccionados) {
      const fd = new FormData()
      fd.append('archivo', archivo)
      fd.append('oficio_id', id)
      await fetch('/api/oficios/archivos', { method: 'POST', body: fd })
    }

    toast.success(`Oficio ${numero_oficio} registrado correctamente`)
    startTransition(() => router.push(`/oficios/${id}`))
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/oficios" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Registrar nuevo oficio</h1>
          <p className="text-xs text-gray-500">El número de oficio se asigna automáticamente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* DATOS PRINCIPALES */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText size={15} className="text-guinda" />
            Datos principales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Número de oficio</label>
              <input
                type="text"
                name="numero_oficio"
                className="form-input"
                placeholder="Se genera automáticamente"
              />
              <p className="text-[10px] text-gray-400 mt-1">Deja vacío para asignar automáticamente</p>
            </div>

            <div>
              <label className="form-label">Tipo de documento <span className="text-red-500">*</span></label>
              <select name="tipo_documento" className="form-input" required>
                <option value="oficio">Oficio</option>
                <option value="memorandum">Memorándum</option>
                <option value="circular">Circular</option>
                <option value="acuerdo">Acuerdo</option>
                <option value="peticion">Petición ciudadana</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="form-label">Tema / Asunto <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="tema"
                className="form-input"
                placeholder="Tema principal del oficio"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="form-label">Descripción detallada</label>
              <textarea
                name="descripcion"
                className="form-input min-h-[90px]"
                placeholder="Descripción del contenido o instrucciones del oficio..."
              />
            </div>

            <div>
              <label className="form-label">Prioridad <span className="text-red-500">*</span></label>
              <select name="prioridad" className="form-input" required>
                <option value="media">Media</option>
                <option value="alta">Alta (urgente)</option>
                <option value="baja">Baja</option>
              </select>
            </div>

            <div>
              <label className="form-label">¿Requiere respuesta?</label>
              <select name="requiere_respuesta" className="form-input">
                <option value="no">No</option>
                <option value="si">Sí</option>
              </select>
            </div>
          </div>
        </div>

        {/* ASIGNACIÓN */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Asignación y fechas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Asignado a</label>
              <select name="asignado_a" className="form-input">
                <option value="">Sin asignar</option>
                {perfiles.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre_completo}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Departamento</label>
              <select name="departamento_id" className="form-input">
                <option value="">Seleccionar departamento</option>
                {departamentos.map(d => (
                  <option key={d.id} value={d.id}>{d.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Fecha de recepción <span className="text-red-500">*</span></label>
              <input type="date" name="fecha_recepcion" className="form-input" defaultValue={today} required />
            </div>

            <div>
              <label className="form-label">Fecha límite de atención</label>
              <input type="date" name="fecha_limite" className="form-input" />
            </div>
          </div>
        </div>

        {/* REMITENTE */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Remitente / Destinatario</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Nombre del remitente</label>
              <input type="text" name="remitente_nombre" className="form-input" placeholder="Nombre completo" />
            </div>
            <div>
              <label className="form-label">Cargo del remitente</label>
              <input type="text" name="remitente_cargo" className="form-input" placeholder="Cargo o puesto" />
            </div>
            <div>
              <label className="form-label">Institución / Dependencia</label>
              <input type="text" name="remitente_institucion" className="form-input" placeholder="Nombre de la institución" />
            </div>
            <div>
              <label className="form-label">Destinatario</label>
              <input type="text" name="destinatario_nombre" className="form-input" placeholder="A quien va dirigido" />
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Observaciones</label>
              <textarea name="observaciones" className="form-input" rows={3} placeholder="Notas adicionales, instrucciones especiales..." />
            </div>
          </div>
        </div>

        {/* ARCHIVOS */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Archivos adjuntos</h3>
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
              isDragging ? 'border-guinda bg-guinda-50' : 'border-gray-200 hover:border-guinda-300'
            }`}
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <Upload size={24} className="mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">Arrastra archivos aquí o</p>
            <label className="cursor-pointer text-sm text-guinda font-medium hover:text-guinda-700">
              &nbsp;selecciona archivos
              <input
                type="file"
                multiple
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx"
                onChange={e => setArchivosSeleccionados(prev => [...prev, ...Array.from(e.target.files || [])])}
              />
            </label>
            <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel, imágenes hasta 10MB</p>
          </div>

          {archivosSeleccionados.length > 0 && (
            <div className="mt-3 space-y-2">
              {archivosSeleccionados.map((file, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <FileText size={14} className="text-guinda flex-shrink-0" />
                  <p className="text-xs text-gray-700 flex-1 truncate">{file.name}</p>
                  <p className="text-[10px] text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
                  <button
                    type="button"
                    onClick={() => setArchivosSeleccionados(prev => prev.filter((_, j) => j !== i))}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ACCIONES */}
        <div className="flex items-center gap-3 justify-end">
          <Link href="/oficios" className="btn-secondary">Cancelar</Link>
          <button type="submit" disabled={isPending} className="btn-primary">
            {isPending ? (
              <><Loader2 size={14} className="animate-spin" /> Guardando...</>
            ) : (
              'Registrar oficio'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
