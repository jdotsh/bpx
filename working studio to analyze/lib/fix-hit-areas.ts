/**
 * Fix hit areas and white backgrounds to be transparent in both light and dark modes
 * This runs periodically to ensure dynamically created elements are fixed
 */
export function fixHitAreaTransparency() {
  const isDarkMode = document.documentElement.classList.contains('dark')
  
  // Find all hit area elements, including Group elements
  const hitElements = document.querySelectorAll('[class*="djs-hit"], .djs-group rect, [data-element-id*="Group"] rect')
  
  hitElements.forEach((element) => {
    if (element instanceof SVGElement) {
      // Check if this is a Group element or its hit area
      const isGroup = element.closest('.djs-group') || 
                     element.closest('[data-element-id*="Group"]') ||
                     element.parentElement?.classList.contains('djs-group')
      
      // Force transparent stroke and fill for all hit areas and Groups
      if (element.classList.contains('djs-hit') || 
          element.classList.contains('djs-hit-stroke') || 
          element.classList.contains('djs-hit-all') ||
          isGroup) {
        
        // For Group elements, ensure complete transparency
        if (isGroup || element.closest('[data-element-id*="Group"]')) {
          // Remove all visual obstruction
          element.style.stroke = 'transparent'
          element.style.strokeOpacity = '0'
          element.style.fill = 'transparent'
          element.style.fillOpacity = '0'
          
          // Ensure the element doesn't block mouse events on inner elements
          if (element.classList.contains('djs-hit') || element.classList.contains('djs-hit-stroke')) {
            element.style.pointerEvents = 'stroke'
          }
          
          // If this is the visual rect of a Group, make it a dashed border
          if (!element.classList.contains('djs-hit') && element.tagName.toLowerCase() === 'rect') {
            const parent = element.parentElement
            if (parent?.classList.contains('djs-visual')) {
              element.style.fill = 'transparent'
              element.style.fillOpacity = '0'
              // White in dark mode, darker gray in light mode
              element.style.stroke = isDarkMode ? 'white' : 'rgba(64, 64, 64, 0.7)'
              element.style.strokeOpacity = isDarkMode ? '0.7' : '1'
              element.style.strokeDasharray = '5, 5'
              element.style.strokeWidth = '2px'
              element.style.strokeLinecap = 'round'
            }
          }
        } else {
          // Regular hit areas
          element.style.stroke = 'transparent'
          element.style.strokeOpacity = '0'
          element.style.fill = 'none'
          element.style.fillOpacity = '0'
        }
        
        // Clean up any white stroke in inline styles
        const currentStyle = element.getAttribute('style')
        if (currentStyle && (currentStyle.includes('stroke: white') || currentStyle.includes('stroke:#fff'))) {
          const newStyle = currentStyle
            .replace(/stroke:\s*white/gi, 'stroke: transparent')
            .replace(/stroke:\s*#fff(fff)?/gi, 'stroke: transparent')
            .replace(/stroke:\s*rgb\(255[\s,]+255[\s,]+255\)/gi, 'stroke: transparent')
            .replace(/fill:\s*white/gi, 'fill: transparent')
            .replace(/fill:\s*#fff(fff)?/gi, 'fill: transparent')
          element.setAttribute('style', newStyle)
        }
      }
    }
  })
  
  // Fix white backgrounds in drag preview and creation elements
  if (isDarkMode) {
    // Fix drag groups specifically
    const dragGroups = document.querySelectorAll('.djs-drag-group, .djs-dragging, .djs-dragger')
    dragGroups.forEach((group) => {
      if (group instanceof HTMLElement) {
        group.style.backgroundColor = 'transparent'
      }
      
      // Fix all child elements
      const rects = group.querySelectorAll('rect')
      rects.forEach((rect) => {
        const fill = rect.getAttribute('fill')
        if (fill === 'white' || fill === '#fff' || fill === '#ffffff' || 
            fill === '#FFF' || fill === '#FFFFFF' || 
            fill === 'rgb(255, 255, 255)' || fill === 'rgb(255,255,255)') {
          rect.setAttribute('fill', '#374151') // Dark gray for tasks
        }
      })
    })
    
    // More aggressive selectors for all possible white backgrounds during drag
    const selectors = [
      'rect[fill="white"]',
      'rect[fill="#fff"]',
      'rect[fill="#ffffff"]',
      'rect[fill="#FFFFFF"]',
      'rect[fill="#FFF"]',
      'rect[fill="rgb(255, 255, 255)"]',
      'rect[fill="rgb(255,255,255)"]',
      'path[fill="white"]',
      'path[fill="#fff"]',
      'path[fill="#ffffff"]',
      'circle[fill="white"]',
      'circle[fill="#fff"]',
      'ellipse[fill="white"]',
      'polygon[fill="white"]',
      // Target any SVG element with white fill
      'svg *[fill="white"]',
      'svg *[fill="#fff"]',
      'svg *[fill="#ffffff"]',
      // Target inline styles
      '*[style*="fill: white"]',
      '*[style*="fill:white"]',
      '*[style*="fill: #fff"]',
      '*[style*="fill:#fff"]',
      '*[style*="fill: rgb(255"]',
      '*[style*="background: white"]',
      '*[style*="background-color: white"]'
    ]
    
    const whiteElements = document.querySelectorAll(selectors.join(', '))
    
    whiteElements.forEach((element) => {
      // Check if this is part of a BPMN element (not a hit area)
      const isHitArea = element.classList.contains('djs-hit') || 
                       element.closest('[class*="djs-hit"]')
      
      if (!isHitArea) {
        // Check if it's part of drag/create preview or any dragging state
        const isDragRelated = 
          element.closest('.djs-drag-group, .djs-create-group, .djs-dragging, .djs-element, .djs-dragger') ||
          element.closest('[class*="drag"]') ||
          element.closest('[class*="create"]') ||
          element.closest('.djs-shape') ||
          element.closest('.djs-visual')
        
        if (isDragRelated || element.tagName.toLowerCase() === 'rect' || element.tagName.toLowerCase() === 'path') {
          // Use dark background color
          element.setAttribute('fill', '#1f2937')
          
          // Also fix inline styles
          const style = element.getAttribute('style')
          if (style) {
            const newStyle = style
              .replace(/fill:\s*white/gi, 'fill: #1f2937')
              .replace(/fill:\s*#fff(fff)?/gi, 'fill: #1f2937')
              .replace(/fill:\s*rgb\(255[\s,]+255[\s,]+255\)/gi, 'fill: #1f2937')
              .replace(/background(-color)?:\s*white/gi, 'background-color: #1f2937')
              .replace(/background(-color)?:\s*#fff(fff)?/gi, 'background-color: #1f2937')
            element.setAttribute('style', newStyle)
          }
        }
      }
    })
    
    // Also check for any elements being actively dragged - MORE AGGRESSIVE
    const activeDragElements = document.querySelectorAll(
      '.djs-drag-active, .djs-dragging, .djs-visual, .djs-drag-group, .djs-dragger, .djs-create-group'
    )
    activeDragElements.forEach((container) => {
      // Fix all white-filled shapes
      const shapes = container.querySelectorAll('rect, path, circle, ellipse, polygon, g')
      shapes.forEach((element) => {
        const fill = element.getAttribute('fill')
        const style = element.getAttribute('style')
        
        // Check for white fills
        if (fill === 'white' || fill === '#fff' || fill === '#ffffff' || fill === '#FFF' || fill === '#FFFFFF' ||
            fill === 'rgb(255, 255, 255)' || fill === 'rgb(255,255,255)') {
          element.setAttribute('fill', '#1f2937')
        }
        
        // Also check and fix inline styles
        if (style && (style.includes('fill: white') || style.includes('fill:#fff') || 
                     style.includes('fill: rgb(255') || style.includes('background: white'))) {
          const newStyle = style
            .replace(/fill:\s*white/gi, 'fill: #1f2937')
            .replace(/fill:\s*#fff(fff)?/gi, 'fill: #1f2937')
            .replace(/fill:\s*rgb\(255[\s,]+255[\s,]+255\)/gi, 'fill: #1f2937')
            .replace(/background(-color)?:\s*white/gi, 'background-color: transparent')
          element.setAttribute('style', newStyle)
        }
      })
    })
    
    // Fix the drag preview container itself
    const dragPreviews = document.querySelectorAll('.djs-dragger, .djs-drag-group, .djs-create-group')
    dragPreviews.forEach((preview) => {
      if (preview instanceof HTMLElement) {
        preview.style.backgroundColor = 'transparent'
      }
    })
  }
}

/**
 * Start monitoring for hit areas and fix them
 */
export function startHitAreaFixer() {
  // Fix immediately
  fixHitAreaTransparency()
  
  // Fix periodically to catch dynamically added elements
  const interval = setInterval(fixHitAreaTransparency, 500)
  
  // More aggressive fixing during drag operations
  let dragInterval: NodeJS.Timeout | null = null
  
  // Listen for drag events to fix more frequently during drag
  document.addEventListener('dragstart', (e) => {
    console.log('Drag started - increasing fix frequency')
    if (dragInterval) clearInterval(dragInterval)
    dragInterval = setInterval(() => {
      fixHitAreaTransparency()
      // Extra aggressive fix during drag
      const isDarkMode = document.documentElement.classList.contains('dark')
      if (isDarkMode) {
        // Force all drag elements to have dark backgrounds
        document.querySelectorAll('.djs-drag-group rect, .djs-dragging rect, .djs-dragger rect').forEach(rect => {
          const fill = rect.getAttribute('fill')
          if (fill === 'white' || fill === '#fff' || fill === '#ffffff') {
            rect.setAttribute('fill', '#374151')
            if (rect instanceof SVGElement) {
              rect.style.fill = '#374151'
            }
          }
        })
        // Fix any container backgrounds
        document.querySelectorAll('.djs-drag-group, .djs-dragging, .djs-dragger').forEach(el => {
          if (el instanceof HTMLElement) {
            el.style.backgroundColor = 'transparent'
          }
        })
      }
    }, 20) // Fix every 20ms during drag for smoother experience
  })
  
  document.addEventListener('dragend', () => {
    console.log('Drag ended - reducing fix frequency')
    if (dragInterval) {
      clearInterval(dragInterval)
      dragInterval = null
    }
    fixHitAreaTransparency() // Final fix after drag
  })
  
  // Also listen for mouse down which might trigger BPMN.js drag
  document.addEventListener('mousedown', (e) => {
    const target = e.target as Element
    if (target.closest('.bpmn-palette') || target.closest('.djs-palette')) {
      if (dragInterval) clearInterval(dragInterval)
      dragInterval = setInterval(fixHitAreaTransparency, 50)
      
      // Stop aggressive fixing after mouse up
      const mouseUpHandler = () => {
        if (dragInterval) {
          clearInterval(dragInterval)
          dragInterval = null
        }
        fixHitAreaTransparency()
        document.removeEventListener('mouseup', mouseUpHandler)
      }
      document.addEventListener('mouseup', mouseUpHandler)
    }
  })
  
  // Also fix on mutation
  const observer = new MutationObserver((mutations) => {
    let shouldFix = false
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            // Check for hit areas, Groups, or any BPMN elements
            if (node.classList?.contains('djs-hit') || 
                node.querySelector?.('[class*="djs-hit"]') ||
                node.classList?.contains('djs-group') ||
                node.id?.includes('Group') ||
                node.getAttribute?.('data-element-id')?.includes('Group')) {
              shouldFix = true
            }
          }
        })
      }
      // Also check for attribute changes that might add white strokes
      if (mutation.type === 'attributes' && 
          (mutation.attributeName === 'style' || mutation.attributeName === 'stroke')) {
        const target = mutation.target as Element
        if (target.classList?.contains('djs-hit') || 
            target.classList?.contains('djs-hit-stroke') ||
            target.closest?.('.djs-group')) {
          shouldFix = true
        }
      }
    })
    if (shouldFix) {
      fixHitAreaTransparency()
    }
  })
  
  // Observe the canvas container
  const canvas = document.querySelector('.djs-container')
  if (canvas) {
    observer.observe(canvas, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'stroke', 'fill', 'class']
    })
  }
  
  // Return cleanup function
  return () => {
    clearInterval(interval)
    observer.disconnect()
  }
}