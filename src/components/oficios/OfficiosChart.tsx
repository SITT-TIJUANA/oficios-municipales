'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp } from 'lucide-react'

interface Props {
  data: { mes: string; total: number; concluidos: number }[]
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3">
        <p className="text-xs font-semibold text-gray-700 mb-2 capitalize">{label}</p>
        {payload.map(p => (
          <div key={p.name} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-gray-600">{p.name}:</span>
            <span className="font-bold text-gray-900">{p.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function OfficiosChart({ data }: Props) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-guinda-50 flex items-center justify-center">
            <TrendingUp size={14} className="text-guinda" />
          </div>
          <h3 className="card-title">Oficios por mes</h3>
        </div>
        <span className="text-xs text-gray-400">Últimos 6 meses</span>
      </div>
      <div className="p-5">
        {data.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
            Sin datos disponibles
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 11, fill: '#9CA3AF', textTransform: 'capitalize' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(107,26,42,0.05)', radius: 4 }} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
                formatter={value => <span className="text-gray-600">{value}</span>}
              />
              <Bar dataKey="total" name="Total recibidos" fill="#C9A8A8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="concluidos" name="Concluidos" fill="#6B1A2A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
