/**
 * Enhanced hit area fix for BPMN.js elements
 * Makes elements clickable in their entire area, not just borders
 */

export function fixBpmnHitAreas(modeler: any) {
  if (!modeler) return

  const eventBus = modeler.get('eventBus')
  const canvas = modeler.get('canvas')
  const elementRegistry = modeler.get('elementRegistry')
  
  // Function to fix task styling
  const fixTaskStyling = () => {
    const isDarkMode = document.documentElement.classList.contains('dark')
    
    elementRegistry.forEach((element: any) => {
      if (element.type && element.type.includes('Task')) {
        const gfx = elementRegistry.getGraphics(element)
        if (gfx) {
          const rect = gfx.querySelector('rect')
          if (rect) {
            // Apply solid border - white in dark mode, black in light mode
            rect.style.stroke = isDarkMode ? '#ffffff' : '#000000'
            rect.style.strokeWidth = '2px'
            rect.style.strokeDasharray = 'none'
            rect.style.fill = isDarkMode ? '#374151' : 'white'
            rect.setAttribute('rx', '10')
            rect.setAttribute('ry', '10')
          }
        }
      }
    })
  }
  
  // Function to fix hit areas for all elements
  const fixHitAreas = () => {
    const container = canvas.getContainer()
    const elements = container.querySelectorAll('.djs-element')
    const isDarkMode = document.documentElement.classList.contains('dark')
    
    elements.forEach((element: Element) => {
      // Check if this is a task element
      const elementId = element.getAttribute('data-element-id')
      const isTask = elementId && elementId.includes('Task')
      
      // Fix visual rect for tasks
      if (isTask) {
        const visualRect = element.querySelector('.djs-visual rect')
        if (visualRect) {
          visualRect.setAttribute('stroke', isDarkMode ? '#ffffff' : '#000000')
          visualRect.setAttribute('stroke-width', '2')
          visualRect.removeAttribute('stroke-dasharray')
          visualRect.setAttribute('fill', isDarkMode ? '#374151' : 'white')
          visualRect.setAttribute('rx', '10')
          visualRect.setAttribute('ry', '10')
        }
      }
      
      // Find hit area rectangles
      const hitRects = element.querySelectorAll('.djs-hit, .djs-hit-all')
      
      hitRects.forEach((rect: Element) => {
        if (rect instanceof SVGRectElement) {
          // Make hit area transparent but clickable
          rect.style.fill = 'transparent'
          rect.style.fillOpacity = '0.01' // Very slight opacity to ensure clicks register
          rect.style.stroke = 'transparent'
          rect.style.strokeOpacity = '0'
          rect.style.pointerEvents = 'all'
          
          // Ensure the hit area covers the full element
          const visual = element.querySelector('.djs-visual')
          if (visual) {
            const bbox = (visual as any).getBBox?.()
            if (bbox) {
              rect.setAttribute('x', String(bbox.x))
              rect.setAttribute('y', String(bbox.y))
              rect.setAttribute('width', String(bbox.width))
              rect.setAttribute('height', String(bbox.height))
            }
          }
        }
      })
      
      // Fix connection hit areas
      const connections = element.querySelectorAll('.djs-connection .djs-hit')
      connections.forEach((hit: Element) => {
        if (hit instanceof SVGElement) {
          hit.style.strokeWidth = '15px'
          hit.style.stroke = 'transparent'
          hit.style.strokeOpacity = '0.01'
          hit.style.pointerEvents = 'stroke'
        }
      })
    })
  }
  
  // Fix hit areas and styling after any element change
  const fixAll = () => {
    fixHitAreas()
    fixTaskStyling()
  }
  
  eventBus.on('elements.changed', fixAll)
  eventBus.on('element.added', fixAll)
  eventBus.on('shape.added', fixAll)
  eventBus.on('connection.added', fixAll)
  eventBus.on('import.done', fixAll)
  eventBus.on('shape.changed', fixAll)
  
  // Initial fix
  setTimeout(fixAll, 100)
  
  // Periodic fix for dynamically created elements
  const interval = setInterval(fixAll, 1000)
  
  // Watch for theme changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        // Theme changed, update styling
        fixAll()
      }
    })
  })
  
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  })
  
  // Clean up on destroy
  const originalDestroy = modeler.destroy.bind(modeler)
  modeler.destroy = () => {
    clearInterval(interval)
    observer.disconnect()
    originalDestroy()
  }
}

/**
 * Apply global CSS fixes for hit areas and task styling
 */
export function applyGlobalHitAreaFixes() {
  const style = document.createElement('style')
  style.textContent = `
    /* Global hit area fixes */
    .djs-hit,
    .djs-hit-all {
      fill: rgba(255, 255, 255, 0.01) !important;
      stroke: transparent !important;
      pointer-events: all !important;
      cursor: move !important;
    }
    
    .djs-hit-stroke {
      stroke: rgba(255, 255, 255, 0.01) !important;
      stroke-width: 15px !important;
      fill: none !important;
      pointer-events: stroke !important;
      cursor: move !important;
    }
    
    /* Ensure elements are fully selectable */
    .djs-element {
      cursor: move !important;
    }
    
    .djs-element .djs-visual {
      pointer-events: none !important;
    }
    
    .djs-element .djs-visual > * {
      pointer-events: visiblePainted !important;
    }
    
    /* Fix palette items */
    .djs-palette-entry {
      cursor: pointer !important;
    }
    
    /* Fix resize handles */
    .djs-resizer,
    .djs-resize-handles {
      pointer-events: all !important;
      cursor: nwse-resize !important;
    }
    
    /* Task element styling - solid black border */
    .bpmn\\:Task rect,
    .bpmn\\:UserTask rect,
    .bpmn\\:ServiceTask rect,
    .bpmn\\:ManualTask rect,
    .bpmn\\:BusinessRuleTask rect,
    .bpmn\\:ScriptTask rect,
    .bpmn\\:SendTask rect,
    .bpmn\\:ReceiveTask rect {
      stroke: #000000 !important;
      stroke-width: 2px !important;
      stroke-dasharray: none !important;
      stroke-linejoin: round !important;
      fill: white !important;
      rx: 10 !important;
      ry: 10 !important;
    }
    
    /* Dark mode task styling - white border */
    .dark .bpmn\\:Task rect,
    .dark .bpmn\\:UserTask rect,
    .dark .bpmn\\:ServiceTask rect,
    .dark .bpmn\\:ManualTask rect,
    .dark .bpmn\\:BusinessRuleTask rect,
    .dark .bpmn\\:ScriptTask rect,
    .dark .bpmn\\:SendTask rect,
    .dark .bpmn\\:ReceiveTask rect {
      stroke: #ffffff !important;
      stroke-width: 2px !important;
      fill: #374151 !important;
    }
    
    /* Direct editing content styling */
    .djs-direct-editing-content {
      font-family: Arial, sans-serif !important;
      font-size: 12px !important;
      color: #000000 !important;
    }
    
    .dark .djs-direct-editing-content {
      color: #ffffff !important;
    }
  `
  document.head.appendChild(style)
}