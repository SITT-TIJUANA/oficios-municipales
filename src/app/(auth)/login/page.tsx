'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, Shield } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error('Error al iniciar sesión', { description: 'Verifica tu correo y contraseña' })
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo - institucional */}
      <div className="hidden lg:flex lg:w-1/2 bg-guinda-gradient relative overflow-hidden flex-col justify-between p-12">
        {/* Patrón decorativo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full border-2 border-white translate-x-24 -translate-y-24" />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full border-2 border-white -translate-x-24 translate-y-24" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full border border-white -translate-x-32 -translate-y-32" />
        </div>

        {/* Contenido */}
        <div className="relative">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-16 h-16 rounded-2xl bg-gold/20 border border-gold/30 flex items-center justify-center">
              <span className="text-3xl">🏛</span>
            </div>
            <div>
              <p className="text-gold text-sm font-semibold tracking-widest uppercase">Sistema Municipal</p>
              <h1 className="text-white text-2xl font-bold leading-tight">
                {process.env.NEXT_PUBLIC_AYUNTAMIENTO_NOMBRE || 'H. Ayuntamiento'}
              </h1>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="h-px bg-gold/30 mb-10" />
          <h2 className="text-white text-4xl font-bold mb-4 leading-tight">
            Control y Seguimiento<br />
            de <span className="text-gold">Oficios</span>
          </h2>
          <p className="text-white/60 text-base leading-relaxed mb-10">
            Plataforma institucional para la gestión integral de oficios,
            instrucciones internas y flujo documental del ayuntamiento.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: '📄', label: 'Gestión de oficios', desc: 'Registro y seguimiento' },
              { icon: '🔄', label: 'Flujo visual', desc: 'Proceso administrativo' },
              { icon: '📊', label: 'Reportes', desc: 'PDF, Word y Excel' },
              { icon: '🔔', label: 'Notificaciones', desc: 'Alertas en tiempo real' },
            ].map(item => (
              <div key={item.label} className="flex items-start gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="text-white text-sm font-medium">{item.label}</p>
                  <p className="text-white/50 text-xs">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-white/40 text-xs">
          <Shield size={14} />
          <span>Sistema seguro con autenticación institucional</span>
        </div>
      </div>

      {/* Panel derecho - formulario */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Logo móvil */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-guinda flex items-center justify-center">
              <span className="text-2xl">🏛</span>
            </div>
            <div>
              <p className="text-guinda text-xs font-semibold">Sistema de Oficios</p>
              <h1 className="text-gray-900 font-bold">Ayuntamiento Municipal</h1>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Bienvenido</h2>
            <p className="text-gray-500 text-sm">Ingresa tus credenciales para acceder al sistema</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="form-label">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="form-input"
                placeholder="usuario@ayuntamiento.gob.mx"
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="form-label mb-0">Contraseña</label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="form-input pr-10"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>

          <div className="mt-8 p-4 bg-guinda-50 rounded-xl border border-guinda-100">
            <p className="text-xs text-guinda-700 font-medium mb-1">Sistema institucional restringido</p>
            <p className="text-xs text-guinda-600">
              Acceso exclusivo para personal autorizado del ayuntamiento.
              Para solicitar acceso, contacte al administrador del sistema.
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            {process.env.NEXT_PUBLIC_AYUNTAMIENTO_NOMBRE} •{' '}
            {process.env.NEXT_PUBLIC_AYUNTAMIENTO_MUNICIPIO}
          </p>
        </div>
      </div>
    </div>
  )
}
