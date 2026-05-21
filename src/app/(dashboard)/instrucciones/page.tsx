import { getInstrucciones } from '@/lib/data/instrucciones'
import { getDepartamentos, getPerfiles } from '@/lib/data/instrucciones'
import InstruccionesKanban from '@/components/instrucciones/InstruccionesKanban'

export default async function InstruccionesPage() {
  const [instrucciones, departamentos, perfiles] = await Promise.all([
    getInstrucciones(),
    getDepartamentos(),
    getPerfiles(),
  ])

  return (
    <InstruccionesKanban
      instrucciones={instrucciones}
      departamentos={departamentos}
      perfiles={perfiles}
    />
  )
}
