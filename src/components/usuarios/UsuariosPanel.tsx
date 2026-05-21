'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Shield, ShieldCheck, ShieldX, User, Building2, Pencil, X, Check } from 'lucide-react'
import { getInitials, cn } from '@/lib/utils'
import type { Perfil, Departamento, Rol } from '@/types'

interface Props {
  perfiles: Perfil[]
  departamentos: Departamento[]
}

const ROL_CONFIG: Record<Rol, { label: string; icon: React.ComponentType<{ size: number }>; color: string }> = {
  administrador: { label: 'Administrador', icon: ShieldCheck, color: 'text-guinda bg-guinda-50 border-guinda-200' },
  usuario:       { label: 'Usuario',       icon: Shield,      color: 'text-blue-700 bg-blue-50 border-blue-200' },
  solo_lectura:  { label: 'Solo lectura',  icon: ShieldX,     color: 'text-gray-600 bg-gray-50 border-gray-200' },
}

export default function UsuariosPanel({ perfiles, departamentos }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editando, setEditando] = useState<Perfil | null>(null)

  const handleGuardar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editando) return
    const fd = new FormData(e.currentTarget)

    const payload = {
      id: editando.id,
      nombre_completo: fd.get('nombre_completo'),
      cargo: fd.get('cargo') || null,
      departamento_id: fd.get('departamento_id') || null,
      rol: fd.get('rol'),
      activo: fd.get('activo') === 'true',
    }

    const res = await fetch('/api/usuarios', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      toast.success('Usuario actualizado')
      setEditando(null)
      startTransition(() => router.refresh())
    } else {
      toast.error('Error al actualizar el usuario')
    }
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">{perfiles.length} usuarios registrados</p>
        </div>
        <div className="badge bg-guinda-50 text-guinda border border-guinda-200">
          <ShieldCheck size={11} />
          Solo administradores
        </div>
      </div>

      {/* Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
        <strong>Nota:</strong> Para crear nuevos usuarios, ve a tu proyecto Supabase → Authentication → Users → Add User.
        Aquí puedes gestionar roles, departamentos y permisos de los usuarios existentes.
      </div>

      {/* Tabla de usuarios */}
      <div className="card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Cargo</th>
              <th>Departamento</th>
              <th>Rol</th>
              <th>Estado</th>
              <th className="w-16"></th>
            </tr>
          </thead>
          <tbody>
            {perfiles.map(p => {
              const rolCfg = ROL_CONFIG[p.rol]
              const RolIcon = rolCfg.icon
              return (
                <tr key={p.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-guinda-100 flex items-center justify-center text-xs font-bold text-guinda flex-shrink-0">
                        {getInitials(p.nombre_completo)}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-900">{p.nombre_completo}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="text-xs text-gray-600">{p.cargo || '—'}</p>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Building2 size={11} className="text-gray-400" />
                      {(p as Perfil & { departamento?: { nombre: string } }).departamento?.nombre || '—'}
                    </div>
                  </td>
                  <td>
                    <span className={`badge text-[10px] border ${rolCfg.color}`}>
                      <RolIcon size={10} />
                      {rolCfg.label}
                    </span>
                  </td>
                  <td>
                    <span className={cn(
                      'badge text-[10px]',
                      p.activo ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'
                    )}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => setEditando(p)}
                      className="btn-ghost text-xs px-2 py-1"
                    >
                      <Pencil size={11} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal editar */}
      {editando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-guinda-50 flex items-center justify-center text-xs font-bold text-guinda">
                  {getInitials(editando.nombre_completo)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{editando.nombre_completo}</h3>
                  <p className="text-[10px] text-gray-400">Editar información del usuario</p>
                </div>
              </div>
              <button onClick={() => setEditando(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleGuardar} className="space-y-4">
              <div>
                <label className="form-label">Nombre completo</label>
                <input type="text" name="nombre_completo" className="form-input" defaultValue={editando.nombre_completo} required />
              </div>
              <div>
                <label className="form-label">Cargo / Puesto</label>
                <input type="text" name="cargo" className="form-input" defaultValue={editando.cargo ?? ''} placeholder="Ej: Secretario Municipal" />
              </div>
              <div>
                <label className="form-label">Departamento</label>
                <select name="departamento_id" className="form-input" defaultValue={editando.departamento_id ?? ''}>
                  <option value="">Sin departamento</option>
                  {departamentos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Rol de acceso</label>
                <select name="rol" className="form-input" defaultValue={editando.rol}>
                  <option value="administrador">Administrador — acceso total</option>
                  <option value="usuario">Usuario — crear y editar</option>
                  <option value="solo_lectura">Solo lectura — consultar</option>
                </select>
              </div>
              <div>
                <label className="form-label">Estado de la cuenta</label>
                <select name="activo" className="form-input" defaultValue={String(editando.activo)}>
                  <option value="true">Activo</option>
                  <option value="false">Inactivo (sin acceso)</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setEditando(null)} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={isPending} className="btn-primary">
                  <Check size={13} />
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
