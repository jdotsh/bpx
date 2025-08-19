/**
 * Virtual Renderer for BPMN-JS
 * Optimizes performance for large diagrams by hiding off-viewport elements
 */
export class VirtualRenderer {
  private visibleElements: Set<string> = new Set()
  private viewportPadding = 100
  private modeler: any
  private enabled = true
  private updateTimeout: NodeJS.Timeout | null = null

  constructor(modeler: any) {
    this.modeler = modeler
    this.setupVirtualRendering()
  }

  private setupVirtualRendering(): void {
    const eventBus = this.modeler.get('eventBus')
    
    // Debounce viewport updates for performance
    eventBus.on('canvas.viewbox.changed', () => {
      if (this.updateTimeout) {
        clearTimeout(this.updateTimeout)
      }
      
      this.updateTimeout = setTimeout(() => {
        this.updateVisibleElements()
      }, 50)
    })
    
    // Update on import
    eventBus.on('import.done', () => {
      setTimeout(() => this.updateVisibleElements(), 100)
    })
    
    // Update on element changes
    eventBus.on('elements.changed', () => {
      this.updateVisibleElements()
    })
  }

  private updateVisibleElements(): void {
    if (!this.enabled) return
    
    const canvas = this.modeler.get('canvas')
    const elementRegistry = this.modeler.get('elementRegistry')
    const viewbox = canvas.viewbox()
    
    // Calculate viewport bounds with padding
    const viewportBounds = {
      left: viewbox.x - this.viewportPadding,
      top: viewbox.y - this.viewportPadding,
      right: viewbox.x + viewbox.width + this.viewportPadding,
      bottom: viewbox.y + viewbox.height + this.viewportPadding
    }
    
    const newVisibleElements = new Set<string>()
    let hiddenCount = 0
    let visibleCount = 0
    
    // Check which elements are in viewport
    elementRegistry.forEach((element: any) => {
      // Always show root and labels
      if (element.type === 'bpmn:Process' || element.labelTarget) {
        newVisibleElements.add(element.id)
        return
      }
      
      if (this.isElementInViewport(element, viewportBounds)) {
        newVisibleElements.add(element.id)
        visibleCount++
        
        // Show element if it was hidden
        if (!this.visibleElements.has(element.id)) {
          this.showElement(element)
        }
      } else {
        hiddenCount++
        
        // Hide element if it's outside viewport
        if (this.visibleElements.has(element.id)) {
          this.hideElement(element)
        }
      }
    })
    
    this.visibleElements = newVisibleElements
    
    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Virtual Renderer: ${visibleCount} visible, ${hiddenCount} hidden`)
    }
  }

  private isElementInViewport(element: any, viewport: any): boolean {
    // For connections, check if either waypoint is in viewport
    if (element.waypoints) {
      return element.waypoints.some((point: any) => 
        point.x >= viewport.left &&
        point.x <= viewport.right &&
        point.y >= viewport.top &&
        point.y <= viewport.bottom
      )
    }
    
    // For shapes, check bounds
    return !(
      element.x + element.width < viewport.left ||
      element.x > viewport.right ||
      element.y + element.height < viewport.top ||
      element.y > viewport.bottom
    )
  }

  private showElement(element: any): void {
    try {
      const gfx = this.modeler.get('elementRegistry').getGraphics(element)
      if (gfx) {
        gfx.style.display = ''
        gfx.style.visibility = 'visible'
      }
    } catch (error) {
      // Silently handle if element doesn't exist
    }
  }

  private hideElement(element: any): void {
    try {
      const gfx = this.modeler.get('elementRegistry').getGraphics(element)
      if (gfx) {
        gfx.style.display = 'none'
        gfx.style.visibility = 'hidden'
      }
    } catch (error) {
      // Silently handle if element doesn't exist
    }
  }

  public enable(): void {
    this.enabled = true
    this.updateVisibleElements()
  }

  public disable(): void {
    this.enabled = false
    // Show all elements
    const elementRegistry = this.modeler.get('elementRegistry')
    elementRegistry.forEach((element: any) => {
      this.showElement(element)
    })
    this.visibleElements.clear()
  }

  public destroy(): void {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout)
    }
    this.disable()
  }
}