import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { estado, comentario } = await req.json()

  // Obtener oficio actual para validar transición
  const { data: oficio } = await supabase.from('oficios').select('estado').eq('id', id).single()
  if (!oficio) return NextResponse.json({ error: 'Oficio no encontrado' }, { status: 404 })

  const updates: Record<string, unknown> = { estado }
  if (estado === 'terminado') updates.fecha_terminacion = new Date().toISOString().split('T')[0]
  if (estado === 'firmado') updates.fecha_despacho = new Date().toISOString().split('T')[0]
  if (estado === 'respondido') updates.fecha_respuesta = new Date().toISOString().split('T')[0]

  const { error } = await supabase.from('oficios').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Actualizar comentario del movimiento más reciente si se provee
  if (comentario) {
    await supabase
      .from('movimientos_oficio')
      .update({ comentario })
      .eq('oficio_id', id)
      .eq('estado_nuevo', estado)
      .order('fecha', { ascending: false })
      .limit(1)
  }

  return NextResponse.json({ ok: true })
}
