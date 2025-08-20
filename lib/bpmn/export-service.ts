/**
 * BPMN Export Service
 * Handles export functionality for BPMN diagrams
 */

interface ExportOptions {
  format: 'bpmn' | 'xml' | 'svg' | 'png'
  diagramId?: string
  useBackend?: boolean
}

/**
 * Export diagram from backend
 */
export async function exportFromBackend(diagramId: string, format: string) {
  const response = await fetch(`/api/bpmn/export?id=${diagramId}&format=${format}`)
  
  if (!response.ok) {
    throw new Error('Export failed')
  }
  
  if (format === 'json') {
    return response.json()
  }
  
  const blob = await response.blob()
  return blob
}

/**
 * Export diagram from client-side modeler
 */
export async function exportFromClient(
  modeler: any,
  format: 'bpmn' | 'xml' | 'svg' | 'png'
): Promise<void> {
  if (!modeler) throw new Error('No modeler instance')
  
  switch (format) {
    case 'svg':
      return exportAsSVG(modeler)
    case 'png':
      return exportAsPNG(modeler)
    case 'bpmn':
    case 'xml':
      return exportAsXML(modeler, format)
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
}

/**
 * Export as SVG
 */
function exportAsSVG(modeler: any): void {
  const canvas = modeler.get('canvas') as any
  const svg = canvas._svg || canvas.getContainer()?.querySelector('svg')
  
  if (!svg) throw new Error('SVG element not found')
  
  // Clone and prepare SVG
  const svgClone = svg.cloneNode(true) as SVGElement
  svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  svgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')
  
  // Add white background
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  rect.setAttribute('width', '100%')
  rect.setAttribute('height', '100%')
  rect.setAttribute('fill', 'white')
  svgClone.insertBefore(rect, svgClone.firstChild)
  
  // Export
  const svgString = new XMLSerializer().serializeToString(svgClone)
  downloadFile(svgString, 'diagram.svg', 'image/svg+xml')
}

/**
 * Export as PNG
 */
async function exportAsPNG(modeler: any): Promise<void> {
  const canvas = modeler.get('canvas') as any
  const svg = canvas._svg || canvas.getContainer()?.querySelector('svg')
  
  if (!svg) throw new Error('SVG element not found')
  
  // Get proper dimensions
  const bbox = svg.getBBox()
  const padding = 50
  const width = Math.max(bbox.width + bbox.x + padding, 800)
  const height = Math.max(bbox.height + bbox.y + padding, 600)
  
  // Create canvas
  const canvasElement = document.createElement('canvas')
  canvasElement.width = width * 2 // Higher resolution
  canvasElement.height = height * 2
  const ctx = canvasElement.getContext('2d')
  
  if (!ctx) throw new Error('Canvas context not available')
  
  // Scale for better quality
  ctx.scale(2, 2)
  
  // White background
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, width, height)
  
  // Prepare SVG
  const svgClone = svg.cloneNode(true) as SVGElement
  svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  svgClone.setAttribute('width', String(width))
  svgClone.setAttribute('height', String(height))
  
  // Convert to image
  const svgString = new XMLSerializer().serializeToString(svgClone)
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const svgUrl = URL.createObjectURL(svgBlob)
  
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(svgUrl)
      
      canvasElement.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = 'diagram.png'
          a.click()
          URL.revokeObjectURL(url)
          resolve()
        } else {
          reject(new Error('Failed to create PNG'))
        }
      }, 'image/png', 0.95) // High quality
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(svgUrl)
      reject(new Error('Failed to load SVG'))
    }
    
    img.src = svgUrl
  })
}

/**
 * Export as BPMN 2.0 XML
 */
async function exportAsXML(modeler: any, format: 'bpmn' | 'xml'): Promise<void> {
  const { xml } = await modeler.saveXML({ format: true })
  
  if (!xml) throw new Error('Failed to generate XML')
  
  // Ensure proper BPMN 2.0 namespace
  let processedXml = xml
  if (!xml.includes('xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"')) {
    processedXml = xml.replace(
      '<bpmn:definitions',
      '<bpmn:definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"'
    )
  }
  
  const filename = format === 'xml' ? 'diagram.xml' : 'diagram.bpmn'
  downloadFile(processedXml, filename, 'text/xml')
}

/**
 * Download file helper
 */
function downloadFile(content: string | Blob, filename: string, mimeType: string): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Main export function
 */
export async function exportDiagram(
  modeler: any,
  options: ExportOptions
): Promise<void> {
  const { format, diagramId, useBackend = false } = options
  
  // Use backend if diagram ID is provided and backend is requested
  if (useBackend && diagramId) {
    const result = await exportFromBackend(diagramId, format)
    
    if (result instanceof Blob) {
      const url = URL.createObjectURL(result)
      const a = document.createElement('a')
      a.href = url
      a.download = `diagram.${format}`
      a.click()
      URL.revokeObjectURL(url)
    }
    
    return
  }
  
  // Otherwise use client-side export
  return exportFromClient(modeler, format)
}