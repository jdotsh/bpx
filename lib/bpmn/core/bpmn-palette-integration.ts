import { getElementByAction } from './bpmn-elements-registry'

export interface BpmnPaletteIntegration {
  attachToDesigner(designer: any): void
  detachFromDesigner(): void
  handleToolAction(action: string, event?: Event): void
  handleElementClick(action: string, event?: Event): void
  handleElementDragStart(action: string, event: DragEvent): void
}

export class BpmnPaletteIntegrationImpl implements BpmnPaletteIntegration {
  private designer: any = null
  private palette: any = null
  private globalConnect: any = null
  private create: any = null
  private elementFactory: any = null
  private canvas: any = null
  private handTool: any = null
  private lassoTool: any = null
  private spaceTool: any = null
  private bpmnFactory: any = null
  private modeling: any = null
  private currentDragElement: any = null

  attachToDesigner(designer: any): void {
    console.log('Attaching palette integration to designer...', designer)
    this.designer = designer
    
    if (!designer || !designer.get) {
      console.warn('Invalid BPMN designer instance')
      return
    }

    try {
      // Get BPMN.js services
      this.palette = designer.get('palette')
      this.globalConnect = designer.get('globalConnect')
      this.create = designer.get('create')
      this.elementFactory = designer.get('elementFactory')
      this.canvas = designer.get('canvas')
      this.handTool = designer.get('handTool')
      this.lassoTool = designer.get('lassoTool')
      this.spaceTool = designer.get('spaceTool')
      this.bpmnFactory = designer.get('bpmnFactory')
      this.modeling = designer.get('modeling')
      
      console.log('BPMN.js services attached:', {
        palette: !!this.palette,
        globalConnect: !!this.globalConnect,
        create: !!this.create,
        elementFactory: !!this.elementFactory,
        canvas: !!this.canvas,
        handTool: !!this.handTool,
        lassoTool: !!this.lassoTool,
        spaceTool: !!this.spaceTool,
        bpmnFactory: !!this.bpmnFactory,
        modeling: !!this.modeling
      })
      
      // Hide default palette since we're replacing it
      this.hideDefaultPalette()
      
      // Setup drag and drop handlers
      this.setupDragAndDrop()
      
      console.log('Palette integration attached successfully')
    } catch (error) {
      console.error('Failed to attach palette integration:', error)
    }
  }

  detachFromDesigner(): void {
    this.cleanupDragAndDrop()
    this.showDefaultPalette()
    
    this.designer = null
    this.palette = null
    this.globalConnect = null
    this.create = null
    this.elementFactory = null
    this.canvas = null
    this.bpmnFactory = null
    this.modeling = null
  }

  private hideDefaultPalette(): void {
    try {
      const paletteContainer = document.querySelector('.djs-palette')
      if (paletteContainer) {
        ;(paletteContainer as HTMLElement).style.display = 'none'
      }
    } catch (error) {
      console.warn('Could not hide default palette:', error)
    }
  }

  private showDefaultPalette(): void {
    try {
      const paletteContainer = document.querySelector('.djs-palette')
      if (paletteContainer) {
        ;(paletteContainer as HTMLElement).style.display = ''
      }
    } catch (error) {
      console.warn('Could not show default palette:', error)
    }
  }

  handleToolAction(action: string, event?: Event): void {
    if (!this.designer) return

    try {
      console.log(`Handling tool action: ${action}`)
      
      switch (action) {
        case 'hand-tool':
          this.handTool.activateHand()
          break
        case 'lasso-tool':
          this.lassoTool.activateSelection()
          break
        case 'space-tool':
          this.spaceTool.activateSelection()
          break
        case 'global-connect-tool':
          this.globalConnect.toggle()
          break
        default:
          console.warn(`Unknown tool action: ${action}`)
      }
    } catch (error) {
      console.error(`Failed to handle tool action ${action}:`, error)
    }
  }

  handleElementClick(action: string, event?: Event): void {
    if (!this.create || !this.elementFactory) return

    try {
      console.log(`Handling element click: ${action}`)
      
      const element = getElementByAction(action)
      if (!element) {
        console.warn(`Unknown element action: ${action}`)
        return
      }

      const shape = this.createElement(element)
      if (shape) {
        // Activate create mode - element follows cursor until clicked on canvas
        this.create.start(event, shape)
      }
    } catch (error) {
      console.error(`Failed to handle element click ${action}:`, error)
    }
  }

  handleElementDragStart(action: string, event: DragEvent): void {
    if (!this.create || !this.elementFactory) return

    try {
      console.log(`Handling element drag start: ${action}`)
      
      const element = getElementByAction(action)
      if (!element) {
        console.warn(`Unknown element action: ${action}`)
        return
      }

      const shape = this.createElement(element)
      if (shape) {
        // Store the shape for drop handling
        this.currentDragElement = shape
        
        // Set drag data for browser drag and drop
        event.dataTransfer!.effectAllowed = 'copy'
        event.dataTransfer!.setData('bpmn/element', action)
        
        // Create a ghost image for dragging
        const dragImage = this.createDragImage(element)
        event.dataTransfer!.setDragImage(dragImage, 20, 20)
        
        // Clean up the drag image after a delay
        setTimeout(() => {
          dragImage.remove()
        }, 0)
      }
    } catch (error) {
      console.error(`Failed to handle element drag start ${action}:`, error)
    }
  }

