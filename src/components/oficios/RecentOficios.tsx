import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { formatDate, estadoConfig, prioridadConfig, formatRelative } from '@/lib/utils'
import type { Oficio, EstadisticasDashboard } from '@/types'

// ================================================================
// STATUS DISTRIBUTION
// ================================================================
export function StatusDistribution({ stats }: { stats: EstadisticasDashboard | null }) {
  const total = stats?.total || 1
  const items = [
    { label: 'Pendientes', value: stats?.pendientes ?? 0, color: 'bg-amber-400' },
    { label: 'Concluidos', value: stats?.concluidos ?? 0, color: 'bg-green-500' },
    { label: 'Archivados', value: stats?.archivados ?? 0, color: 'bg-blue-400' },
    { label: 'Sin respuesta', value: stats?.sin_respuesta ?? 0, color: 'bg-red-400' },
  ]

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Distribución por estado</h3>
      </div>
      <div className="p-5 space-y-4">
        {/* Stacked bar */}
        <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
          {items.map(item => (
            <div
              key={item.label}
              className={`${item.color} transition-all`}
              style={{ width: `${(item.value / total * 100).toFixed(1)}%` }}
              title={`${item.label}: ${item.value}`}
            />
          ))}
        </div>

        {/* Legend */}
        {items.map(item => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
              <span className="text-xs text-gray-600">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-900">{item.value}</span>
              <span className="text-[10px] text-gray-400">
                {((item.value / total) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}

        <div className="pt-3 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Tiempo prom. resolución</span>
            <span className="text-sm font-bold text-guinda">
              {stats?.promedio_dias_resolucion?.toFixed(1) ?? '—'} días
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ================================================================
// RECENT OFICIOS TABLE
// ================================================================
export default function RecentOficios({ oficios }: { oficios: Oficio[] }) {
  return (
    <div className="card overflow-hidden">
      <div className="card-header">
        <h3 className="card-title">Oficios recientes</h3>
        <Link href="/oficios" className="flex items-center gap-1 text-xs text-guinda hover:text-guinda-700 font-medium">
          Ver todos <ArrowRight size={12} />
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Núm. oficio</th>
              <th>Tema</th>
              <th>Asignado</th>
              <th>Prioridad</th>
              <th>Estado</th>
              <th>Recibido</th>
            </tr>
          </thead>
          <tbody>
            {oficios.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400 text-sm">
                  No hay oficios registrados
                </td>
              </tr>
            ) : oficios.map(oficio => {
              const estadoCfg = estadoConfig[oficio.estado]
              const priorCfg = prioridadConfig[oficio.prioridad]
              return (
                <tr key={oficio.id}>
                  <td>
                    <Link href={`/oficios/${oficio.id}`} className="font-mono text-xs font-semibold text-guinda hover:underline">
                      {oficio.numero_oficio}
                    </Link>
                  </td>
                  <td className="max-w-[200px]">
                    <p className="text-xs text-gray-800 truncate">{oficio.tema}</p>
                    {oficio.departamento_nombre && (
                      <p className="text-[10px] text-gray-400 truncate">{oficio.departamento_nombre}</p>
                    )}
                  </td>
                  <td>
                    <p className="text-xs text-gray-700 truncate max-w-[120px]">
                      {oficio.asignado_nombre || '—'}
                    </p>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${priorCfg.dotClass}`} />
                      <span className="text-xs">{priorCfg.label}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge text-[10px] ${estadoCfg.badgeClass}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${estadoCfg.dotClass}`} />
                      {estadoCfg.label}
                    </span>
                  </td>
                  <td className="text-xs text-gray-500 whitespace-nowrap">
                    {formatDate(oficio.fecha_recepcion)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ================================================================
// ACTIVITY FEED (server component, real data from movimientos)
// ================================================================
export async function ActivityFeed() {
  // Import inside to avoid circular
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { data: movimientos } = await supabase
    .from('movimientos_oficio')
    .select('*, perfil:realizado_por(nombre_completo), oficio:oficio_id(numero_oficio,tema)')
    .order('fecha', { ascending: false })
    .limit(8)

  const estadoLabels: Record<string, string> = {
    recibido: 'recibido',
    en_proceso: 'en elaboración',
    firmado: 'firmado',
    requiere_respuesta: 'marcado req. respuesta',
    sin_respuesta: 'sin respuesta',
    reiterado: 'reiterado',
    respondido: 'respondido',
    terminado: 'terminado',
    archivado: 'archivado',
  }

  const colorMap: Record<string, string> = {
    recibido: 'bg-blue-100 text-blue-600',
    en_proceso: 'bg-purple-100 text-purple-600',
    firmado: 'bg-indigo-100 text-indigo-600',
    respondido: 'bg-teal-100 text-teal-600',
    terminado: 'bg-green-100 text-green-600',
    archivado: 'bg-gray-100 text-gray-500',
    sin_respuesta: 'bg-red-100 text-red-500',
    reiterado: 'bg-orange-100 text-orange-600',
    requiere_respuesta: 'bg-amber-100 text-amber-600',
  }

  return (
    <div className="card overflow-hidden">
      <div className="card-header">
        <h3 className="card-title">Actividad reciente</h3>
        <span className="text-xs text-gray-400">Últimos movimientos</span>
      </div>
      <div className="p-4 space-y-0">
        {!movimientos || movimientos.length === 0 ? (
          <p className="text-center py-6 text-gray-400 text-sm">Sin actividad reciente</p>
        ) : movimientos.map((mov: {
          id: string
          estado_nuevo: string
          fecha: string
          perfil?: { nombre_completo: string }
          oficio?: { numero_oficio: string; tema: string }
        }, i: number) => (
          <div key={mov.id} className={`flex gap-3 py-3 ${i < movimientos.length - 1 ? 'border-b border-gray-50' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${colorMap[mov.estado_nuevo] || 'bg-gray-100 text-gray-500'}`}>
              {mov.estado_nuevo[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-800 leading-tight">
                <Link href="#" className="font-semibold text-guinda hover:underline">
                  {mov.oficio?.numero_oficio}
                </Link>
                {' '}{estadoLabels[mov.estado_nuevo] || mov.estado_nuevo}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {mov.perfil?.nombre_completo || 'Sistema'} · {formatRelative(mov.fecha)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
