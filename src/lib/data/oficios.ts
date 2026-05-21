import { createClient } from '@/lib/supabase/server'
import type {
  Oficio, MovimientoOficio, ArchivoOficio, ComentarioOficio,
  EstadisticasDashboard, EstadoOficio, OficioFormData
} from '@/types'

// ----------------------------------------------------------------
// Obtener todos los oficios con detalle
export async function getOficios(filtros?: {
  estado?: EstadoOficio
  prioridad?: string
  departamento_id?: string
  asignado_a?: string
  busqueda?: string
  pagina?: number
  porPagina?: number
}): Promise<{ data: Oficio[]; total: number; error: string | null }> {
  const supabase = await createClient()
  const pagina = filtros?.pagina ?? 1
  const porPagina = filtros?.porPagina ?? 20
  const from = (pagina - 1) * porPagina
  const to = from + porPagina - 1

  let query = supabase
    .from('oficios_con_detalle')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (filtros?.estado) query = query.eq('estado', filtros.estado)
  if (filtros?.prioridad) query = query.eq('prioridad', filtros.prioridad)
  if (filtros?.departamento_id) query = query.eq('departamento_id', filtros.departamento_id)
  if (filtros?.asignado_a) query = query.eq('asignado_a', filtros.asignado_a)
  if (filtros?.busqueda) {
    query = query.or(
      `tema.ilike.%${filtros.busqueda}%,numero_oficio.ilike.%${filtros.busqueda}%,remitente_nombre.ilike.%${filtros.busqueda}%`
    )
  }

  const { data, count, error } = await query
  return { data: (data ?? []) as Oficio[], total: count ?? 0, error: error?.message ?? null }
}

// ----------------------------------------------------------------
export async function getOficio(id: string): Promise<{ data: Oficio | null; error: string | null }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('oficios_con_detalle')
    .select('*')
    .eq('id', id)
    .single()
  return { data: data as Oficio | null, error: error?.message ?? null }
}

// ----------------------------------------------------------------
export async function crearOficio(
  formData: Partial<OficioFormData>
): Promise<{ data: Oficio | null; error: string | null }> {
  const supabase = await createClient()

  // Generar número de oficio si no se provee
  let numero = formData.numero_oficio
  if (!numero || numero.trim() === '') {
    const { data: numData } = await supabase
      .rpc('generar_numero_oficio')
    numero = numData as string
  }

  const payload = {
    ...formData,
    numero_oficio: numero,
    estado: formData.estado || 'recibido',
    prioridad: formData.prioridad || 'media',
    tipo_documento: formData.tipo_documento || 'oficio',
    requiere_respuesta: formData.requiere_respuesta ?? false,
    // limpiar strings vacíos a null
    descripcion: formData.descripcion || null,
    fecha_despacho: formData.fecha_despacho || null,
    fecha_respuesta: formData.fecha_respuesta || null,
    fecha_terminacion: formData.fecha_terminacion || null,
    fecha_limite: formData.fecha_limite || null,
    asignado_a: formData.asignado_a || null,
    departamento_id: formData.departamento_id || null,
    remitente_nombre: formData.remitente_nombre || null,
    remitente_cargo: formData.remitente_cargo || null,
    remitente_institucion: formData.remitente_institucion || null,
    destinatario_nombre: formData.destinatario_nombre || null,
    observaciones: formData.observaciones || null,
    oficio_relacionado: formData.oficio_relacionado || null,
  }

  const { data, error } = await supabase
    .from('oficios')
    .insert([payload])
    .select()
    .single()

  return { data: data as Oficio | null, error: error?.message ?? null }
}

// ----------------------------------------------------------------
export async function actualizarOficio(
  id: string,
  updates: Partial<OficioFormData>
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('oficios')
    .update(updates)
    .eq('id', id)
  return { error: error?.message ?? null }
}

