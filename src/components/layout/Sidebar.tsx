'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn, getInitials } from '@/lib/utils'
import type { Perfil } from '@/types'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, FileText, ClipboardList, GitBranch,
  BarChart2, FileStack, Users, LogOut, Plus, ChevronRight
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

export default function Sidebar({ perfil: perfilProp }: { perfil: Perfil | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [perfil, setPerfil] = useState<Perfil | null>(perfilProp)

  useEffect(() => {
    const cargarPerfil = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('perfiles')
        .select('*, departamento:departamento_id(id,nombre)')
        .eq('id', user.id)
        .maybeSingle()
      if (data) setPerfil(data)
    }
    if (!perfil?.nombre_completo) cargarPerfil()
  }, [])

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
          <div className="w-10 h-10 rounded-xl bg-gold/20 border border-gold/30 flex items-center justify-center flex-s
