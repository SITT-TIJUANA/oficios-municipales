import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, AlignmentType, BorderStyle, WidthType } from 'docx'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'
import { formatDate, estadoConfig, prioridadConfig } from '@/lib/utils'
import type { Oficio } from '@/types'

const GUINDA = [107, 26, 42] as [number, number, number]
const GOLD = [201, 168, 76] as [number, number, number]
const GRAY = [100, 100, 100] as [number, number, number]

interface ReporteParams {
  oficios: Oficio[]
  titulo: string
  periodo?: string
  departamento?: string
  ayuntamiento?: string
  municipio?: string
}

// ================================================================
// GENERAR PDF
// ================================================================
export function generarPDF(params: ReporteParams): void {
  const { oficios, titulo, periodo, departamento } = params
  const ayuntamiento = params.ayuntamiento || process.env.NEXT_PUBLIC_AYUNTAMIENTO_NOMBRE || 'H. Ayuntamiento Municipal'
  const municipio = params.municipio || process.env.NEXT_PUBLIC_AYUNTAMIENTO_MUNICIPIO || ''

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })

  // --- Encabezado ---
  doc.setFillColor(...GUINDA)
  doc.rect(0, 0, 280, 22, 'F')
  doc.setFillColor(...GOLD)
  doc.rect(0, 22, 280, 2, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(ayuntamiento.toUpperCase(), 14, 10)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(municipio, 14, 16)

  // Título del reporte
  doc.setTextColor(...GUINDA)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(titulo, 14, 34)

  doc.setTextColor(...GRAY)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  if (periodo) doc.text(`Período: ${periodo}`, 14, 40)
  if (departamento) doc.text(`Departamento: ${departamento}`, 14, 45)
  doc.text(`Generado: ${new Date().toLocaleDateString('es-MX', { dateStyle: 'full' })}`, 14, periodo ? 45 : 40)

  // --- Estadísticas rápidas ---
  const pendientes = oficios.filter(o => ['recibido', 'en_proceso', 'firmado'].includes(o.estado)).length
  const concluidos = oficios.filter(o => ['terminado', 'respondido'].includes(o.estado)).length
  const archivados = oficios.filter(o => o.estado === 'archivado').length
  const urgentes = oficios.filter(o => o.prioridad === 'alta' && !['terminado', 'archivado'].includes(o.estado)).length

  const stats = [
    { label: 'Total oficios', value: oficios.length.toString() },
    { label: 'Pendientes', value: pendientes.toString() },
    { label: 'Concluidos', value: concluidos.toString() },
    { label: 'Archivados', value: archivados.toString() },
    { label: 'Urgentes', value: urgentes.toString() },
  ]

  let xStat = 14
  stats.forEach(stat => {
    doc.setFillColor(245, 230, 234)
    doc.roundedRect(xStat, 50, 46, 18, 2, 2, 'F')
    doc.setTextColor(...GUINDA)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(stat.value, xStat + 23, 62, { align: 'center' })
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...GRAY)
    doc.text(stat.label, xStat + 23, 66, { align: 'center' })
    xStat += 50
  })

  // --- Tabla de oficios ---
  autoTable(doc, {
    startY: 74,
    head: [['No. Oficio', 'Tema', 'Remitente', 'Depto.', 'Prioridad', 'Estado', 'F. Recepción', 'Días']],
    body: oficios.map(o => [
      o.numero_oficio,
      o.tema.length > 45 ? o.tema.substring(0, 45) + '…' : o.tema,
      o.remitente_nombre || '—',
      o.departamento_nombre || '—',
      prioridadConfig[o.prioridad]?.label || o.prioridad,
      estadoConfig[o.estado]?.label || o.estado,
      formatDate(o.fecha_recepcion),
      String(Math.round(o.dias_transcurridos ?? 0)),
    ]),
    headStyles: {
      fillColor: GUINDA,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [250, 245, 246] },
    bodyStyles: { fontSize: 7.5, textColor: [40, 40, 40] },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 68 },
      2: { cellWidth: 35 },
      3: { cellWidth: 35 },
      4: { cellWidth: 20 },
      5: { cellWidth: 28 },
      6: { cellWidth: 25 },
      7: { cellWidth: 12 },
    },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.column.index === 5 && data.section === 'body') {
        const val = data.cell.raw as string
        if (val === 'Alta' || val === 'Urgente') data.cell.styles.textColor = [153, 27, 27]
      }
    },
  })

  // Pie de página
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFillColor(...GUINDA)
    doc.rect(0, 203, 280, 7, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(7)
    doc.text(`${ayuntamiento} — Sistema de Oficios`, 14, 207.5)
    doc.text(`Página ${i} de ${pageCount}`, 266, 207.5, { align: 'right' })
  }

  const fecha = new Date().toISOString().split('T')[0]
  doc.save(`reporte_oficios_${fecha}.pdf`)
}

