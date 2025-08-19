'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Save, Download, Upload, Undo, Redo, ZoomIn, ZoomOut, Map } from 'lucide-react'
import { createClient } from '@/lib/auth/client'

// Dynamic imports for bpmn-js and diagram-js to avoid SSR issues
import dynamic from 'next/dynamic'

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

interface Props {
  diagramId?: string
  projectId?: string
}

export function BpmnStudioFinal({ diagramId, projectId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const modelerRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState('Initializing...')
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentDiagram, setCurrentDiagram] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  
  // Initialize BPMN modeler
  useEffect(() => {
    let mounted = true
    
    const initializeBpmn = async () => {
      console.log('🚀 Starting BPMN initialization')
      
      if (!containerRef.current) {
        console.error('❌ Container ref not available')
        setError('Container not available')
        return
      }
      
      try {
        // Dynamic import to avoid SSR issues
        console.log('📦 Importing BPMN modules...')
        const BpmnModeler = (await import('bpmn-js/lib/Modeler')).default
        const GridLineModule = (await import('diagram-js-grid-bg')).default
        const minimapModule = (await import('diagram-js-minimap')).default
        
        if (!mounted) return
        
        console.log('✅ Modules imported successfully')
        
        // Load diagram from database if ID provided
        let initialXml = DEFAULT_XML
        if (diagramId) {
          console.log(`📂 Loading diagram ${diagramId} from database...`)
          const { data, error } = await supabase
            .from('diagrams')
            .select('*')
            .eq('id', diagramId)
            .single()
          
          if (error) {
            console.error('❌ Failed to load diagram:', error)
            setError(`Failed to load diagram: ${error.message}`)
          } else if (data) {
            console.log('✅ Diagram loaded from database')
            setCurrentDiagram(data)
            initialXml = data.bpmn_xml || DEFAULT_XML
          }
        }
        
        // Create modeler
        console.log('🎨 Creating BPMN modeler...')
        const modeler = new BpmnModeler({
          container: containerRef.current,
          keyboard: { bindTo: window },
          additionalModules: [
            GridLineModule,
            minimapModule
          ],
          gridLine: {
            smallGridSpacing: 20,
            gridSpacing: 100,
            gridLineStroke: 1,
            gridLineOpacity: 0.2,
            gridLineColor: '#e0e0e0'
          },
          minimap: {
            open: false
          }
        })
        
        if (!mounted) {
          modeler.destroy()
          return
        }
        
        modelerRef.current = modeler
        console.log('✅ Modeler created')
        
        // Import XML
        console.log('📝 Importing BPMN XML...')
        await modeler.importXML(initialXml)
        console.log('✅ XML imported successfully')
        
        // Setup event listeners
        const commandStack = modeler.get('commandStack') as any
        const updateButtons = () => {
          setCanUndo(commandStack.canUndo())
          setCanRedo(commandStack.canRedo())
        }
        commandStack.on('changed', updateButtons)
        updateButtons()
        
        // Fit to viewport
        const canvas = modeler.get('canvas') as any
        canvas.zoom('fit-viewport')
        
        setStatus('Ready')
        console.log('🎉 BPMN Studio initialized successfully!')
        
      } catch (err) {
        console.error('❌ Failed to initialize BPMN:', err)
        setError(`Failed to initialize: ${err instanceof Error ? err.message : String(err)}`)
        setStatus('Failed to initialize')
      }
    }
    
    initializeBpmn()
    
    return () => {
      mounted = false
      if (modelerRef.current) {
        console.log('🧹 Cleaning up modeler')
        modelerRef.current.destroy()
      }
    }
  }, [diagramId])
  
  // Save to database
  const handleSave = useCallback(async () => {
    if (!modelerRef.current) return
    
    setSaving(true)
    setStatus('Saving...')
    
    try {
      const { xml } = await modelerRef.current.saveXML({ format: true })
      console.log('💾 Saving diagram to database...')
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Save to localStorage if not authenticated
        localStorage.setItem('bpmn-diagram', xml || '')
        setStatus('Saved to browser (not logged in)')
        console.log('💾 Saved to localStorage (user not authenticated)')
        setSaving(false)
        return
      }
      
      if (currentDiagram?.id) {
        // Update existing diagram
        const { error } = await supabase
          .from('diagrams')
          .update({
            bpmn_xml: xml,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentDiagram.id)
        
        if (error) throw error
        console.log('✅ Diagram updated in database')
      } else {
        // Create new diagram
        const { data, error } = await supabase
          .from('diagrams')
          .insert({
            name: `Diagram ${new Date().toLocaleString()}`,
            bpmn_xml: xml,
            project_id: projectId,
            profile_id: user.id
          })
          .select()
          .single()
        
        if (error) throw error
        setCurrentDiagram(data)
        console.log('✅ New diagram created in database:', data.id)
        
        // Update URL with new diagram ID
        if (data?.id) {
          window.history.replaceState({}, '', `/studio?diagram=${data.id}`)
        }
      }
      
      setStatus('Saved successfully')
      setTimeout(() => setStatus('Ready'), 2000)
    } catch (err) {
      console.error('❌ Save failed:', err)
      setStatus('Save failed')
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }, [currentDiagram, projectId])
  
  // Export as BPMN
  const handleExport = useCallback(async () => {
    if (!modelerRef.current) return
    
    try {
      const { xml } = await modelerRef.current.saveXML({ format: true })
      const blob = new Blob([xml || ''], { type: 'text/xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${currentDiagram?.name || 'diagram'}-${Date.now()}.bpmn`
      a.click()
      URL.revokeObjectURL(url)
      setStatus('Exported')
      console.log('📤 Diagram exported')
      setTimeout(() => setStatus('Ready'), 2000)
    } catch (err) {
      console.error('❌ Export failed:', err)
      setStatus('Export failed')
    }
  }, [currentDiagram])
  
  // Import BPMN file
  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !modelerRef.current) return
    
    const reader = new FileReader()
    reader.onload = async (e) => {
      const xml = e.target?.result as string
      try {
        await modelerRef.current.importXML(xml)
        setStatus('Imported successfully')
        setCurrentDiagram(null) // Clear current diagram to create new on save
        console.log('📥 Diagram imported from file')
        
        // Fit to viewport
        const canvas = modelerRef.current.get('canvas') as any
        canvas.zoom('fit-viewport')
        
        setTimeout(() => setStatus('Ready'), 2000)
      } catch (err) {
        console.error('❌ Import failed:', err)
        setStatus('Import failed')
      }
    }
    reader.readAsText(file)
  }, [])
  
  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    const commandStack = modelerRef.current?.get('commandStack') as any
    if (commandStack?.canUndo()) {
      commandStack.undo()
      console.log('↩️ Undo')
    }
  }, [])
  
  const handleRedo = useCallback(() => {
    const commandStack = modelerRef.current?.get('commandStack') as any
    if (commandStack?.canRedo()) {
      commandStack.redo()
      console.log('↪️ Redo')
    }
  }, [])
  
  // Zoom handlers
  const handleZoom = useCallback((factor: number) => {
    const canvas = modelerRef.current?.get('canvas') as any
    if (canvas) {
      const currentZoom = canvas.zoom()
      canvas.zoom(currentZoom * factor)
      console.log(`🔍 Zoom: ${(currentZoom * factor * 100).toFixed(0)}%`)
    }
  }, [])
  
  const handleZoomFit = useCallback(() => {
    const canvas = modelerRef.current?.get('canvas') as any
    if (canvas) {
      canvas.zoom('fit-viewport')
      console.log('🔍 Zoom: Fit to viewport')
    }
  }, [])
  
  const handleToggleMinimap = useCallback(() => {
    const minimap = modelerRef.current?.get('minimap') as any
    if (minimap) {
      minimap.toggle()
      console.log('🗺️ Minimap toggled')
    }
  }, [])
  
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 bg-white border-b shadow-sm">
        <div className="flex items-center gap-2">
          {/* File operations */}
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
            title="Save diagram (Ctrl+S)"
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
          
          <div className="w-px h-6 bg-gray-300 mx-2" />
          
          <button 
            onClick={handleToggleMinimap}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Toggle minimap"
          >
            <Map className="w-4 h-4" />
          </button>
        </div>
        
        {/* Status */}
        <div className="flex items-center gap-4">
          {currentDiagram && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">{currentDiagram.name}</span>
            </div>
          )}
          <div className="text-sm text-gray-600">
            Status: <span className={`font-medium ${
              status === 'Ready' ? 'text-green-600' : 
              status.includes('failed') ? 'text-red-600' : 
              'text-blue-600'
            }`}>{status}</span>
          </div>
          {error && (
            <div className="text-sm text-red-600">
              {error}
            </div>
          )}
        </div>
      </div>
      
      {/* BPMN Canvas */}
      <div 
        ref={containerRef} 
        className="flex-1 bg-white"
        style={{ height: 'calc(100vh - 60px)' }}
      />
    </div>
  )
}