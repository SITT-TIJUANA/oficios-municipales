import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const estado = searchParams.get('estado')

  let query = supabase
    .from('instrucciones')
    .select('*, asignado:asignado_a(id,nombre_completo,cargo), departamento:departamento_id(id,nombre)')
    .order('created_at', { ascending: false })

  if (estado) query = query.eq('estado', estado)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()

  const { data: folio } = await supabase.rpc('generar_folio_instruccion')

  const payload = {
    folio: folio as string,
    instruccion: body.instruccion,
    descripcion: body.descripcion || null,
    estado: 'pendiente',
    prioridad: body.prioridad || 'media',
    asignado_a: body.asignado_a || null,
    departamento_id: body.departamento_id || null,
    fecha_limite: body.fecha_limite || null,
    comentarios: body.comentarios || null,
    creado_por: user.id,
  }

  const { data, error } = await supabase.from('instrucciones').insert([payload]).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