// ================================================================
// GENERAR WORD
// ================================================================
export async function generarWord(params: ReporteParams): Promise<void> {
  const { oficios, titulo } = params
  const ayuntamiento = params.ayuntamiento || process.env.NEXT_PUBLIC_AYUNTAMIENTO_NOMBRE || 'H. Ayuntamiento Municipal'

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: ayuntamiento.toUpperCase(),
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          text: titulo,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Fecha de generación: `, bold: true }),
            new TextRun({ text: new Date().toLocaleDateString('es-MX', { dateStyle: 'full' }) }),
          ],
          alignment: AlignmentType.RIGHT,
        }),
        new Paragraph({ text: '' }),
        // Tabla de oficios
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            // Encabezado
            new TableRow({
              tableHeader: true,
              children: ['No. Oficio', 'Tema', 'Responsable', 'Estado', 'Prioridad', 'F. Recepción'].map(
                h => new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: 'FFFFFF' })] })],
                  shading: { fill: '6B1A2A' },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                })
              ),
            }),
            // Filas
            ...oficios.map((o, i) =>
              new TableRow({
                children: [
                  o.numero_oficio,
                  o.tema.length > 60 ? o.tema.substring(0, 60) + '…' : o.tema,
                  o.asignado_nombre || '—',
                  estadoConfig[o.estado]?.label || o.estado,
                  prioridadConfig[o.prioridad]?.label || o.prioridad,
                  formatDate(o.fecha_recepcion),
                ].map(text =>
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: String(text) })] })],
                    shading: { fill: i % 2 === 0 ? 'FFFFFF' : 'FAF0F2' },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1 },
                      bottom: { style: BorderStyle.SINGLE, size: 1 },
                      left: { style: BorderStyle.SINGLE, size: 1 },
                      right: { style: BorderStyle.SINGLE, size: 1 },
                    },
                  })
                ),
              })
            ),
          ],
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: `Total de oficios en reporte: ${oficios.length}`, bold: true }),
          ],
        }),
      ],
    }],
  })

  const buffer = await Packer.toBlob(doc)
  const fecha = new Date().toISOString().split('T')[0]
  saveAs(buffer, `reporte_oficios_${fecha}.docx`)
}

// ================================================================
// GENERAR EXCEL
// ================================================================
export function generarExcel(params: ReporteParams): void {
  const { oficios, titulo } = params

  const datos = oficios.map(o => ({
    'Número de Oficio': o.numero_oficio,
    'Tema': o.tema,
    'Descripción': o.descripcion || '',
    'Estado': estadoConfig[o.estado]?.label || o.estado,
    'Prioridad': prioridadConfig[o.prioridad]?.label || o.prioridad,
    'Departamento': o.departamento_nombre || '',
    'Asignado a': o.asignado_nombre || '',
    'Remitente': o.remitente_nombre || '',
    'Institución': o.remitente_institucion || '',
    'Requiere Respuesta': o.requiere_respuesta ? 'Sí' : 'No',
    'Fecha Recepción': formatDate(o.fecha_recepcion),
    'Fecha Despacho': formatDate(o.fecha_despacho),
    'Fecha Respuesta': formatDate(o.fecha_respuesta),
    'Fecha Terminación': formatDate(o.fecha_terminacion),
    'Días Transcurridos': Math.round(o.dias_transcurridos ?? 0),
    'Observaciones': o.observaciones || '',
    'Creado': formatDate(o.created_at),
  }))

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(datos)

  // Estilos de encabezado
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
  for (let C = range.s.c; C <= range.e.c; C++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: C })
    if (!ws[cellRef]) continue
    ws[cellRef].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '6B1A2A' } },
    }
  }

  // Autowidth
  const colWidths = datos.reduce((acc, row) => {
    Object.keys(row).forEach((key, i) => {
      const val = String((row as Record<string, unknown>)[key] ?? '')
      acc[i] = Math.max(acc[i] || key.length, val.length)
    })
    return acc
  }, {} as Record<number, number>)
  ws['!cols'] = Object.values(colWidths).map(w => ({ wch: Math.min(w + 2, 50) }))

  XLSX.utils.book_append_sheet(wb, ws, 'Oficios')

  const fecha = new Date().toISOString().split('T')[0]
  XLSX.writeFile(wb, `reporte_oficios_${fecha}.xlsx`)
}
