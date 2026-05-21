import { getOficios } from '@/lib/data/oficios'
import { getDepartamentos } from '@/lib/data/instrucciones'
import { getEstadisticas } from '@/lib/data/oficios'
import ReportesPanel from '@/components/reportes/ReportesPanel'

export default async function ReportesPage() {
  const [{ data: oficios }, departamentos, stats] = await Promise.all([
    getOficios({ porPagina: 1000 }), // todos para reporte
    getDepartamentos(),
    getEstadisticas(),
  ])

  return <ReportesPanel oficios={oficios} departamentos={departamentos} stats={stats} />
}
