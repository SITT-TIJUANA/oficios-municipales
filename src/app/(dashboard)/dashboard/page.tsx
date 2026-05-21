import { Suspense } from 'react'
import { getEstadisticas, getOficios, getOfiiciosPorMes } from '@/lib/data/oficios'
import DashboardStats from '@/components/oficios/DashboardStats'
import RecentOficios from '@/components/oficios/RecentOficios'
import ActivityFeed from '@/components/oficios/ActivityFeed'
import OfficiosChart from '@/components/oficios/OfficiosChart'
import StatusDistribution from '@/components/oficios/StatusDistribution'

export default async function DashboardPage() {
  const [stats, { data: oficiosRecientes }, chartData] = await Promise.all([
    getEstadisticas(),
    getOficios({ porPagina: 6 }),
    getOfiiciosPorMes(),
  ])

  return (
    <div className="space-y-6">
      {/* Stats */}
      <DashboardStats stats={stats} />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OfficiosChart data={chartData} />
        </div>
        <StatusDistribution stats={stats} />
      </div>

      {/* Table + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentOficios oficios={oficiosRecientes} />
        </div>
        <ActivityFeed />
      </div>
    </div>
  )
}
