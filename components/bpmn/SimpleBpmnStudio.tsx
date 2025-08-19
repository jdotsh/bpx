'use client'

import { useEffect, useRef, useState } from 'react'
import BpmnModeler from 'bpmn-js/lib/Modeler'
import { Save, Download, Upload, Undo, Redo, ZoomIn, ZoomOut } from 'lucide-react'

const DEFAULT_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
  id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1"/>
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="179" y="79" width="36" height="36"/>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`

export function SimpleBpmnStudio() {
  const containerRef = useRef<HTMLDivElement>(null)
  const modelerRef = useRef<BpmnModeler | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState('Initializing...')
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  
  useEffect(() => {
    if (!containerRef.current) return
    
    // Create modeler with minimal config
    const modeler = new BpmnModeler({
      container: containerRef.current,
      keyboard: { bindTo: window }
    })
    
    modelerRef.current = modeler
    
    // Import default XML
    modeler.importXML(DEFAULT_XML)
      .then(() => {
        setStatus('Ready')
        
        // Setup undo/redo listeners
        const commandStack = modeler.get('commandStack') as any
        const updateButtons = () => {
          setCanUndo(commandStack.canUndo())
          setCanRedo(commandStack.canRedo())
        }
        commandStack.on('changed', updateButtons)
        
        // Fit to viewport
        const canvas = modeler.get('canvas') as any
        canvas.zoom('fit-viewport')
      })
      .catch((err) => {
        console.error('Failed to import XML:', err)
        setStatus('Error loading diagram')
      })
    
    return () => {
      modeler.destroy()
    }
  }, [])
  
  const handleSave = async () => {
    if (!modelerRef.current) return
    
    try {
      setStatus('Saving...')
      const { xml } = await modelerRef.current.saveXML({ format: true })
      
      // For now, just save to localStorage
      localStorage.setItem('bpmn-diagram', xml || '')
      setStatus('Saved to browser')
      
      // TODO: Save to database when ready
      console.log('Saved XML:', xml)
    } catch (err) {
      console.error('Save failed:', err)
      setStatus('Save failed')
    }
  }
  
  const handleExport = async () => {
    if (!modelerRef.current) return
    
    try {
      const { xml } = await modelerRef.current.saveXML({ format: true })
      const blob = new Blob([xml || ''], { type: 'text/xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `diagram-${Date.now()}.bpmn`
      a.click()
      URL.revokeObjectURL(url)
      setStatus('Exported')
    } catch (err) {
      console.error('Export failed:', err)
      setStatus('Export failed')
    }
  }
  
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !modelerRef.current) return
    
    const reader = new FileReader()
    reader.onload = async (e) => {
      const xml = e.target?.result as string
      try {
        await modelerRef.current!.importXML(xml)
        setStatus('Imported successfully')
        
        // Fit to viewport
        const canvas = modelerRef.current!.get('canvas') as any
        canvas.zoom('fit-viewport')
      } catch (err) {
        console.error('Import failed:', err)
        setStatus('Import failed')
      }
    }
    reader.readAsText(file)
  }
  
  const handleUndo = () => {
    const commandStack = modelerRef.current?.get('commandStack') as any
    if (commandStack?.canUndo()) {
      commandStack.undo()
    }
  }
  
  const handleRedo = () => {
    const commandStack = modelerRef.current?.get('commandStack') as any
    if (commandStack?.canRedo()) {
      commandStack.redo()
    }
  }
  
  const handleZoom = (factor: number) => {
    const canvas = modelerRef.current?.get('canvas') as any
    if (canvas) {
      const currentZoom = canvas.zoom()
      canvas.zoom(currentZoom * factor)
    }
  }
  
  const handleZoomFit = () => {
    const canvas = modelerRef.current?.get('canvas') as any
    if (canvas) {
      canvas.zoom('fit-viewport')
    }
  }
  
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 bg-white border-b shadow-sm">
        <div className="flex items-center gap-2">
          {/* File operations */}
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            title="Save diagram"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
          
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            title="Export as BPMN"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            title="Import BPMN file"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          
          <input 
            ref={fileInputRef}
            type="file" 
            accept=".bpmn,.xml" 
            onChange={handleImport}
            className="hidden"
          />
          
          <div className="w-px h-6 bg-gray-300 mx-2" />
          
          {/* Edit operations */}
          <button 
            onClick={handleUndo}
            disabled={!canUndo}
            className={`p-2 rounded transition-colors ${
              canUndo 
                ? 'hover:bg-gray-200 text-gray-700' 
                : 'text-gray-300 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          
          <button 
            onClick={handleRedo}
            disabled={!canRedo}
            className={`p-2 rounded transition-colors ${
              canRedo 
                ? 'hover:bg-gray-200 text-gray-700' 
                : 'text-gray-300 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </button>
          
          <div className="w-px h-6 bg-gray-300 mx-2" />
          
          {/* Zoom controls */}
          <button 
            onClick={() => handleZoom(0.9)}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <button 
            onClick={handleZoomFit}
            className="px-2 py-1 text-sm hover:bg-gray-200 rounded transition-colors"
            title="Fit to viewport"
          >
            Fit
          </button>
          
          <button 
            onClick={() => handleZoom(1.1)}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
        
        {/* Status */}
        <div className="text-sm text-gray-600">
          Status: <span className="font-medium">{status}</span>
        </div>
      </div>
      
      {/* Canvas */}
      <div ref={containerRef} className="flex-1 bg-white" />
    </div>
  )
}