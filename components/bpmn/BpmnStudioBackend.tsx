'use client'

import { useEffect, useRef, useState } from 'react'
import BpmnModeler from 'bpmn-js/lib/Modeler'
import { BpmnToolbar } from './bpmn-toolbar'
import { BpmnElementsPalette } from './bpmn-elements-palette'
import { useRouter } from 'next/navigation'
import { fixBpmnHitAreas, applyGlobalHitAreaFixes } from '@/lib/bpmn-hit-area-fix'
import { bpmnApi } from '@/lib/bpmn/api-client'

// Import BPMN.js CSS
import 'bpmn-js/dist/assets/diagram-js.css'
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css'
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-codes.css'
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css'

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

/**
 * BPMN Studio with Backend API Integration
 * Uses core routing backend instead of direct Supabase
 * Maintains exact same UI and functionality
 */
export function BpmnStudioBackend({ diagramId, projectId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const modelerRef = useRef<BpmnModeler | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [loading, setLoading] = useState(true)
  const [currentDiagram, setCurrentDiagram] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [zoomLevel, setZoomLevel] = useState(100)
  const [authenticated, setAuthenticated] = useState(true)
  
  const router = useRouter()

  // Initialize BPMN Modeler
  useEffect(() => {
    // Apply global hit area fixes on mount
    applyGlobalHitAreaFixes()
    
    const initializeModeler = async () => {
      if (!containerRef.current) {
        console.log('Container not ready, waiting...')
        return
      }

      try {
        console.log('Starting BPMN modeler initialization...')
        
        // Load diagram from backend if ID provided
        let initialXml = DEFAULT_BPMN
        if (diagramId) {
          console.log('Loading diagram from backend:', diagramId)
          try {
            const diagram = await bpmnApi.getDiagram(diagramId)
            setCurrentDiagram(diagram)
            initialXml = diagram.bpmn_xml || DEFAULT_BPMN
          } catch (error: any) {
            if (error.message.includes('401')) {
              setAuthenticated(false)
            }
            console.error('Failed to load diagram:', error)
          }
        }

        // Create modeler
        console.log('Creating BPMN modeler...')
        const modeler = new BpmnModeler({
          container: containerRef.current,
          keyboard: {
            bindTo: window
          }
        })
        
        modelerRef.current = modeler

        // Import initial XML
        console.log('Importing XML...')
        await modeler.importXML(initialXml)
        
        // Apply hit area fixes to the modeler
        fixBpmnHitAreas(modeler)
        
        // Setup command stack listeners
        const commandStack = modeler.get('commandStack') as any
        const eventBus = modeler.get('eventBus') as any
        
        const updateButtons = () => {
          setCanUndo(commandStack.canUndo())
          setCanRedo(commandStack.canRedo())
        }
        
        eventBus.on('commandStack.changed', updateButtons)
        updateButtons()
        
        console.log('BPMN modeler initialized successfully')
        setLoading(false)
      } catch (error) {
        console.error('Failed to initialize BPMN modeler:', error)
        setLoading(false)
      }
    }

    // Small delay to ensure container is ready
    setTimeout(initializeModeler, 100)

    return () => {
      if (modelerRef.current) {
        modelerRef.current.destroy()
      }
    }
  }, [diagramId])

  // Handlers - Using Backend API
  const handleSave = async () => {
    if (!modelerRef.current) return

    setSaving(true)
    try {
      const { xml } = await modelerRef.current.saveXML({ format: true })
      
      if (!authenticated) {
        // Fallback to localStorage if not authenticated
        localStorage.setItem('bpmn-diagram', xml || '')
        console.log('Saved to localStorage (not authenticated)')
        setSaving(false)
        return
      }

      try {
        // Save via backend API
        const savedDiagram = await bpmnApi.saveDiagram({
          id: currentDiagram?.id,
          name: currentDiagram?.name || `Diagram ${new Date().toLocaleString()}`,
          bpmn_xml: xml || '',
          project_id: projectId
        })
        
        setCurrentDiagram(savedDiagram)
        
        // Update URL if new diagram
        if (!currentDiagram?.id && savedDiagram.id) {
          router.replace(`/studio?diagram=${savedDiagram.id}`)
        }
        
        console.log('Saved via backend API')
      } catch (error: any) {
        if (error.message.includes('401')) {
          setAuthenticated(false)
          // Fallback to localStorage
          localStorage.setItem('bpmn-diagram', xml || '')
          console.log('Saved to localStorage (auth failed)')
        } else {
          throw error
        }
      }
    } catch (error) {
      console.error('Save failed:', error)
      alert('Failed to save diagram')
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
      a.download = `${currentDiagram?.name || 'diagram'}-${Date.now()}.bpmn`
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
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Full Toolbar - UNCHANGED */}
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

      {/* Main Content Area - UNCHANGED */}
      <div className="flex-1 flex overflow-hidden">
        {/* Palette - UNCHANGED */}
        <BpmnElementsPalette />

        {/* Canvas Container - UNCHANGED */}
        <div className="flex-1 relative bg-gray-50 dark:bg-gray-900">
          <div 
            ref={containerRef}
            className="w-full h-full"
            style={{ height: '100%' }}
          />
        </div>
      </div>

      {/* Hidden file input - UNCHANGED */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".bpmn,.xml"
        onChange={handleImport}
        className="hidden"
      />
      
      {/* Auth status indicator (subtle) */}
      {!authenticated && (
        <div className="absolute bottom-4 right-4 text-xs text-gray-500">
          Working offline
        </div>
      )}
    </div>
  )
}