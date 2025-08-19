'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { BpmnDesigner } from '@/lib/bpmn/core/BpmnDesigner'
import { BpmnBackendAdapter, DiagramData } from '@/lib/bpmn/BpmnBackendAdapter'
import { useRouter } from 'next/navigation'
import { Save, Download, Upload, Undo, Redo, ZoomIn, ZoomOut, Map, Grid, Palette } from 'lucide-react'

interface Props {
  diagramId?: string
  projectId?: string
}

export function BpmnStudioIntegrated({ diagramId, projectId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [designer, setDesigner] = useState<BpmnDesigner | null>(null)
  const [adapter] = useState(() => new BpmnBackendAdapter())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentDiagram, setCurrentDiagram] = useState<DiagramData | null>(null)
  const [status, setStatus] = useState('Initializing...')
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const router = useRouter()

  // Initialize designer with proper bpmn-js and diagram-js integration
  useEffect(() => {
    const initDesigner = async () => {
      if (!containerRef.current) return

      try {
        setStatus('Loading diagram...')
        
        // Load diagram if ID provided
        let initialXml: string | undefined = undefined
        if (diagramId) {
          const diagram = await adapter.loadDiagram(diagramId)
          setCurrentDiagram(diagram)
          initialXml = diagram.bpmn_xml
        }

        // Create BPMN designer with full diagram-js integration
        const bpmnDesigner = new BpmnDesigner({
          container: containerRef.current,
          value: initialXml,
          valueType: 'bpmn',
          theme: theme,
          gridLine: {
            smallGridSpacing: 20,
            gridSpacing: 100,
            gridLineStroke: 1,
            gridLineOpacity: 0.2,
            gridLineColor: '#e0e0e0'
          },
          keyboard: true,
          height: 100, // Full height
          onCreated: (modeler) => {
            console.log('BPMN Modeler created', modeler)
            setStatus('Ready')
            
            // Setup command stack listeners for undo/redo
            const commandStack = modeler.get('commandStack') as any
            const updateButtons = () => {
              setCanUndo(commandStack.canUndo())
              setCanRedo(commandStack.canRedo())
            }
            commandStack.on('changed', updateButtons)
            updateButtons()
          },
          onChange: async (getValue) => {
            // Auto-save with debouncing (handled by SaveManager in BpmnDesigner)
            if (currentDiagram?.id) {
              try {
                const xml = await getValue('xml')
                await adapter.autoSaveDiagram(
                  currentDiagram.id,
                  xml as string,
                  currentDiagram.name,
                  5000 // 5 second delay
                )
                setStatus('Changes detected')
              } catch (error) {
                console.error('Auto-save error:', error)
              }
            }
          },
          onXmlError: (error) => {
            console.error('XML Error:', error)
            setStatus('Error in diagram')
          }
        })

        setDesigner(bpmnDesigner)
        setLoading(false)
      } catch (error) {
        console.error('Failed to initialize designer:', error)
        setStatus('Failed to load')
        setLoading(false)
      }
    }

    initDesigner()

    return () => {
      if (designer) {
        designer.destroy()
      }
      adapter.cleanup()
    }
  }, []) // Only run once on mount

  // Save handler
  const handleSave = useCallback(async () => {
    if (!designer) return

    setSaving(true)
    setStatus('Saving...')
    
    try {
      const xml = await designer.getXml()
      const name = currentDiagram?.name || `Diagram ${new Date().toLocaleString()}`

      const result = await adapter.saveDiagram({
        id: currentDiagram?.id,
        name,
        bpmn_xml: xml,
        project_id: projectId
      })

      if (!currentDiagram) {
        setCurrentDiagram(result)
        // Update URL to include diagram ID
        router.replace(`/studio?diagram=${result.id}`)
      }

      setStatus('Saved successfully')
      setTimeout(() => setStatus('Ready'), 2000)
    } catch (error) {
      console.error('Save failed:', error)
      setStatus('Save failed')
    } finally {
      setSaving(false)
    }
  }, [designer, currentDiagram, projectId, adapter, router])

  // Export handler
  const handleExport = useCallback(async () => {
    if (!designer) return

    try {
      const xml = await designer.getXml()
      const blob = new Blob([xml], { type: 'text/xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${currentDiagram?.name || 'diagram'}-${Date.now()}.bpmn`
      a.click()
      URL.revokeObjectURL(url)
      setStatus('Exported')
    } catch (error) {
      console.error('Export failed:', error)
      setStatus('Export failed')
    }
  }, [designer, currentDiagram])

  // Import handler
  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !designer) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      const xml = e.target?.result as string
      try {
        designer.setValue(xml)
        setStatus('Imported successfully')
        
        // Clear current diagram to create new one on save
        setCurrentDiagram(null)
      } catch (error) {
        console.error('Import failed:', error)
        setStatus('Import failed')
      }
    }
    reader.readAsText(file)
  }, [designer])

  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    const commandStack = designer?.getCommandStack() as any
    if (commandStack?.canUndo()) {
      commandStack.undo()
    }
  }, [designer])

  const handleRedo = useCallback(() => {
    const commandStack = designer?.getCommandStack() as any
    if (commandStack?.canRedo()) {
      commandStack.redo()
    }
  }, [designer])

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    const canvas = designer?.getCanvas() as any
    if (canvas) {
      const currentZoom = canvas.zoom()
      canvas.zoom(currentZoom * 1.1)
    }
  }, [designer])

  const handleZoomOut = useCallback(() => {
    const canvas = designer?.getCanvas() as any
    if (canvas) {
      const currentZoom = canvas.zoom()
      canvas.zoom(currentZoom * 0.9)
    }
  }, [designer])

  const handleZoomFit = useCallback(() => {
    const canvas = designer?.getCanvas() as any
    if (canvas) {
      canvas.zoom('fit-viewport')
    }
  }, [designer])

  // Toggle minimap
  const handleToggleMinimap = useCallback(() => {
    designer?.toggleMinimap()
  }, [designer])

  // Toggle theme
  const handleToggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    designer?.changeTheme(newTheme)
  }, [designer, theme])

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

          {/* View controls */}
          <button
            onClick={handleZoomOut}
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
            onClick={handleZoomIn}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-2" />

          {/* Additional controls */}
          <button
            onClick={handleToggleMinimap}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Toggle minimap"
          >
            <Map className="w-4 h-4" />
          </button>

          <button
            onClick={handleToggleTheme}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>

        {/* Status and diagram info */}
        <div className="flex items-center gap-4">
          {currentDiagram && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">{currentDiagram.name}</span>
              {currentDiagram.version && (
                <span className="ml-2 text-gray-400">v{currentDiagram.version}</span>
              )}
            </div>
          )}
          <div className="text-sm text-gray-600">
            Status: <span className="font-medium">{status}</span>
          </div>
        </div>
      </div>

      {/* BPMN Canvas - This is where diagram-js and bpmn-js render */}
      <div 
        ref={containerRef} 
        className="flex-1 bg-white"
        style={{ height: 'calc(100vh - 60px)' }}
      />
    </div>
  )
}