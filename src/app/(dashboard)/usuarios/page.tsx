import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPerfil, getDepartamentos } from '@/lib/data/instrucciones'
import UsuariosPanel from '@/components/usuarios/UsuariosPanel'

export default async function UsuariosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const perfil = await getPerfil(user.id)
  if (perfil?.rol !== 'administrador') redirect('/dashboard')

  const [departamentos, { data: perfiles }] = await Promise.all([
    getDepartamentos(),
    supabase.from('perfiles')
      .select('*, departamento:departamento_id(id,nombre)')
      .order('nombre_completo'),
  ])

  return <UsuariosPanel perfiles={perfiles ?? []} departamentos={departamentos} />
}
