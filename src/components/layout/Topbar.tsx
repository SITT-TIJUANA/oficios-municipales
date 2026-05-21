'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Bell, Search, Plus } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Perfil } from '@/types'
import { createClient } from '@/lib/supabase/client'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':     'Dashboard',
  '/oficios':       'Oficios',
  '/oficios/nuevo': 'Nuevo oficio',
  '/instrucciones': 'Instrucciones',
  '/reportes':      'Generar reporte',
  '/plantillas':    'Plantillas',
  '/usuarios':      'Usuarios',
  '/flujo':         'Flujo visual',
}

export default function Topbar({ perfil }: { perfil: Perfil | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const [notifCount, setNotifCount] = useState(0)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  // Obtener conteo de notificaciones no leídas
  useEffect(() => {
    if (!perfil?.id) return
    const fetchNotifs = async () => {
      const { count } = await supabase
        .from('notificaciones')
        .select('id', { count: 'exact', head: true })
        .eq('usuario_id', perfil.id)
        .eq('leida', false)
      setNotifCount(count ?? 0)
    }
    fetchNotifs()

    // Suscribir a cambios en tiempo real
    const channel = supabase
      .channel('notificaciones')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notificaciones' }, fetchNotifs)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [perfil?.id])

  const pageTitle = Object.entries(PAGE_TITLES).find(([key]) =>
    key === pathname || pathname.startsWith(key + '/')
  )?.[1] || 'Sistema de Oficios'

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/oficios?busqueda=${encodeURIComponent(search)}`)
    }
  }

  return (
    <header className="h-14 bg-white border-b border-gray-100 px-6 flex items-center gap-4 flex-shrink-0">
      {/* Breadcrumb / título */}
      <div className="flex-1">
        <h1 className="text-sm font-semibold text-gray-900">{pageTitle}</h1>
      </div>

      {/* Búsqueda global */}
      <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-64">
        <Search size={14} className="text-gray-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Buscar oficios..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none flex-1 min-w-0"
        />
      </form>

      {/* Notificaciones */}
      <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
        <Bell size={18} />
        {notifCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-guinda text-white text-[9px] rounded-full flex items-center justify-center font-bold">
            {notifCount > 9 ? '9+' : notifCount}
          </span>
        )}
      </button>

      {/* CTA nuevo oficio */}
      <Link href="/oficios/nuevo" className="btn-primary text-xs px-3 py-1.5">
        <Plus size={14} />
        Nuevo oficio
      </Link>
    </header>
  )
}
