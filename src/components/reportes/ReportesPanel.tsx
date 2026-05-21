'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { FileText, FileSpreadsheet, FileCheck, Download, Filter, BarChart2, Clock, CheckCircle2, AlertTriangle } from 'lucide-react'
import { formatDate, estadoConfig, prioridadConfig } from '@/lib/utils'
import { generarPDF, generarWord, generarExcel } from '@/lib/reportes'
import type { Oficio, Departamento, EstadisticasDashboard, EstadoOficio } from '@/types'

interface Props {
  oficios: Oficio[]
  departamentos: Departamento[]
  stats: EstadisticasDashboard | null
}

export default function ReportesPanel({ oficios, departamentos, stats }: Props) {
  const [filtros, setFiltros] = useState({
    estado: '',
    prioridad: '',
    departamento_id: '',
    fecha_inicio: '',
    fecha_fin: '',
    requiere_respuesta: '',
  })
  const [formato, setFormato] = useState<'pdf' | 'word' | 'excel'>('pdf')
  const [generando, setGenerando] = useState(false)

  // Filtrar oficios según criterios seleccionados
  const oficiosFiltrados = useMemo(() => {
    return oficios.filter(o => {
      if (filtros.estado && o.estado !== filtros.estado) return false
      if (filtros.prioridad && o.prioridad !== filtros.prioridad) return false
      if (filtros.departamento_id && o.departamento_id !== filtros.departamento_id) return false
      if (filtros.fecha_inicio && o.fecha_recepcion < filtros.fecha_inicio) return false
      if (filtros.fecha_fin && o.fecha_recepcion > filtros.fecha_fin) return false
      if (filtros.requiere_respuesta === 'si' && !o.requiere_respuesta) return false
      if (filtros.requiere_respuesta === 'no' && o.requiere_respuesta) return false
      return true
    })
  }, [oficios, filtros])

  const handleGenerar = async () => {
    if (oficiosFiltrados.length === 0) {
      toast.error('Sin datos', { description: 'No hay oficios con los filtros seleccionados' })
      return
    }
    setGenerando(true)
    try {
      const params = {
        oficios: oficiosFiltrados,
        titulo: 'Reporte de Oficios Municipales',
        periodo: filtros.fecha_inicio && filtros.fecha_fin
          ? `${formatDate(filtros.fecha_inicio)} — ${formatDate(filtros.fecha_fin)}`
          : undefined,
        departamento: departamentos.find(d => d.id === filtros.departamento_id)?.nombre,
      }

      if (formato === 'pdf') generarPDF(params)
      else if (formato === 'word') await generarWord(params)
      else generarExcel(params)

      toast.success(`Reporte ${formato.toUpperCase()} generado`, {
        description: `${oficiosFiltrados.length} oficios incluidos`
      })
    } catch (e) {
      toast.error('Error al generar el reporte')
    } finally {
      setGenerando(false)
    }
  }

  const statCards = [
    { label: 'Total', value: stats?.total ?? 0, icon: BarChart2, color: 'text-blue-600 bg-blue-50' },
    { label: 'Pendientes', value: stats?.pendientes ?? 0, icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'Concluidos', value: stats?.concluidos ?? 0, icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
    { label: 'Urgentes', value: stats?.urgentes ?? 0, icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
  ]

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Stats rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className="card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
              <card.icon size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Panel de configuración */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filtros */}
        <div className="lg:col-span-2 card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Filter size={15} className="text-guinda" />
            Filtros del reporte
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Estado</label>
              <select value={filtros.estado} onChange={e => setFiltros(f => ({ ...f, estado: e.target.value }))} className="form-input">
                <option value="">Todos los estados</option>
                <option value="recibido">Recibido</option>
                <option value="en_proceso">En proceso</option>
                <option value="firmado">Firmado</option>
                <option value="requiere_respuesta">Requiere respuesta</option>
                <option value="sin_respuesta">Sin respuesta</option>
                <option value="reiterado">Reiterado</option>
                <option value="respondido">Respondido</option>
                <option value="terminado">Terminado</option>
                <option value="archivado">Archivado</option>
              </select>
            </div>
            <div>
              <label className="form-label">Prioridad</label>
              <select value={filtros.prioridad} onChange={e => setFiltros(f => ({ ...f, prioridad: e.target.value }))} className="form-input">
                <option value="">Todas</option>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </div>
            <div>
              <label className="form-label">Departamento</label>
              <select value={filtros.departamento_id} onChange={e => setFiltros(f => ({ ...f, departamento_id: e.target.value }))} className="form-input">
                <option value="">Todos</option>
                {departamentos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Requiere respuesta</label>
              <select value={filtros.requiere_respuesta} onChange={e => setFiltros(f => ({ ...f, requiere_respuesta: e.target.value }))} className="form-input">
                <option value="">Todos</option>
                <option value="si">Sí</option>
                <option value="no">No</option>
              </select>
            </div>
            <div>
              <label className="form-label">Fecha desde</label>
              <input type="date" value={filtros.fecha_inicio} onChange={e => setFiltros(f => ({ ...f, fecha_inicio: e.target.value }))} className="form-input" />
            </div>
            <div>
              <label className="form-label">Fecha hasta</label>
              <input type="date" value={filtros.fecha_fin} onChange={e => setFiltros(f => ({ ...f, fecha_fin: e.target.value }))} className="form-input" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-guinda">{oficiosFiltrados.length}</span> oficios seleccionados para el reporte
            </p>
          </div>
        </div>

        {/* Selector de formato y generación */}
        <div className="card p-5 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-gray-900">Formato de salida</h3>

          {[
            { tipo: 'pdf' as const, label: 'PDF', desc: 'Con encabezado institucional, estadísticas y tabla', icon: FileText, color: 'text-red-600' },
            { tipo: 'word' as const, label: 'Word (.docx)', desc: 'Documento editable para personalizar', icon: FileCheck, color: 'text-blue-600' },
            { tipo: 'excel' as const, label: 'Excel (.xlsx)', desc: 'Hoja de cálculo con todos los campos', icon: FileSpreadsheet, color: 'text-green-600' },
          ].map(f => (
            <label key={f.tipo} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
              formato === f.tipo ? 'border-guinda bg-guinda-50' : 'border-gray-100 hover:border-gray-200'
            }`}>
              <input type="radio" name="formato" value={f.tipo} checked={formato === f.tipo}
                onChange={() => setFormato(f.tipo)} className="mt-0.5 accent-guinda" />
              <div>
                <div className="flex items-center gap-2">
                  <f.icon size={15} className={f.color} />
                  <span className="text-sm font-semibold text-gray-900">{f.label}</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">{f.desc}</p>
              </div>
            </label>
          ))}

          <button
            onClick={handleGenerar}
            disabled={generando || oficiosFiltrados.length === 0}
            className="btn-primary w-full justify-center mt-auto py-2.5"
          >
            {generando ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generando...
              </span>
            ) : (
              <>
                <Download size={15} />
                Generar {formato.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Vista previa de datos */}
      {oficiosFiltrados.length > 0 && (
        <div className="card overflow-hidden">
          <div className="card-header">
            <h3 className="card-title">Vista previa — {oficiosFiltrados.length} registros</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Núm. oficio</th>
                  <th>Tema</th>
                  <th>Departamento</th>
                  <th>Estado</th>
                  <th>Prioridad</th>
                  <th>F. Recepción</th>
                  <th>Días</th>
                </tr>
              </thead>
              <tbody>
                {oficiosFiltrados.slice(0, 10).map(o => {
                  const eCfg = estadoConfig[o.estado]
                  const pCfg = prioridadConfig[o.prioridad]
                  return (
                    <tr key={o.id}>
                      <td><span className="font-mono text-xs font-bold text-guinda">{o.numero_oficio}</span></td>
                      <td className="max-w-[220px]"><p className="text-xs truncate">{o.tema}</p></td>
                      <td><p className="text-xs text-gray-600 truncate max-w-[130px]">{o.departamento_nombre || '—'}</p></td>
                      <td><span className={`badge text-[10px] ${eCfg.badgeClass}`}>{eCfg.label}</span></td>
                      <td>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${pCfg.dotClass}`} />
                          <span className="text-xs">{pCfg.label}</span>
                        </div>
                      </td>
                      <td className="text-xs text-gray-500">{formatDate(o.fecha_recepcion)}</td>
                      <td className="text-xs font-semibold text-gray-700">{Math.round(o.dias_transcurridos ?? 0)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {oficiosFiltrados.length > 10 && (
              <p className="text-center text-xs text-gray-400 py-3 border-t border-gray-50">
                + {oficiosFiltrados.length - 10} registros más incluidos en el reporte
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
