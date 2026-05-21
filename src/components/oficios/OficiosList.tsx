'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, Filter, Download, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatDate, estadoConfig, prioridadConfig, truncate, cn } from '@/lib/utils'
import { generarExcel } from '@/lib/reportes'
import type { Oficio, Departamento, Perfil, EstadoOficio } from '@/types'
import { toast } from 'sonner'

const ESTADO_FILTROS: { label: string; value: string }[] = [
  { label: 'Todos', value: '' },
  { label: 'Recibidos', value: 'recibido' },
  { label: 'En proceso', value: 'en_proceso' },
  { label: 'Firmados', value: 'firmado' },
  { label: 'Req. respuesta', value: 'requiere_respuesta' },
  { label: 'Sin respuesta', value: 'sin_respuesta' },
  { label: 'Respondidos', value: 'respondido' },
  { label: 'Terminados', value: 'terminado' },
  { label: 'Archivados', value: 'archivado' },
]

interface Props {
  oficios: Oficio[]
  total: number
  pagina: number
  departamentos: Departamento[]
  perfiles: Perfil[]
  filtrosActivos: { estado?: string; prioridad?: string; departamento_id?: string; busqueda?: string }
}

export default function OficiosList({ oficios, total, pagina, departamentos, perfiles, filtrosActivos }: Props) {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState(filtrosActivos.busqueda || '')
  const [isPending, startTransition] = useTransition()

  const totalPaginas = Math.ceil(total / 20)

  const updateFiltro = (key: string, value: string) => {
    const params = new URLSearchParams()
    if (key !== 'estado' && filtrosActivos.estado) params.set('estado', filtrosActivos.estado)
    if (key !== 'prioridad' && filtrosActivos.prioridad) params.set('prioridad', filtrosActivos.prioridad)
    if (key !== 'departamento_id' && filtrosActivos.departamento_id) params.set('departamento_id', filtrosActivos.departamento_id)
    if (key !== 'busqueda' && filtrosActivos.busqueda) params.set('busqueda', filtrosActivos.busqueda)
    if (value) params.set(key, value)
    startTransition(() => router.push(`/oficios?${params.toString()}`))
  }

  const handleBusqueda = (e: React.FormEvent) => {
    e.preventDefault()
    updateFiltro('busqueda', busqueda)
  }

  const handleExportExcel = () => {
    if (oficios.length === 0) { toast.error('No hay oficios para exportar'); return }
    generarExcel({ oficios, titulo: 'Reporte de Oficios' })
    toast.success('Excel generado correctamente')
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">{total} oficios encontrados</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportExcel} className="btn-secondary text-xs">
            <Download size={13} />
            Exportar Excel
          </button>
          <Link href="/oficios/nuevo" className="btn-primary text-xs">
            <Plus size={13} />
            Nuevo oficio
          </Link>
        </div>
      </div>

      {/* Filtros de estado (chips) */}
      <div className="flex gap-2 flex-wrap">
        {ESTADO_FILTROS.map(f => (
          <button
            key={f.value}
            onClick={() => updateFiltro('estado', f.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
              filtrosActivos.estado === f.value || (!filtrosActivos.estado && f.value === '')
                ? 'bg-guinda text-white border-guinda shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-guinda-300'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Filtros avanzados + búsqueda */}
      <div className="card p-3 flex gap-3 flex-wrap items-end">
        {/* Búsqueda */}
        <form onSubmit={handleBusqueda} className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 flex-1 min-w-[200px]">
          <Search size={13} className="text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por número, tema, remitente..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="bg-transparent text-xs outline-none flex-1 text-gray-700 placeholder-gray-400"
          />
        </form>

        {/* Prioridad */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-gray-500 font-medium">Prioridad</label>
          <select
            value={filtrosActivos.prioridad || ''}
            onChange={e => updateFiltro('prioridad', e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 outline-none cursor-pointer"
          >
            <option value="">Todas</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </div>

        {/* Departamento */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-gray-500 font-medium">Departamento</label>
          <select
            value={filtrosActivos.departamento_id || ''}
            onChange={e => updateFiltro('departamento_id', e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 outline-none cursor-pointer max-w-[180px]"
          >
            <option value="">Todos</option>
            {departamentos.map(d => (
              <option key={d.id} value={d.id}>{d.nombre}</option>
            ))}
          </select>
        </div>

        {/* Limpiar */}
        {(filtrosActivos.estado || filtrosActivos.prioridad || filtrosActivos.departamento_id || filtrosActivos.busqueda) && (
          <button
            onClick={() => { setBusqueda(''); startTransition(() => router.push('/oficios')) }}
            className="text-xs text-guinda hover:text-guinda-700 font-medium"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-32">Núm. oficio</th>
                <th>Tema / Asunto</th>
                <th>Asignado a</th>
                <th>Departamento</th>
                <th className="w-24">F. Recepción</th>
                <th className="w-20">Prioridad</th>
                <th className="w-32">Estado</th>
                <th className="w-14 text-center">Días</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {isPending ? (
                <tr>
                  <td colSpan={9} className="text-center py-12">
                    <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                      <div className="w-4 h-4 border-2 border-guinda/30 border-t-guinda rounded-full animate-spin" />
                      Cargando...
                    </div>
                  </td>
                </tr>
              ) : oficios.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Filter size={28} className="opacity-50" />
                      <p className="text-sm">No se encontraron oficios</p>
                      <p className="text-xs">Intenta ajustar los filtros</p>
                    </div>
                  </td>
                </tr>
              ) : (
                oficios.map(oficio => {
                  const estadoCfg = estadoConfig[oficio.estado]
                  const priorCfg = prioridadConfig[oficio.prioridad]
                  const dias = Math.round(oficio.dias_transcurridos ?? 0)

                  return (
                    <tr key={oficio.id}>
                      <td>
                        <Link href={`/oficios/${oficio.id}`} className="font-mono text-xs font-bold text-guinda hover:underline">
                          {oficio.numero_oficio}
                        </Link>
                      </td>
                      <td>
                        <div>
                          <Link href={`/oficios/${oficio.id}`} className="text-xs text-gray-900 hover:text-guinda font-medium line-clamp-1">
                            {oficio.tema}
                          </Link>
                          {oficio.remitente_nombre && (
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              De: {truncate(oficio.remitente_nombre, 35)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td>
                        <p className="text-xs text-gray-700 truncate max-w-[140px]">
                          {oficio.asignado_nombre || <span className="text-gray-300">Sin asignar</span>}
                        </p>
                      </td>
                      <td>
                        <p className="text-xs text-gray-600 truncate max-w-[130px]">
                          {oficio.departamento_nombre || '—'}
                        </p>
                      </td>
                      <td className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(oficio.fecha_recepcion)}
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priorCfg.dotClass}`} />
                          <span className="text-xs">{priorCfg.label}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge text-[10px] ${estadoCfg.badgeClass}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${estadoCfg.dotClass}`} />
                          {estadoCfg.label}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={cn(
                          'text-xs font-semibold',
                          dias > 15 ? 'text-red-600' : dias > 7 ? 'text-amber-600' : 'text-gray-600'
                        )}>
                          {dias}
                        </span>
                      </td>
                      <td>
                        <Link href={`/oficios/${oficio.id}`} className="btn-ghost text-xs px-2 py-1">
                          Ver
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Página {pagina} de {totalPaginas} · {total} registros
            </p>
            <div className="flex items-center gap-1">
              <Link
                href={`/oficios?${new URLSearchParams({ ...filtrosActivos, pagina: String(pagina - 1) }).toString()}`}
                className={cn('p-1.5 rounded-lg', pagina <= 1 ? 'opacity-30 pointer-events-none' : 'hover:bg-gray-100')}
              >
                <ChevronLeft size={14} />
              </Link>
              {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                const p = Math.max(1, pagina - 2) + i
                if (p > totalPaginas) return null
                return (
                  <Link key={p} href={`/oficios?${new URLSearchParams({ ...filtrosActivos, pagina: String(p) }).toString()}`}
                    className={cn('w-7 h-7 rounded-lg text-xs font-medium flex items-center justify-center',
                      p === pagina ? 'bg-guinda text-white' : 'hover:bg-gray-100 text-gray-600'
                    )}>
                    {p}
                  </Link>
                )
              })}
              <Link
                href={`/oficios?${new URLSearchParams({ ...filtrosActivos, pagina: String(pagina + 1) }).toString()}`}
                className={cn('p-1.5 rounded-lg', pagina >= totalPaginas ? 'opacity-30 pointer-events-none' : 'hover:bg-gray-100')}
              >
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
