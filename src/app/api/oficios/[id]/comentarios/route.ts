import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { comentario, es_interno = true } = await req.json()
  if (!comentario?.trim()) return NextResponse.json({ error: 'Comentario vacío' }, { status: 400 })

  const { error } = await supabase.from('comentarios_oficio').insert([{
    oficio_id: id,
    comentario,
    es_interno,
    autor_id: user.id,
  }])

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true }, { status: 201 })
}