// ----------------------------------------------------------------
export async function avanzarEstado(
  id: string,
  nuevoEstado: EstadoOficio,
  comentario?: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const updates: Partial<Oficio> = { estado: nuevoEstado }
  if (nuevoEstado === 'terminado') updates.fecha_terminacion = new Date().toISOString().split('T')[0]
  if (nuevoEstado === 'firmado') updates.fecha_despacho = new Date().toISOString().split('T')[0]
  if (nuevoEstado === 'respondido') updates.fecha_respuesta = new Date().toISOString().split('T')[0]

  const { error } = await supabase.from('oficios').update(updates).eq('id', id)
  if (error) return { error: error.message }

  // Agregar comentario al movimiento si se provee
  if (comentario) {
    await supabase.from('movimientos_oficio').update({ comentario }).eq('oficio_id', id).order('fecha', { ascending: false }).limit(1)
  }

  return { error: null }
}

// ----------------------------------------------------------------
export async function getMovimientos(oficioId: string): Promise<MovimientoOficio[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('movimientos_oficio')
    .select('*, perfil:realizado_por(nombre_completo, cargo, avatar_url)')
    .eq('oficio_id', oficioId)
    .order('fecha', { ascending: false })
  return (data ?? []) as MovimientoOficio[]
}

// ----------------------------------------------------------------
export async function getArchivos(oficioId: string): Promise<ArchivoOficio[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('archivos_oficio')
    .select('*')
    .eq('oficio_id', oficioId)
    .order('created_at', { ascending: false })
  return (data ?? []) as ArchivoOficio[]
}

// ----------------------------------------------------------------
export async function getComentarios(oficioId: string): Promise<ComentarioOficio[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('comentarios_oficio')
    .select('*, autor:autor_id(nombre_completo, cargo, avatar_url)')
    .eq('oficio_id', oficioId)
    .order('created_at', { ascending: false })
  return (data ?? []) as ComentarioOficio[]
}

// ----------------------------------------------------------------
export async function agregarComentario(
  oficioId: string,
  comentario: string,
  esInterno: boolean = true
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { error } = await supabase.from('comentarios_oficio').insert([{
    oficio_id: oficioId,
    comentario,
    es_interno: esInterno,
  }])
  return { error: error?.message ?? null }
}

// ----------------------------------------------------------------
export async function getEstadisticas(): Promise<EstadisticasDashboard | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('estadisticas_dashboard').select('*').single()
  return data as EstadisticasDashboard | null
}

// ----------------------------------------------------------------
// Datos para gráfica por mes (últimos 6 meses)
export async function getOfiiciosPorMes(): Promise<{ mes: string; total: number; concluidos: number }[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('oficios')
    .select('fecha_recepcion, estado')
    .gte('fecha_recepcion', new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString())

  if (!data) return []

  const meses: Record<string, { total: number; concluidos: number }> = {}
  data.forEach((o: { fecha_recepcion: string; estado: string }) => {
    const mes = o.fecha_recepcion.substring(0, 7) // YYYY-MM
    if (!meses[mes]) meses[mes] = { total: 0, concluidos: 0 }
    meses[mes].total++
    if (['terminado', 'archivado', 'respondido'].includes(o.estado)) {
      meses[mes].concluidos++
    }
  })

  return Object.entries(meses)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, vals]) => ({
      mes: new Date(mes + '-01').toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }),
      ...vals,
    }))
}

// ----------------------------------------------------------------
// Subir archivo
export async function subirArchivo(
  oficioId: string,
  file: File,
  tipoArchivo: string = 'documento'
): Promise<{ data: ArchivoOficio | null; error: string | null }> {
  const supabase = await createClient()
  const nombreStorage = `${oficioId}/${Date.now()}_${file.name}`

  const { error: uploadError } = await supabase.storage
    .from('oficios-archivos')
    .upload(nombreStorage, file)

  if (uploadError) return { data: null, error: uploadError.message }

  const { data: urlData } = supabase.storage
    .from('oficios-archivos')
    .getPublicUrl(nombreStorage)

  const { data, error } = await supabase
    .from('archivos_oficio')
    .insert([{
      oficio_id: oficioId,
      nombre: file.name,
      nombre_storage: nombreStorage,
      tipo_mime: file.type,
      tamano_bytes: file.size,
      tipo_archivo: tipoArchivo,
      url_publica: urlData.publicUrl,
    }])
    .select()
    .single()

  return { data: data as ArchivoOficio | null, error: error?.message ?? null }
}
