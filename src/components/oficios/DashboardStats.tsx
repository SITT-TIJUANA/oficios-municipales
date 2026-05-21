import Link from 'next/link'
import { Clock, CheckCircle2, Archive, AlertTriangle, MailX, TrendingUp } from 'lucide-react'
import type { EstadisticasDashboard } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  stats: EstadisticasDashboard | null
}

const CARDS = [
  {
    key: 'pendientes' as const,
    label: 'Pendientes',
    icon: Clock,
    href: '/oficios?estado=recibido',
    colorClass: 'bg-amber-50 text-amber-600 border-amber-200',
    iconBg: 'bg-amber-100',
    valueClass: 'text-amber-700',
    desc: 'Requieren atención',
  },
  {
    key: 'concluidos' as const,
    label: 'Concluidos',
    icon: CheckCircle2,
    href: '/oficios?estado=terminado',
    colorClass: 'bg-green-50 text-green-600 border-green-200',
    iconBg: 'bg-green-100',
    valueClass: 'text-green-700',
    desc: 'Terminados y respondidos',
  },
  {
    key: 'archivados' as const,
    label: 'Archivados',
    icon: Archive,
    href: '/oficios?estado=archivado',
    colorClass: 'bg-blue-50 text-blue-600 border-blue-200',
    iconBg: 'bg-blue-100',
    valueClass: 'text-blue-700',
    desc: 'En expediente',
  },
  {
    key: 'urgentes' as const,
    label: 'Urgentes',
    icon: AlertTriangle,
    href: '/oficios?prioridad=alta',
    colorClass: 'bg-red-50 text-red-600 border-red-200',
    iconBg: 'bg-red-100',
    valueClass: 'text-red-700',
    desc: 'Prioridad alta activos',
  },
  {
    key: 'sin_respuesta' as const,
    label: 'Sin respuesta',
    icon: MailX,
    href: '/oficios?estado=sin_respuesta',
    colorClass: 'bg-guinda-50 text-guinda-600 border-guinda-200',
    iconBg: 'bg-guinda-100',
    valueClass: 'text-guinda',
    desc: 'Requieren seguimiento',
  },
  {
    key: 'promedio_dias_resolucion' as const,
    label: 'Días promedio',
    icon: TrendingUp,
    href: '/reportes',
    colorClass: 'bg-purple-50 text-purple-600 border-purple-200',
    iconBg: 'bg-purple-100',
    valueClass: 'text-purple-700',
    desc: 'Tiempo de resolución',
    suffix: ' días',
  },
]

export default function DashboardStats({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {CARDS.map((card, i) => {
        const Icon = card.icon
        const rawValue = stats?.[card.key]
        const value = rawValue !== null && rawValue !== undefined
          ? (typeof rawValue === 'number' ? rawValue.toFixed(card.suffix ? 1 : 0) : String(rawValue))
          : '—'

        return (
          <Link
            key={card.key}
            href={card.href}
            className={cn(
              'card border p-4 hover:shadow-md transition-all duration-200 group cursor-pointer',
              'animate-in',
              card.colorClass,
            )}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-3', card.iconBg)}>
              <Icon size={18} className={card.valueClass} />
            </div>
            <div className={cn('text-2xl font-bold mb-0.5', card.valueClass)}>
              {value}{card.suffix}
            </div>
            <div className="text-xs font-semibold text-gray-700 mb-0.5">{card.label}</div>
            <div className="text-[10px] text-gray-500">{card.desc}</div>
          </Link>
        )
      })}
    </div>
  )
}
