'use client'

import { useEffect, useRef, useState } from 'react'
import { BpmnToolbar } from './bpmn-toolbar'
import { BpmnElementsPalette } from './bpmn-elements-palette'
import { createClient } from '@/lib/auth/client'
import { useRouter } from 'next/navigation'

// Core BPMN Designer from working studio
import { BpmnDesigner } from '@/lib/bpmn/core/BpmnDesigner'

interface Props {
  diagramId?: string
  projectId?: string
}

export function BpmnStudioFinalFixed({ diagramId, projectId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [designer, setDesigner] = useState<BpmnDesigner | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentDiagram, setCurrentDiagram] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    const initializeStudio = async () => {
      if (!containerRef.current) return

      try {
        console.log('Initializing BPMN Studio...')
        
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
          theme: 'light',
          gridLine: true,
          keyboard: true,
          height: 100,
          onCreated: (modeler) => {
            console.log('BPMN Modeler created')
            
            // Setup command stack listeners safely
            try {
              const commandStack = modeler.get('commandStack')
              if (commandStack) {
                // Check if it has the methods we need
                if (typeof commandStack.canUndo === 'function') {
                  setCanUndo(commandStack.canUndo())
                }
                if (typeof commandStack.canRedo === 'function') {
                  setCanRedo(commandStack.canRedo())
                }
                
                // Setup change listener if available
                if (commandStack.on && typeof commandStack.on === 'function') {
                  commandStack.on('changed', () => {
                    setCanUndo(commandStack.canUndo())
                    setCanRedo(commandStack.canRedo())
                  })
                } else if (commandStack._eventBus && commandStack._eventBus.on) {
                  // Alternative: use event bus
                  commandStack._eventBus.on('commandStack.changed', () => {
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
          },
          onChange: (getValue) => {
            console.log('Diagram changed')
          },
          onXmlError: (error) => {
            console.error('XML Error:', error)
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
        console.log('Saved to localStorage')
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

      console.log('Saved to database')
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

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !designer) return

    try {
      const text = await file.text()
      designer.setValue(text)
      setCurrentDiagram(null)
    } catch (error) {
      console.error('Import failed:', error)
    }
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
        canvas.zoom(currentZoom * 1.1)
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
        canvas.zoom(currentZoom * 0.9)
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
      designer?.changeTheme()
    } catch (err) {
      console.warn('Theme toggle failed:', err)
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
      {/* Toolbar */}
      <BpmnToolbar
        onSave={handleSave}
        onExport={handleExport}
        onImport={() => {
          const fileInput = document.getElementById('file-import') as HTMLInputElement
          fileInput?.click()
        }}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitToViewport={handleZoomReset}
        onToggleMinimap={handleToggleMinimap}
        onToggleTheme={handleThemeToggle}
        disabled={saving}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Palette */}
        <BpmnElementsPalette />

        {/* Canvas */}
        <div className="flex-1 relative">
          <div 
            ref={containerRef}
            className="w-full h-full"
            style={{ height: '100%' }}
          />
          {/* Hidden file input for import */}
          <input 
            type="file" 
            accept=".xml,.bpmn,.yaml,.yml,.json" 
            style={{ display: 'none' }} 
            id="file-import"
            onChange={handleImport}
          />
        </div>
      </div>
    </div>
  )
}