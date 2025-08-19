// BPMN Export Modal - Multiple Format Support
// Complete BPMN Studio MVP

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, FileText, Image, Code, FileCheck } from 'lucide-react'
import { BpmnDesigner } from '@/lib/bpmn-designer'

interface BpmnExportModalProps {
  isOpen: boolean
  onClose: () => void
  designer: BpmnDesigner | null
  diagramTitle?: string
}

export function BpmnExportModal({ isOpen, onClose, designer, diagramTitle = 'process' }: BpmnExportModalProps) {
  const [exporting, setExporting] = useState<string | null>(null)

  if (!isOpen) return null

  const exportFormats = [
    {
      id: 'bpmn',
      name: 'BPMN XML',
      description: 'Standard BPMN 2.0 XML format',
      icon: FileText,
      extension: 'bpmn'
    },
    {
      id: 'svg',
      name: 'SVG Image',
      description: 'Scalable vector graphics',
      icon: Image,
      extension: 'svg'
    },
    {
      id: 'png',
      name: 'PNG Image',
      description: 'Portable network graphics',
      icon: Image,
      extension: 'png'
    },
    {
      id: 'json',
      name: 'JSON',
      description: 'Process definition as JSON',
      icon: Code,
      extension: 'json'
    }
  ]

  const handleExport = async (format: string) => {
    if (!designer) return
    
    setExporting(format)
    try {
      switch (format) {
        case 'bpmn':
          await exportBpmn()
          break
        case 'svg':
          await exportSvg()
          break
        case 'png':
          await exportPng()
          break
        case 'json':
          await exportJson()
          break
      }
    } catch (error) {
      console.error(`Export failed for ${format}:`, error)
    } finally {
      setExporting(null)
    }
  }

  const exportBpmn = async () => {
    if (!designer) return
    const xml = await designer.getXml()
    downloadFile(xml, `${diagramTitle}.bpmn`, 'application/xml')
  }

  const exportSvg = async () => {
    if (!designer) return
    const svg = await designer.getSvg()
    downloadFile(svg, `${diagramTitle}.svg`, 'image/svg+xml')
  }

  const exportPng = async () => {
    if (!designer) return
    
    // Get SVG first
    const svg = await designer.getSvg()
    
    // Create canvas to convert SVG to PNG
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas context not available')
    
    const img = document.createElement('img')
    const svgBlob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(svgBlob)
    
    return new Promise<void>((resolve, reject) => {
      img.onload = () => {
        canvas.width = img.width || 800
        canvas.height = img.height || 600
        
        // Fill white background
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // Draw the SVG
        ctx.drawImage(img, 0, 0)
        
        // Convert to PNG
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${diagramTitle}.png`
            a.click()
            URL.revokeObjectURL(url)
            resolve()
          } else {
            reject(new Error('Failed to create PNG blob'))
          }
        }, 'image/png')
        
        URL.revokeObjectURL(url)
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load SVG'))
      }
      
      img.src = url
    })
  }

  const exportJson = async () => {
    if (!designer) return
    
    const xml = await designer.getXml()
    
    // Simple XML to JSON conversion for process structure
    const processData = {
      title: diagramTitle,
      format: 'BPMN 2.0',
      exported: new Date().toISOString(),
      bpmnXml: xml,
      elements: extractElementsFromXml(xml)
    }
    
    downloadFile(JSON.stringify(processData, null, 2), `${diagramTitle}.json`, 'application/json')
  }

  const extractElementsFromXml = (xml: string) => {
    // Basic element extraction for JSON export
    const elements: Array<{id: string, name: string, type: string}> = []
    const taskMatches = xml.match(/<bpmn[^>]*task[^>]*id="([^"]*)"[^>]*name="([^"]*)"/g) || []
    const eventMatches = xml.match(/<bpmn[^>]*event[^>]*id="([^"]*)"[^>]*name="([^"]*)"/g) || []
    const gatewayMatches = xml.match(/<bpmn[^>]*gateway[^>]*id="([^"]*)"[^>]*name="([^"]*)"/g) || []
    
    const allMatches = [...taskMatches, ...eventMatches, ...gatewayMatches]
    
    allMatches.forEach(match => {
      const idMatch = match.match(/id="([^"]*)"/)
      const nameMatch = match.match(/name="([^"]*)"/)
      const typeMatch = match.match(/<bpmn[^>]*([a-zA-Z]+)[^>]*/)
      
      if (idMatch) {
        elements.push({
          id: idMatch[1],
          name: nameMatch?.[1] || 'Unnamed',
          type: typeMatch?.[1] || 'Unknown'
        })
      }
    })
    
    return elements
  }

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Export Diagram
          </CardTitle>
          <CardDescription>
            Choose a format to export "{diagramTitle}"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {exportFormats.map((format) => {
              const Icon = format.icon
              const isExporting = exporting === format.id
              
              return (
                <Card 
                  key={format.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => !isExporting && handleExport(format.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Icon className="h-8 w-8 text-blue-600 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-medium">{format.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{format.description}</p>
                        <div className="mt-2">
                          <Button 
                            size="sm" 
                            disabled={isExporting}
                            className="w-full"
                          >
                            {isExporting ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Exporting...
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <Download className="h-4 w-4 mr-2" />
                                Export .{format.extension}
                              </div>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose} disabled={!!exporting}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}