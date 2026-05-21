import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: instruccion, error: fetchErr } = await supabase
    .from('instrucciones')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchErr || !instruccion) return NextResponse.json({ error: 'Instrucción no encontrada' }, { status: 404 })
  if (instruccion.convertido_a_oficio) return NextResponse.json({ error: 'Ya fue convertida' }, { status: 409 })

  const { data: numero } = await supabase.rpc('generar_numero_oficio')

  const { data: oficio, error: ofErr } = await supabase
    .from('oficios')
    .insert([{
      numero_oficio: numero as string,
      tema: instruccion.instruccion,
      descripcion: instruccion.descripcion,
      estado: 'recibido',
      prioridad: instruccion.prioridad,
      asignado_a: instruccion.asignado_a,
      departamento_id: instruccion.departamento_id,
      fecha_recepcion: new Date().toISOString().split('T')[0],
      fecha_limite: instruccion.fecha_limite,
      creado_por: user.id,
    }])
    .select()
    .single()

  if (ofErr) return NextResponse.json({ error: ofErr.message }, { status: 400 })

  await supabase.from('instrucciones').update({
    convertido_a_oficio: oficio.id,
    estado: 'completada',
  }).eq('id', id)

  return NextResponse.json({ ok: true, numero_oficio: numero, oficio_id: oficio.id }, { status: 201 })
}
