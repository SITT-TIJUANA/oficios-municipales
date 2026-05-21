import { getDepartamentos, getPerfiles } from '@/lib/data/instrucciones'
import NuevoOficioForm from '@/components/oficios/NuevoOficioForm'

export default async function NuevoOficioPage() {
  const [departamentos, perfiles] = await Promise.all([
    getDepartamentos(),
    getPerfiles(),
  ])

  return <NuevoOficioForm departamentos={departamentos} perfiles={perfiles} />
}
