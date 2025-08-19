'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Presentation, MousePointer2 } from 'lucide-react'
import { BpmnToolbar } from './bpmn-toolbar'
import { BpmnCanvas } from './bpmn-canvas'
import { BpmnElementsPalette } from './bpmn-elements-palette'
import { BpmnPreviewModal } from './bpmn-preview-modal'
import { BpmnDesigner } from '@/lib/bpmn-designer'
import { useTheme } from '@/components/theme-provider'

export function BpmnStudio() {
  const [designer, setDesigner] = useState<BpmnDesigner | null>(null)
  const [zoomLevel, setZoomLevel] = useState(100)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewXml, setPreviewXml] = useState('')
  const [isMeetingMode, setIsMeetingMode] = useState(false)
  const [isMinimapOpen, setIsMinimapOpen] = useState(false)
  const [activeTool, setActiveTool] = useState<string>('hand')
  const { theme, toggleTheme } = useTheme()
  const paletteRef = useRef<HTMLDivElement>(null)

  const handleDesignerReady = useCallback((designerInstance: BpmnDesigner) => {
    setDesigner(designerInstance)
    
    // Set the correct theme for the designer
    designerInstance.changeTheme(theme)
    
    // Setup command stack listeners for undo/redo state
    const commandStack = designerInstance.getCommandStack() as any
    const updateHistoryState = () => {
      setCanUndo(commandStack.canUndo())
      setCanRedo(commandStack.canRedo())
    }
    commandStack.on('changed', updateHistoryState)
    
    console.log('BPMN Designer ready with custom palette provider')
  }, [theme])

  // Handle custom palette interactions - SUPPORT WORKING PALETTE ACTION NAMES
  const handlePaletteAction = useCallback((action: string, event?: Event | DragEvent) => {
    console.log('handlePaletteAction called:', action, event?.type)
    
    const customPalette = (window as any).__customPaletteProvider
    if (!customPalette) {
      console.warn('Custom palette provider not found')
      return
    }

    try {
      // Handle tool actions - support both short and long action names like working palette
      if (action === 'hand-tool' || action === 'hand') {
        customPalette.activateHandTool(event)
        setActiveTool('hand')
      } else if (action === 'lasso-tool' || action === 'lasso') {
        customPalette.activateLassoTool(event)
        setActiveTool('lasso')
      } else if (action === 'space-tool' || action === 'space') {
        customPalette.activateSpaceTool(event)
        setActiveTool('space')
      } else if (action === 'global-connect-tool' || action === 'global-connect') {
        customPalette.activateGlobalConnect(event)
        setActiveTool('global-connect')
      } else {
        // Handle element creation - ensure we have a valid event
        if (!event) {
          // Create a synthetic event if none provided
          const canvas = document.querySelector('.djs-container')
          if (canvas) {
            const rect = canvas.getBoundingClientRect()
            event = new MouseEvent('click', {
              clientX: rect.left + rect.width / 2,
              clientY: rect.top + rect.height / 2,
              bubbles: true,
              cancelable: true
            })
          }
        }
        
        // Use createElement method which handles all element types
        customPalette.createElement(action, event)
        // Reset to hand tool after creating element
        setActiveTool('hand')
      }
    } catch (error) {
      console.error('Error handling palette action:', action, error)
    }
  }, [])

  // Setup event listeners for our custom palette with proper drag visualization
  useEffect(() => {
    if (!paletteRef.current || !designer) return

    const paletteContainer = paletteRef.current
    const paletteEntries = paletteContainer.querySelectorAll('.bpmn-entry')
    
    const eventListeners: Array<{ element: Element; event: string; handler: (e: Event) => void }> = []

    paletteEntries.forEach((entry) => {
      const element = entry as HTMLElement
      const action = element.getAttribute('data-action')
      
      if (!action) return

      const isDraggable = element.getAttribute('draggable') === 'true'
      const isToolAction = ['hand-tool', 'lasso-tool', 'space-tool', 'global-connect-tool', 'hand', 'lasso', 'space', 'global-connect'].includes(action)

      if (isToolAction) {
        // Tools use click
        const clickHandler = (event: Event) => {
          event.preventDefault()
          handlePaletteAction(action, event)
        }
        element.addEventListener('click', clickHandler)
        eventListeners.push({ element, event: 'click', handler: clickHandler })
      } else if (isDraggable) {
        // For elements, use mousedown to trigger bpmn-js create mode
        const mouseDownHandler = (event: Event) => {
          const mouseEvent = event as MouseEvent
          // Don't prevent default - let bpmn-js handle it
          event.stopPropagation()
          
          // Call the palette action which will trigger bpmn-js create.start
          handlePaletteAction(action, mouseEvent)
        }
        
        const touchStartHandler = (event: Event) => {
          event.preventDefault()
          const touchEvent = event as TouchEvent
          const touch = touchEvent.touches[0]
          const simulatedEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY,
            bubbles: true
          })
          handlePaletteAction(action, simulatedEvent)
        }

        // Use mousedown like the default bpmn-js palette
        element.addEventListener('mousedown', mouseDownHandler)
        element.addEventListener('touchstart', touchStartHandler, { passive: false })
        
        eventListeners.push({ element, event: 'mousedown', handler: mouseDownHandler })
        eventListeners.push({ element, event: 'touchstart', handler: touchStartHandler })
      }
    })

    // Cleanup function
    return () => {
      eventListeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler)
      })
    }
  }, [designer, handlePaletteAction])


  const handleSave = useCallback(async () => {
    if (!designer) return
    try {
      const xml = await designer.getXml()
      // In a real app, this would save to backend
      localStorage.setItem('bpmn-diagram', xml)
      console.log('Diagram saved')
    } catch (error) {
      console.error('Save failed:', error)
    }
  }, [designer])

  const handleOpenFolder = useCallback(() => {
    // Trigger the file input from toolbar
    const fileInput = document.getElementById('file-import') as HTMLInputElement
    fileInput?.click()
  }, [])

  const handlePreview = useCallback(async () => {
    if (!designer) return
    try {
      const xml = await designer.getXml()
      setPreviewXml(xml)
      setShowPreview(true)
    } catch (error) {
      console.error('Failed to get XML for preview:', error)
    }
  }, [designer])

  const handleRun = useCallback(() => {
    // Execute/simulate the BPMN process
    console.log('Run process')
  }, [])

  const handleImport = useCallback(() => {
    // Check if triggered from toolbar's file input
    const toolbarInput = document.getElementById('file-import') as HTMLInputElement
    if (toolbarInput?.files?.[0]) {
      const file = toolbarInput.files[0]
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        designer?.setValue(content)
      }
      reader.readAsText(file)
    } else {
      // Fallback: create new input if not from toolbar
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.bpmn,.xml,.yaml,.yml,.json'
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          const reader = new FileReader()
          reader.onload = (event) => {
            const content = event.target?.result as string
            designer?.setValue(content)
          }
          reader.readAsText(file)
        }
      }
      input.click()
    }
  }, [designer])

  const handleExport = useCallback(async () => {
    if (!designer) return
    
    try {
      const xml = await designer.getXml()
      const blob = new Blob([xml], { type: 'application/xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'process.bpmn'
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }, [designer])

  const handleUndo = useCallback(() => {
    if (designer) {
      const commandStack = designer.getCommandStack() as any
      commandStack.undo()
    }
  }, [designer])

  const handleRedo = useCallback(() => {
    if (designer) {
      const commandStack = designer.getCommandStack() as any
      commandStack.redo()
    }
  }, [designer])

  const handleZoomIn = useCallback(() => {
    if (designer) {
      const canvas = designer.getCanvas() as any
      const currentZoom = canvas.zoom()
      const newZoom = Math.min(currentZoom * 1.2, 5) // Max 500%
      canvas.zoom(newZoom)
      setZoomLevel(Math.round(newZoom * 100))
    }
  }, [designer])

  const handleZoomOut = useCallback(() => {
    if (designer) {
      const canvas = designer.getCanvas() as any
      const currentZoom = canvas.zoom()
      const newZoom = Math.max(currentZoom / 1.2, 0.2) // Min 20%
      canvas.zoom(newZoom)
      setZoomLevel(Math.round(newZoom * 100))
    }
  }, [designer])

  const handleFitToViewport = useCallback(() => {
    if (designer) {
      const canvas = designer.getCanvas() as any
      canvas.zoom('fit-viewport')
      setZoomLevel(Math.round(canvas.zoom() * 100))
    }
  }, [designer])

  const handleClear = useCallback(() => {
    if (designer) {
      if (confirm('Are you sure you want to clear the entire diagram?')) {
        designer.clear()
      }
    }
  }, [designer])

  // Alignment handlers - custom implementation since BPMN.js doesn't have built-in alignment
  const alignElements = useCallback((alignment: string) => {
    if (!designer) return
    
    const modeling = designer.getModeling() as any
    const selection = designer.getSelection() as any
    const elements = selection.get()
    
    if (elements.length < 2) return
    
    // Get bounds of all selected elements
    const bounds = elements.map((el: any) => ({
      element: el,
      x: el.x || 0,
      y: el.y || 0,
      width: el.width || 100,
      height: el.height || 80
    }))
    
    let targetX: number, targetY: number
    
    switch (alignment) {
      case 'left':
        targetX = Math.min(...bounds.map((b: any) => b.x))
        bounds.forEach((b: any) => {
          if (b.x !== targetX) {
            modeling.moveElements([b.element], { x: targetX - b.x, y: 0 })
          }
        })
        break
      case 'center':
        const avgX = bounds.reduce((sum: number, b: any) => sum + b.x + b.width / 2, 0) / bounds.length
        bounds.forEach((b: any) => {
          const centerX = b.x + b.width / 2
          if (centerX !== avgX) {
            modeling.moveElements([b.element], { x: avgX - centerX, y: 0 })
          }
        })
        break
      case 'right':
        targetX = Math.max(...bounds.map((b: any) => b.x + b.width))
        bounds.forEach((b: any) => {
          const rightX = b.x + b.width
          if (rightX !== targetX) {
            modeling.moveElements([b.element], { x: targetX - rightX, y: 0 })
          }
        })
        break
      case 'top':
        targetY = Math.min(...bounds.map((b: any) => b.y))
        bounds.forEach((b: any) => {
          if (b.y !== targetY) {
            modeling.moveElements([b.element], { x: 0, y: targetY - b.y })
          }
        })
        break
      case 'middle':
        const avgY = bounds.reduce((sum: number, b: any) => sum + b.y + b.height / 2, 0) / bounds.length
        bounds.forEach((b: any) => {
          const centerY = b.y + b.height / 2
          if (centerY !== avgY) {
            modeling.moveElements([b.element], { x: 0, y: avgY - centerY })
          }
        })
        break
      case 'bottom':
        targetY = Math.max(...bounds.map((b: any) => b.y + b.height))
        bounds.forEach((b: any) => {
          const bottomY = b.y + b.height
          if (bottomY !== targetY) {
            modeling.moveElements([b.element], { x: 0, y: targetY - bottomY })
          }
        })
        break
    }
  }, [designer])

  const handleAlignLeft = useCallback(() => alignElements('left'), [alignElements])
  const handleAlignCenter = useCallback(() => alignElements('center'), [alignElements])
  const handleAlignRight = useCallback(() => alignElements('right'), [alignElements])
  const handleAlignTop = useCallback(() => alignElements('top'), [alignElements])
  const handleAlignMiddle = useCallback(() => alignElements('middle'), [alignElements])
  const handleAlignBottom = useCallback(() => alignElements('bottom'), [alignElements])

  const handleToggleMinimap = useCallback(() => {
    designer?.toggleMinimap()
    setIsMinimapOpen(prev => !prev)
  }, [designer])

  const handleToggleLanguage = useCallback(() => {
    // Toggle between languages
    console.log('Toggle language')
  }, [])

  const handleMeetingMode = useCallback(() => {
    setIsMeetingMode(prev => !prev)
    // In meeting mode, hide all UI elements except the diagram
    // Focus purely on the BPMN diagram for presentation
  }, [])

  const handleToggleTheme = useCallback(() => {
    toggleTheme()
  }, [toggleTheme])

  // Update BPMN designer theme when global theme changes
  useEffect(() => {
    if (designer) {
      designer.changeTheme(theme)
    }
  }, [theme, designer])

  return (
    <>
      <div className="bpmn-studio-container flex flex-col h-full">
        {/* Top Toolbar - hide in meeting mode */}
        {!isMeetingMode && (
          <BpmnToolbar
            onImport={handleImport}
            onExport={handleExport}
            onSave={handleSave}
            onOpenFolder={handleOpenFolder}
            onPreview={handlePreview}
            onRun={handleRun}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFitToViewport={handleFitToViewport}
            onClear={handleClear}
            onAlignLeft={handleAlignLeft}
            onAlignCenter={handleAlignCenter}
            onAlignRight={handleAlignRight}
            onAlignTop={handleAlignTop}
            onAlignMiddle={handleAlignMiddle}
            onAlignBottom={handleAlignBottom}
            onToggleMinimap={handleToggleMinimap}
            onToggleLanguage={handleToggleLanguage}
            onToggleTheme={handleToggleTheme}
            onMeetingMode={handleMeetingMode}
            theme={theme}
            zoomLevel={zoomLevel}
            canUndo={canUndo}
            canRedo={canRedo}
            isMeetingMode={isMeetingMode}
            isMinimapOpen={isMinimapOpen}
          />
        )}
        
        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Custom Elements Palette - hide in meeting mode */}
          {!isMeetingMode && (
            <div ref={paletteRef} className="relative z-20 flex-shrink-0">
              <BpmnElementsPalette 
                onAction={handlePaletteAction}
                activeTool={activeTool}
              />
            </div>
          )}
          
          {/* BPMN Canvas - full width in meeting mode */}
          <div className="flex-1 relative overflow-hidden">
            <BpmnCanvas 
              onDesignerReady={handleDesignerReady}
              options={{
                theme,
                onChange: (callback) => {
                  const yaml = callback('yaml')
                  console.log('BPMN changed:', yaml)
                }
              }}
            />
            
            {/* Minimal meeting mode controls */}
            {isMeetingMode && (
              <div className="absolute top-4 right-4 flex gap-2 z-50">
                <button
                  onClick={handleMeetingMode}
                  className="p-2 bg-card/90 backdrop-blur rounded-lg shadow-lg hover:bg-card transition-colors"
                  title="Exit Meeting Mode"
                >
                  <Presentation className="h-5 w-5" />
                </button>
                <button
                  onClick={handleFitToViewport}
                  className="p-2 bg-card/90 backdrop-blur rounded-lg shadow-lg hover:bg-card transition-colors"
                  title="Fit to Screen"
                >
                  <MousePointer2 className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Preview Modal */}
      <BpmnPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        xml={previewXml}
      />
    </>
  )
}