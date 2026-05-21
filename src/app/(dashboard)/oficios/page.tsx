import { getOficios } from '@/lib/data/oficios'
import { getDepartamentos, getPerfiles } from '@/lib/data/instrucciones'
import OficiosList from '@/components/oficios/OficiosList'
import type { EstadoOficio } from '@/types'

interface SearchParams {
  estado?: string
  prioridad?: string
  departamento_id?: string
  busqueda?: string
  pagina?: string
}

export default async function OficiosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const pagina = parseInt(params.pagina || '1', 10)

  const [{ data: oficios, total }, departamentos, perfiles] = await Promise.all([
    getOficios({
      estado: params.estado as EstadoOficio | undefined,
      prioridad: params.prioridad,
      departamento_id: params.departamento_id,
      busqueda: params.busqueda,
      pagina,
      porPagina: 20,
    }),
    getDepartamentos(),
    getPerfiles(),
  ])

  return (
    <OficiosList
      oficios={oficios}
      total={total}
      pagina={pagina}
      departamentos={departamentos}
      perfiles={perfiles}
      filtrosActivos={{
        estado: params.estado,
        prioridad: params.prioridad,
        departamento_id: params.departamento_id,
        busqueda: params.busqueda,
      }}
    />
  )
}
