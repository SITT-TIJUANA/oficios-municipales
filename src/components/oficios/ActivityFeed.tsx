import { createClient } from '@/lib/supabase/server'
import { formatRelative, estadoConfig } from '@/lib/utils'
import type { EstadoOficio } from '@/types'

export default async function ActivityFeed() {
  const supabase = await createClient()

  const { data: movimientos } = await supabase
    .from('movimientos_oficio')
    .select('*, perfil:realizado_por(nombre_completo), oficio:oficio_id(numero_oficio,tema)')
    .order('fecha', { ascending: false })
    .limit(10)

  return (
    <div className="card overflow-hidden">
      <div className="card-header">
        <h3 className="card-title">Actividad reciente</h3>
        <span className="text-xs text-gray-400">En tiempo real</span>
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
        }, i: number) => {
          const cfg = estadoConfig[mov.estado_nuevo as EstadoOficio]
          return (
            <div key={mov.id} className={`flex gap-3 py-3 ${i < movimientos.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${cfg?.badgeClass || 'bg-gray-50 text-gray-500'}`}>
                {mov.estado_nuevo[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-800 leading-tight">
                  <span className="font-semibold text-guinda">{mov.oficio?.numero_oficio}</span>
                  {' '}→{' '}
                  <span className="font-medium">{cfg?.label || mov.estado_nuevo}</span>
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                  {mov.perfil?.nombre_completo || 'Sistema'} · {formatRelative(mov.fecha)}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