  private createElement(element: any): any {
    try {
      const elementType = element.type
      
      // Create business object with proper type
      const businessObject = this.bpmnFactory.create(elementType)
      
      // Add event definition if needed
      if (element.eventDefinitionType) {
        const eventDefinition = this.bpmnFactory.create(element.eventDefinitionType)
        businessObject.eventDefinitions = [eventDefinition]
      }
      
      // Set name for tasks and activities
      if (elementType.includes('Task') || elementType.includes('Activity')) {
        businessObject.name = element.title
      }
      
      // Create shape configuration
      const shapeConfig: any = {
        type: elementType,
        businessObject: businessObject
      }
      
      // Handle expanded/collapsed state for subprocess and participants
      if (element.isExpanded !== undefined) {
        shapeConfig.isExpanded = element.isExpanded
        businessObject.di = { isExpanded: element.isExpanded }
      }
      
      // Special handling for participants (pools)
      if (elementType === 'bpmn:Participant') {
        const process = this.bpmnFactory.create('bpmn:Process')
        businessObject.processRef = process
        shapeConfig.width = element.isExpanded ? 600 : 400
        shapeConfig.height = element.isExpanded ? 250 : 60
      }
      
      // Special handling for lanes
      if (elementType === 'bpmn:Lane') {
        shapeConfig.width = 600
        shapeConfig.height = 120
      }
      
      // Special handling for subprocess
      if (elementType === 'bpmn:SubProcess' || elementType === 'bpmn:Transaction') {
        shapeConfig.width = element.isExpanded ? 350 : 100
        shapeConfig.height = element.isExpanded ? 200 : 80
      }
      
      // Create the shape
      return this.elementFactory.createShape(shapeConfig)
    } catch (error) {
      console.error('Failed to create element:', error)
      return null
    }
  }

  private createDragImage(element: any): HTMLElement {
    const dragImage = document.createElement('div')
    dragImage.className = 'bpmn-drag-image'
    dragImage.style.position = 'absolute'
    dragImage.style.left = '-1000px'
    dragImage.style.width = '40px'
    dragImage.style.height = '40px'
    dragImage.style.display = 'flex'
    dragImage.style.alignItems = 'center'
    dragImage.style.justifyContent = 'center'
    // Use proper dark mode colors - no white!
    const isDarkMode = document.documentElement.classList.contains('dark')
    dragImage.style.background = isDarkMode ? 'transparent' : 'white'
    dragImage.style.border = isDarkMode ? '1px solid #374151' : '1px solid #ccc'
    dragImage.style.borderRadius = '4px'
    dragImage.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
    
    const icon = document.createElement('i')
    icon.className = element.icon
    icon.style.fontSize = '20px'
    if (element.color) {
      icon.style.color = element.color
    }
    
    dragImage.appendChild(icon)
    document.body.appendChild(dragImage)
    
    return dragImage
  }

  private setupDragAndDrop(): void {
    // Get the canvas container
    const canvasContainer = this.canvas.getContainer()
    if (!canvasContainer) return

    // Handle drag over to allow drop
    const handleDragOver = (event: DragEvent) => {
      event.preventDefault()
      event.dataTransfer!.dropEffect = 'copy'
    }

    // Handle drop event
    const handleDrop = (event: DragEvent) => {
      event.preventDefault()
      event.stopPropagation()

      const action = event.dataTransfer!.getData('bpmn/element')
      if (!action || !this.currentDragElement) return

      // Get the canvas position
      const canvasRect = canvasContainer.getBoundingClientRect()
      const x = event.clientX - canvasRect.left
      const y = event.clientY - canvasRect.top

      // Convert screen coordinates to diagram coordinates
      const viewbox = this.canvas.viewbox()
      const diagramX = (x - viewbox.x) / viewbox.scale
      const diagramY = (y - viewbox.y) / viewbox.scale

      try {
        // Create the element at the drop position
        const rootElement = this.canvas.getRootElement()
        this.modeling.createShape(
          this.currentDragElement,
          { x: diagramX, y: diagramY },
          rootElement
        )
        
        console.log(`Created element at position: ${diagramX}, ${diagramY}`)
      } catch (error) {
        console.error('Failed to create shape on drop:', error)
      }

      // Clear the current drag element
      this.currentDragElement = null
    }

    // Add event listeners
    canvasContainer.addEventListener('dragover', handleDragOver)
    canvasContainer.addEventListener('drop', handleDrop)

    // Store handlers for cleanup
    ;(canvasContainer as any)._dragHandlers = { handleDragOver, handleDrop }
  }

  private cleanupDragAndDrop(): void {
    const canvasContainer = this.canvas?.getContainer()
    if (!canvasContainer) return

    const handlers = (canvasContainer as any)._dragHandlers
    if (handlers) {
      canvasContainer.removeEventListener('dragover', handlers.handleDragOver)
      canvasContainer.removeEventListener('drop', handlers.handleDrop)
      delete (canvasContainer as any)._dragHandlers
    }
  }
}