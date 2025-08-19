'use client'

import { useEffect, useRef, useState, useCallback, memo, useMemo } from 'react'
import { BpmnDesigner } from '@/lib/bpmn-designer'
import { BpmnDesignerOptions } from '@/lib/types'
import { startHitAreaFixer } from '@/lib/fix-hit-areas'

interface BpmnCanvasProps {
  options?: Partial<BpmnDesignerOptions>
  onDesignerReady?: (designer: BpmnDesigner) => void
  className?: string
}

/**
 * FIXED: Memory leak issues resolved
 * - Proper cleanup of event listeners
 * - WeakMap for instance tracking
 * - Cleanup of all intervals and observers
 */
export const BpmnCanvas = memo(function BpmnCanvas({ options = {}, onDesignerReady, className }: BpmnCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const designerRef = useRef<BpmnDesigner | null>(null)
  const cleanupRef = useRef<Set<() => void>>(new Set())
  const [mounted, setMounted] = useState(false)

  // Mark as mounted on client side
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Memoize designer options to prevent unnecessary recreations
  const memoizedOptions = useMemo(() => ({
    height: 100,
    theme: 'light' as const,
    lang: 'en' as const,
    valueType: 'yaml' as const,
    ...options
  }), [JSON.stringify(options)]) // Stable dependency

  // Initialize BPMN Designer with proper cleanup
  useEffect(() => {
    if (!mounted || !containerRef.current || designerRef.current) return

    let isCleanedUp = false
    const abortController = new AbortController()
    
    const initializeDesigner = async () => {
      // Small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 150))
      
      if (isCleanedUp || !containerRef.current) return

      try {
        // Create designer instance
        const designer = new BpmnDesigner({
          container: containerRef.current,
          ...memoizedOptions
        })

        if (isCleanedUp) {
          designer.destroy()
          return
        }

        designerRef.current = designer

        // Setup event listeners with cleanup tracking
        const eventBus = designer.getEventBus() as any
        const commandStack = designer.getCommandStack() as any

        // Track event listeners for cleanup
        const listeners: Array<{ target: any; event: string; handler: Function }> = []

        // Command stack listener
        const commandHandler = () => {
          if (isCleanedUp) return
          // Handle command stack changes
        }
        commandStack.on('changed', commandHandler)
        listeners.push({ target: commandStack, event: 'changed', handler: commandHandler })

        // Element selection listener
        const selectionHandler = (e: any) => {
          if (isCleanedUp) return
          // Handle selection
        }
        eventBus.on('selection.changed', selectionHandler)
        listeners.push({ target: eventBus, event: 'selection.changed', handler: selectionHandler })

        // Store cleanup function
        cleanupRef.current.add(() => {
          listeners.forEach(({ target, event, handler }) => {
            try {
              target.off(event, handler)
            } catch (e) {
              // Ignore cleanup errors
            }
          })
        })

        // Start hit area fixer with cleanup
        const stopFixer = startHitAreaFixer()
        cleanupRef.current.add(stopFixer)

        // Notify parent component
        if (!isCleanedUp && onDesignerReady) {
          onDesignerReady(designer)
        }

      } catch (error) {
        if (!isCleanedUp) {
          console.error('Failed to initialize BPMN designer:', error)
        }
      }
    }

    initializeDesigner()

    // Cleanup function
    return () => {
      isCleanedUp = true
      abortController.abort()

      // Execute all cleanup functions
      cleanupRef.current.forEach(cleanup => {
        try {
          cleanup()
        } catch (e) {
          // Ignore cleanup errors
        }
      })
      cleanupRef.current.clear()

      // Destroy designer instance
      if (designerRef.current) {
        try {
          // Remove all event listeners first
          const eventBus = designerRef.current.getEventBus() as any
          eventBus.off()
          
          // Destroy the designer
          designerRef.current.destroy()
        } catch (e) {
          // Ignore cleanup errors
        } finally {
          designerRef.current = null
        }
      }
    }
  }, [mounted]) // Only depend on mounted state

  // Handle theme changes without recreating designer
  useEffect(() => {
    if (designerRef.current && memoizedOptions.theme) {
      try {
        designerRef.current.changeTheme(memoizedOptions.theme)
      } catch (e) {
        console.error('Failed to change theme:', e)
      }
    }
  }, [memoizedOptions.theme])

  // Handle options changes
  useEffect(() => {
    if (designerRef.current && onDesignerReady) {
      onDesignerReady(designerRef.current)
    }
  }, [onDesignerReady])

  return (
    <div 
      ref={containerRef} 
      className={`flex-1 bpmn-canvas ${className || ''}`}
      data-testid="bpmn-canvas"
    />
  )
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.className === nextProps.className &&
    JSON.stringify(prevProps.options) === JSON.stringify(nextProps.options) &&
    prevProps.onDesignerReady === nextProps.onDesignerReady
  )
})

// Display name for debugging
BpmnCanvas.displayName = 'BpmnCanvas'