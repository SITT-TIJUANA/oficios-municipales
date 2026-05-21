import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)

  const estado = searchParams.get('estado')
  const prioridad = searchParams.get('prioridad')
  const busqueda = searchParams.get('busqueda')
  const pagina = parseInt(searchParams.get('pagina') || '1')
  const porPagina = parseInt(searchParams.get('por_pagina') || '20')

  let query = supabase
    .from('oficios_con_detalle')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((pagina - 1) * porPagina, pagina * porPagina - 1)

  if (estado) query = query.eq('estado', estado)
  if (prioridad) query = query.eq('prioridad', prioridad)
  if (busqueda) {
    query = query.or(`tema.ilike.%${busqueda}%,numero_oficio.ilike.%${busqueda}%`)
  }

  const { data, count, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, total: count })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()

  // Generar número si no hay
  if (!body.numero_oficio?.trim()) {
    const { data: numero } = await supabase.rpc('generar_numero_oficio')
    body.numero_oficio = numero
  }

  // Limpiar vacíos
  const campos = ['descripcion', 'fecha_despacho', 'fecha_respuesta', 'fecha_terminacion',
    'fecha_limite', 'asignado_a', 'departamento_id', 'remitente_nombre', 'remitente_cargo',
    'remitente_institucion', 'destinatario_nombre', 'observaciones', 'oficio_relacionado']
  for (const campo of campos) {
    if (body[campo] === '' || body[campo] === 'null') body[campo] = null
  }

  body.creado_por = user.id

  const { data, error } = await supabase
    .from('oficios')
    .insert([body])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ id: data.id, numero_oficio: data.numero_oficio }, { status: 201 })
}
