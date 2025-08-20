'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/auth/client'
import { useRouter } from 'next/navigation'
import { BpmnDesigner } from '@/lib/bpmn/core/BpmnDesigner'
import { 
  Save, Download, Upload, Undo, Redo, ZoomIn, ZoomOut, Map,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal,
  Sun, Moon, Eraser
} from 'lucide-react'

interface Props {
  diagramId?: string
  projectId?: string
}

export function BpmnStudioNoSSR({ diagramId, projectId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [designer, setDesigner] = useState<BpmnDesigner | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentDiagram, setCurrentDiagram] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [zoomLevel, setZoomLevel] = useState(100)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    const initializeStudio = async () => {
      if (!containerRef.current) return

      try {
        // Load diagram from database if ID provided
        let initialXml: string | undefined = undefined
        if (diagramId) {
          const { data, error } = await supabase
            .from('diagrams')
            .select('*')
            .eq('id', diagramId)
            .single()

          if (!error && data) {
            setCurrentDiagram(data)
            initialXml = data.bpmn_xml
          }
        }

        // Create BPMN Designer instance
        const bpmnDesigner = new BpmnDesigner({
          container: containerRef.current,
          value: initialXml,
          valueType: 'bpmn',
          theme: theme,
          gridLine: true,
          keyboard: true,
          height: 100,
          onCreated: (modeler) => {
            try {
              const commandStack = modeler.get('commandStack')
              if (commandStack) {
                if (typeof commandStack.canUndo === 'function') {
                  setCanUndo(commandStack.canUndo())
                }
                if (typeof commandStack.canRedo === 'function') {
                  setCanRedo(commandStack.canRedo())
                }
                
                const eventBus = modeler.get('eventBus')
                if (eventBus && eventBus.on) {
                  eventBus.on('commandStack.changed', () => {
                    setCanUndo(commandStack.canUndo())
                    setCanRedo(commandStack.canRedo())
                  })
                }
              }
            } catch (err) {
              console.warn('Could not setup command stack listeners:', err)
            }
            
            if (mounted) {
              setDesigner(bpmnDesigner)
              setLoading(false)
            }
          }
        })
      } catch (error) {
        console.error('Failed to initialize studio:', error)
        setLoading(false)
      }
    }

    initializeStudio()

    return () => {
      mounted = false
      if (designer) {
        designer.destroy()
      }
    }
  }, [])

  const handleSave = async () => {
    if (!designer) return

    setSaving(true)
    try {
      const xml = await designer.getXml()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        localStorage.setItem('bpmn-diagram', xml)
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
    if (!designer) return
    try {
      const xml = await designer.getXml()
      const blob = new Blob([xml], { type: 'text/xml' })
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
    if (!file || !designer) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      const xml = e.target?.result as string
      try {
        designer.setValue(xml)
        setCurrentDiagram(null)
      } catch (error) {
        console.error('Import failed:', error)
      }
    }
    reader.readAsText(file)
  }

  const handleUndo = () => {
    try {
      const commandStack = designer?.getCommandStack() as any
      if (commandStack && typeof commandStack.undo === 'function') {
        commandStack.undo()
      }
    } catch (err) {
      console.warn('Undo failed:', err)
    }
  }

  const handleRedo = () => {
    try {
      const commandStack = designer?.getCommandStack() as any
      if (commandStack && typeof commandStack.redo === 'function') {
        commandStack.redo()
      }
    } catch (err) {
      console.warn('Redo failed:', err)
    }
  }

  const handleZoomIn = () => {
    try {
      const canvas = designer?.getCanvas() as any
      if (canvas && typeof canvas.zoom === 'function') {
        const currentZoom = canvas.zoom()
        const newZoom = Math.min(currentZoom * 1.1, 4)
        canvas.zoom(newZoom)
        setZoomLevel(Math.round(newZoom * 100))
      }
    } catch (err) {
      console.warn('Zoom in failed:', err)
    }
  }

  const handleZoomOut = () => {
    try {
      const canvas = designer?.getCanvas() as any
      if (canvas && typeof canvas.zoom === 'function') {
        const currentZoom = canvas.zoom()
        const newZoom = Math.max(currentZoom * 0.9, 0.2)
        canvas.zoom(newZoom)
        setZoomLevel(Math.round(newZoom * 100))
      }
    } catch (err) {
      console.warn('Zoom out failed:', err)
    }
  }

  const handleZoomReset = () => {
    try {
      const canvas = designer?.getCanvas() as any
      if (canvas && typeof canvas.zoom === 'function') {
        canvas.zoom('fit-viewport')
        setZoomLevel(100)
      }
    } catch (err) {
      console.warn('Zoom reset failed:', err)
    }
  }

  const handleToggleMinimap = () => {
    try {
      designer?.toggleMinimap()
    } catch (err) {
      console.warn('Toggle minimap failed:', err)
    }
  }

  const handleThemeToggle = () => {
    try {
      const newTheme = theme === 'light' ? 'dark' : 'light'
      setTheme(newTheme)
      designer?.changeTheme(newTheme)
    } catch (err) {
      console.warn('Theme toggle failed:', err)
    }
  }

  const handleClear = () => {
    try {
      designer?.clear()
    } catch (err) {
      console.warn('Clear failed:', err)
    }
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
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Simple Toolbar without hydration issues */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white border-b">
        {/* File Operations */}
        <div className="flex items-center gap-1 border border-gray-200 rounded p-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50"
            title="Save"
          >
            <Save className="h-4 w-4" />
          </button>
          <button
            onClick={handleExport}
            className="p-1.5 rounded hover:bg-gray-100"
            title="Export"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded hover:bg-gray-100"
            title="Import"
          >
            <Upload className="h-4 w-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".bpmn,.xml"
            onChange={handleImport}
            className="hidden"
          />
        </div>

        {/* Edit Operations */}
        <div className="flex items-center gap-1 border border-gray-200 rounded p-1">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50"
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50"
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </button>
          <button
            onClick={handleClear}
            className="p-1.5 rounded hover:bg-gray-100"
            title="Clear"
          >
            <Eraser className="h-4 w-4" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 border border-gray-200 rounded p-1">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded hover:bg-gray-100"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={handleZoomReset}
            className="px-2 py-1 text-sm rounded hover:bg-gray-100"
            title="Fit to viewport"
          >
            {zoomLevel}%
          </button>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded hover:bg-gray-100"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={handleToggleMinimap}
            className="p-1.5 rounded hover:bg-gray-100"
            title="Toggle Minimap"
          >
            <Map className="h-4 w-4" />
          </button>
        </div>

        {/* Theme Toggle - Fixed to avoid hydration issues */}
        <div className="flex items-center gap-1 border border-gray-200 rounded p-1">
          <button
            onClick={handleThemeToggle}
            className="p-1.5 rounded hover:bg-gray-100"
            title="Toggle Theme"
          >
            {theme === 'light' && <Sun className="h-4 w-4" />}
            {theme === 'dark' && <Moon className="h-4 w-4" />}
          </button>
        </div>

        {/* Status */}
        <div className="ml-auto text-sm text-gray-600">
          {currentDiagram && <span className="mr-2">{currentDiagram.name}</span>}
          {saving && <span>Saving...</span>}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <div 
          ref={containerRef}
          className="w-full h-full"
          style={{ height: '100%' }}
        />
      </div>
    </div>
  )
}