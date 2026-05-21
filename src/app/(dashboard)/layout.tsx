export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: perfil } = await supabase.from('perfiles').select('*, departamento:departamento_id(id,nombre)').eq('id', user.id).maybeSingle()
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar perfil={perfil} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar perfil={perfil} />
        <main className="flex-1 overflow-y-auto p-6 animate-in">
          {children}
        </main>
      </div>
    </div>
  )
}