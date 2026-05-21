'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, FileText, FileCheck, FileSpreadsheet, Pencil, Trash2, X } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { PlantillaReporte } from '@/types'

const TIPO_ICONS = {
  pdf: FileText,
  docx: FileCheck,
  excel: FileSpreadsheet,
}

const TIPO_COLORS = {
  pdf:   'text-red-600 bg-red-50 border-red-100',
  docx:  'text-blue-600 bg-blue-50 border-blue-100',
  excel: 'text-green-600 bg-green-50 border-green-100',
}

export default function PlantillasPanel({ plantillas }: { plantillas: PlantillaReporte[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<PlantillaReporte | null>(null)

  const handleGuardar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payload = {
      nombre: fd.get('nombre'),
      descripcion: fd.get('descripcion') || null,
      tipo: fd.get('tipo'),
      activo: true,
    }

    const url = '/api/plantillas'
    const method = editando ? 'PATCH' : 'POST'
    const body = editando ? { id: editando.id, ...payload } : payload

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      toast.success(editando ? 'Plantilla actualizada' : 'Plantilla creada')
      setShowModal(false)
      setEditando(null)
      startTransition(() => router.refresh())
    } else {
      toast.error('Error al guardar la plantilla')
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{plantillas.length} plantillas disponibles</p>
        <button onClick={() => { setEditando(null); setShowModal(true) }} className="btn-primary text-xs">
          <Plus size={13} />
          Nueva plantilla
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plantillas.map(p => {
          const Icon = TIPO_ICONS[p.tipo]
          const colorClass = TIPO_COLORS[p.tipo]
          return (
            <div key={p.id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{p.nombre}</h3>
                    <span className={`badge text-[10px] border ${colorClass}`}>
                      {p.tipo.toUpperCase()}
                    </span>
                  </div>
                  {p.descripcion && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.descripcion}</p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-2">
                    Creada: {formatDate(p.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                <button
                  onClick={() => { setEditando(p); setShowModal(true) }}
                  className="btn-ghost text-xs"
                >
                  <Pencil size={12} />
                  Editar
                </button>
              </div>
            </div>
          )
        })}

        {plantillas.length === 0 && (
          <div className="col-span-2 card p-10 text-center">
            <FileText size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500">No hay plantillas creadas</p>
            <p className="text-xs text-gray-400 mt-1">Crea plantillas para generar reportes rápidamente</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900">
                {editando ? 'Editar plantilla' : 'Nueva plantilla'}
              </h3>
              <button onClick={() => { setShowModal(false); setEditando(null) }} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleGuardar} className="space-y-4">
              <div>
                <label className="form-label">Nombre <span className="text-red-500">*</span></label>
                <input type="text" name="nombre" className="form-input" defaultValue={editando?.nombre} required />
              </div>
              <div>
                <label className="form-label">Descripción</label>
                <textarea name="descripcion" className="form-input" rows={2} defaultValue={editando?.descripcion ?? ''} />
              </div>
              <div>
                <label className="form-label">Tipo de reporte</label>
                <select name="tipo" className="form-input" defaultValue={editando?.tipo || 'pdf'}>
                  <option value="pdf">PDF</option>
                  <option value="docx">Word (.docx)</option>
                  <option value="excel">Excel</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => { setShowModal(false); setEditando(null) }} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending} className="btn-primary">
                  {editando ? 'Actualizar' : 'Crear plantilla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
