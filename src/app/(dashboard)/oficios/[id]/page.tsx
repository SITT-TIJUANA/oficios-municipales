import { notFound } from 'next/navigation'
import { getOficio, getMovimientos, getArchivos, getComentarios } from '@/lib/data/oficios'
import OficioDetalle from '@/components/oficios/OficioDetalle'

export default async function OficioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [{ data: oficio }, movimientos, archivos, comentarios] = await Promise.all([
    getOficio(id),
    getMovimientos(id),
    getArchivos(id),
    getComentarios(id),
  ])

  if (!oficio) notFound()

  return (
    <OficioDetalle
      oficio={oficio}
      movimientos={movimientos}
      archivos={archivos}
      comentarios={comentarios}
    />
  )
}
