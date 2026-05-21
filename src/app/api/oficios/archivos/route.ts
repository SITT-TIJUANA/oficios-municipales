import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const formData = await req.formData()
  const archivo = formData.get('archivo') as File
  const oficio_id = formData.get('oficio_id') as string
  const tipo_archivo = (formData.get('tipo_archivo') as string) || 'documento'

  if (!archivo || !oficio_id) {
    return NextResponse.json({ error: 'Falta archivo o oficio_id' }, { status: 400 })
  }

  const nombreStorage = `${oficio_id}/${Date.now()}_${archivo.name}`
  const buffer = await archivo.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from('oficios-archivos')
    .upload(nombreStorage, buffer, { contentType: archivo.type })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 })

  const { data: urlData } = supabase.storage
    .from('oficios-archivos')
    .getPublicUrl(nombreStorage)

  const { data, error } = await supabase
    .from('archivos_oficio')
    .insert([{
      oficio_id,
      nombre: archivo.name,
      nombre_storage: nombreStorage,
      tipo_mime: archivo.type,
      tamano_bytes: archivo.size,
      tipo_archivo,
      url_publica: urlData.publicUrl,
      subido_por: user.id,
    }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
