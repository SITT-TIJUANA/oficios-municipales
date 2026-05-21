'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn, getInitials } from '@/lib/utils'
import type { Perfil } from '@/types'
import {
  LayoutDashboard, FileText, ClipboardList, GitBranch,
  BarChart2, FileStack, Users, LogOut, Plus,
  ChevronRight
} from 'lucide-react'

type NavLink = {
  href: string
  label: string
  icon: React.ComponentType<{ size: number; className?: string }>
  badge?: string
  adminOnly?: boolean
}

const NAV_ITEMS: { section: string; links: NavLink[] }[] = [
  { section: 'Principal', links: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ]},
  { section: 'Gestión documental', links: [
    { href: '/oficios', label: 'Oficios', icon: FileText },
    { href: '/instrucciones', label: 'Instrucciones', icon: ClipboardList },
    { href: '/oficios/nuevo', label: 'Nuevo oficio', icon: Plus },
  ]},
  { section: 'Reportes', links: [
    { href: '/reportes', label: 'Generar reporte', icon: BarChart2 },
    { href: '/plantillas', label: 'Plantillas', icon: FileStack },
  ]},
  { section: 'Administración', links: [
    { href: '/usuarios', label: 'Usuarios', icon: Users, adminOnly: true },
    { href: '/flujo', label: 'Flujo visual', icon: GitBranch },
  ]},
]

export default function Sidebar({ perfil }: { perfil: Perfil | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Sesión cerrada')
    router.push('/login')
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col bg-guinda-gradient border-r border-white/5 overflow-hidden">
      <div className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/20 border border-gold/30 flex items-center justify-center flex-shrink-0">
            <span className="text-xl">🏛</span>
          </div>
          <div className="min-w-0">
            <p className="text-gold text-[10px] font-semibold tracking-widest uppercase truncate">
              Sistema Municipal
            </p>
            <p className="text-white text-xs font-bold leading-tight truncate">
              {process.env.NEXT_PUBLIC_AYUNTAMIENTO_NOMBRE?.replace('H. Ayuntamiento', '') || 'Oficios'}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-6">
        {NAV_ITEMS.map(group => (
          <div key={group.section}>
            <p className="text-white/30 text-[9px] font-semibold uppercase tracking-widest px-2 mb-1.5">
              {group.section}
            </p>
            <div className="space-y-0.5">
              {group.links
                .filter(link => !link.adminOnly || perfil?.rol === 'administrador')
                .map(link => {
                  const Icon = link.icon
                  const active = isActive(link.href)
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn('nav-link', active && 'nav-link-active')}
                    >
                      <Icon size={16} className="flex-shrink-0" />
                      <span className="flex-1 text-sm">{link.label}</span>
                      {active && <ChevronRight size={12} className="opacity-60" />}
                    </Link>
                  )
                })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-white/10">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
          <div className="w-8 h-8 rounded-lg bg-guinda-400 border border-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {getInitials(perfil?.nombre_completo)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">
              {perfil?.nombre_completo || 'Usuario'}
            </p>
            <p className="text-white/40 text-[10px] capitalize truncate">
              {perfil?.rol || 'usuario'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-white/30 hover:text-red-300 transition-colors p-1 opacity-0 group-hover:opacity-100"
            title="Cerrar sesión"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}