import { createClient } from '@/lib/supabase/server'
import type { Instruccion, InstruccionFormData, Perfil, Departamento } from '@/types'

// ================================================================
// INSTRUCCIONES
// ================================================================

export async function getInstrucciones(filtros?: {
  estado?: string
  asignado_a?: string
  busqueda?: string
}): Promise<Instruccion[]> {
  const supabase = await createClient()

  let query = supabase
    .from('instrucciones')
    .select('*, asignado:asignado_a(id,nombre_completo,cargo,avatar_url), departamento:departamento_id(id,nombre)')
    .order('created_at', { ascending: false })

  if (filtros?.estado) query = query.eq('estado', filtros.estado)
  if (filtros?.asignado_a) query = query.eq('asignado_a', filtros.asignado_a)
  if (filtros?.busqueda) {
    query = query.ilike('instruccion', `%${filtros.busqueda}%`)
  }

  const { data } = await query
  return (data ?? []) as Instruccion[]
}

export async function crearInstruccion(
  formData: Partial<InstruccionFormData>
): Promise<{ data: Instruccion | null; error: string | null }> {
  const supabase = await createClient()

  // Generar folio
  const { data: folioData } = await supabase.rpc('generar_folio_instruccion')

  const { data, error } = await supabase
    .from('instrucciones')
    .insert([{
      folio: folioData as string,
      instruccion: formData.instruccion,
      descripcion: formData.descripcion || null,
      estado: formData.estado || 'pendiente',
      prioridad: formData.prioridad || 'media',
      asignado_a: formData.asignado_a || null,
      departamento_id: formData.departamento_id || null,
      fecha_limite: formData.fecha_limite || null,
      comentarios: formData.comentarios || null,
    }])
    .select()
    .maybeSingle()

  return { data: data as Instruccion | null, error: error?.message ?? null }
}

export async function actualizarInstruccion(
  id: string,
  updates: Partial<InstruccionFormData>
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { error } = await supabase.from('instrucciones').update(updates).eq('id', id)
  return { error: error?.message ?? null }
}

export async function convertirInstruccionEnOficio(
  instruccionId: string
): Promise<{ numero_oficio: string | null; error: string | null }> {
  const supabase = await createClient()

  // Obtener instrucción
  const { data: instruccion } = await supabase
    .from('instrucciones')
    .select('*')
    .eq('id', instruccionId)
    .maybeSingle()

  if (!instruccion) return { numero_oficio: null, error: 'Instrucción no encontrada' }

  // Generar número de oficio
  const { data: numero } = await supabase.rpc('generar_numero_oficio')

  // Crear oficio basado en la instrucción
  const { data: oficio, error: ofError } = await supabase
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
    }])
    .select()
    .maybeSingle()

  if (ofError) return { numero_oficio: null, error: ofError.message }

  // Marcar instrucción como convertida
  await supabase.from('instrucciones').update({
    convertido_a_oficio: oficio.id,
    estado: 'completada',
  }).eq('id', instruccionId)

  return { numero_oficio: numero as string, error: null }
}

// ================================================================
// USUARIOS / PERFILES
// ================================================================

export async function getPerfiles(): Promise<Perfil[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('perfiles')
    .select('*, departamento:departamento_id(id,nombre)')
    .eq('activo', true)
    .order('nombre_completo')
  return (data ?? []) as Perfil[]
}

export async function getPerfil(id: string): Promise<Perfil | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('perfiles')
    .select('*, departamento:departamento_id(id,nombre)')
    .eq('id', id)
    .maybeSingle()
  return data as Perfil | null
}

export async function actualizarPerfil(
  id: string,
  updates: Partial<Perfil>
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { error } = await supabase.from('perfiles').update(updates).eq('id', id)
  return { error: error?.message ?? null }
}

// ================================================================
// DEPARTAMENTOS
// ================================================================

export async function getDepartamentos(): Promise<Departamento[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('departamentos')
    .select('*')
    .eq('activo', true)
    .order('nombre')
  return (data ?? []) as Departamento[]
}

// ================================================================
// NOTIFICACIONES
// ================================================================

export async function getNotificaciones(usuarioId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('notificaciones')
    .select('*')
    .eq('usuario_id', usuarioId)
    .eq('leida', false)
    .order('created_at', { ascending: false })
    .limit(20)
  return data ?? []
}

export async function marcarNotificacionLeida(id: string): Promise<void> {
  const supabase = await createClient()
  await supabase.from('notificaciones').update({ leida: true }).eq('id', id)
}
