'use client'

import { useEffect, useRef, useState } from 'react'
import BpmnModeler from 'bpmn-js/lib/Modeler'
import { BpmnToolbar } from './bpmn-toolbar'
import { BpmnElementsPalette } from './bpmn-elements-palette'
import { createClient } from '@/lib/auth/client'
import { useRouter } from 'next/navigation'
import { fixBpmnHitAreas, applyGlobalHitAreaFixes } from '@/lib/bpmn-hit-area-fix'

// CSS imports are in globals.css - DO NOT import here to avoid conflicts

interface Props {
  diagramId?: string
  projectId?: string
}

const DEFAULT_BPMN = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd" id="sample-diagram" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn2:process id="Process_1" isExecutable="false">
    <bpmn2:startEvent id="StartEvent_1"/>
  </bpmn2:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds height="36.0" width="36.0" x="412.0" y="240.0"/>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>`

export function BpmnStudioComplete({ diagramId, projectId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const modelerRef = useRef<BpmnModeler | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentDiagram, setCurrentDiagram] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [zoomLevel, setZoomLevel] = useState(100)
  
  const supabase = createClient()
  const router = useRouter()

  // Initialize BPMN Modeler
  useEffect(() => {
    let mounted = true
    let modeler: BpmnModeler | null = null
    
    const initializeModeler = async () => {
      // Wait for container to be ready
      const container = containerRef.current
      if (!container) {
        console.log('Container not ready yet...')
        if (mounted) {
          setTimeout(initializeModeler, 100)
        }
        return
      }

      try {
        console.log('BPMN Studio initialization starting...')
        console.log('Container element:', container)
        console.log('Container dimensions:', container.offsetWidth, 'x', container.offsetHeight)
        
        // Ensure container has dimensions
        if (container.offsetWidth === 0 || container.offsetHeight === 0) {
          console.log('Container has no dimensions, waiting...')
          if (mounted) {
            setTimeout(initializeModeler, 100)
          }
          return
        }
        
        // Apply global hit area fixes
        applyGlobalHitAreaFixes()
        
        // Load diagram from database if ID provided
        let initialXml = DEFAULT_BPMN
        if (diagramId) {
          console.log('Loading diagram from database:', diagramId)
          const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', diagramId)
            .single()

          if (!error && data) {
            console.log('Loaded project data:', data)
            setCurrentDiagram(data)
            initialXml = data.bpmn_xml || DEFAULT_BPMN
          } else if (error) {
            console.log('No project found or error:', error)
          }
        }

        // Create modeler
        console.log('Creating BPMN modeler with container:', container)
        modeler = new BpmnModeler({
          container: container,
          keyboard: {
            bindTo: window
          }
        })
        
        if (!mounted) {
          modeler.destroy()
          return
        }
        
        modelerRef.current = modeler

        // Import initial XML
        console.log('Importing BPMN XML...')
        await modeler.importXML(initialXml)
        
        // Apply hit area fixes to the modeler
        fixBpmnHitAreas(modeler)
        
        // Setup command stack listeners
        const commandStack = modeler.get('commandStack') as any
        const eventBus = modeler.get('eventBus') as any
        
        const updateButtons = () => {
          if (mounted) {
            setCanUndo(commandStack.canUndo())
            setCanRedo(commandStack.canRedo())
          }
        }
        
        eventBus.on('commandStack.changed', updateButtons)
        updateButtons()
        
        console.log('✅ BPMN Studio initialized successfully!')
        if (mounted) {
          setLoading(false)
          setError(null)
        }
      } catch (error) {
        console.error('❌ Failed to initialize BPMN modeler:', error)
        if (mounted) {
          setError(error instanceof Error ? error.message : 'Failed to initialize BPMN Studio')
          setLoading(false)
        }
      }
    }

    // Start initialization
    initializeModeler()

    return () => {
      mounted = false
      if (modeler) {
        modeler.destroy()
      }
    }
  }, [diagramId])

  // Handlers
  const handleSave = async () => {
    if (!modelerRef.current) return

    setSaving(true)
    try {
      const { xml } = await modelerRef.current.saveXML({ format: true })
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        localStorage.setItem('bpmn-diagram', xml || '')
        setSaving(false)
        return
      }

      if (currentDiagram?.id) {
        await supabase
          .from('diagrams')
          .update({
            bpmn_xml: xml,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentDiagram.id)
      } else {
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

        if (!error && data) {
          setCurrentDiagram(data)
          router.replace(`/studio?diagram=${data.id}`)
        }
      }
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setSaving(false)
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
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !modelerRef.current) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      const xml = e.target?.result as string
      try {
        await modelerRef.current?.importXML(xml)
        setCurrentDiagram(null)
      } catch (error) {
        console.error('Import failed:', error)
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

  const handleZoomIn = () => {
    const canvas = modelerRef.current?.get('canvas') as any
    const currentZoom = canvas.zoom()
    const newZoom = Math.min(currentZoom * 1.1, 4)
    canvas.zoom(newZoom)
    setZoomLevel(Math.round(newZoom * 100))
  }

  const handleZoomOut = () => {
    const canvas = modelerRef.current?.get('canvas') as any
    const currentZoom = canvas.zoom()
    const newZoom = Math.max(currentZoom * 0.9, 0.2)
    canvas.zoom(newZoom)
    setZoomLevel(Math.round(newZoom * 100))
  }

  const handleZoomReset = () => {
    const canvas = modelerRef.current?.get('canvas') as any
    canvas.zoom('fit-viewport')
    setZoomLevel(100)
  }

  const handleClear = () => {
    if (modelerRef.current) {
      modelerRef.current.importXML(DEFAULT_BPMN)
    }
  }

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.classList.toggle('dark')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading BPMN Studio...</p>
          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
              Error: {error}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load BPMN Studio</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Full Toolbar from working studio */}
      <BpmnToolbar
        onSave={handleSave}
        onExport={handleExport}
        onImport={() => fileInputRef.current?.click()}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitToViewport={handleZoomReset}
        onClear={handleClear}
        onToggleTheme={handleThemeToggle}
        theme={theme}
        zoomLevel={zoomLevel}
        canUndo={canUndo}
        canRedo={canRedo}
        disabled={saving}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Palette from working studio */}
        <BpmnElementsPalette />

        {/* Canvas Container */}
        <div className="flex-1 relative bg-gray-50 dark:bg-gray-900">
          <div 
            ref={containerRef}
            className="w-full h-full"
            style={{ 
              height: '100%',
              minHeight: '500px',
              position: 'relative'
            }}
          />
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".bpmn,.xml"
        onChange={handleImport}
        className="hidden"
      />
    </div>
  )
}