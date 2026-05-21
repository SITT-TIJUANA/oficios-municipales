import type { EstadisticasDashboard } from '@/types'

export default function StatusDistribution({ stats }: { stats: EstadisticasDashboard | null }) {
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
        <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
          {items.map(item => (
            <div key={item.label} className={`${item.color} transition-all`}
              style={{ width: `${(item.value / total * 100).toFixed(1)}%` }} />
          ))}
        </div>
        {items.map(item => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
              <span className="text-xs text-gray-600">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-900">{item.value}</span>
              <span className="text-[10px] text-gray-400">{((item.value / total) * 100).toFixed(0)}%</span>
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