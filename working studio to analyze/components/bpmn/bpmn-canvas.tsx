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

export const BpmnCanvas = memo(function BpmnCanvas({ options = {}, onDesignerReady, className }: BpmnCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [designer, setDesigner] = useState<BpmnDesigner | null>(null)
  const [mounted, setMounted] = useState(false)

  // Mark as mounted on client side
  useEffect(() => {
    setMounted(true)
  }, [])

  // Memoize designer options to prevent unnecessary recreations
  const memoizedOptions = useMemo(() => ({
    height: 100, // Full height for canvas
    theme: 'light' as const,
    lang: 'en' as const,
    valueType: 'yaml' as const,
    ...options
  }), [options])

  // Memoize designer ready callback
  const handleDesignerReady = useCallback((designer: BpmnDesigner) => {
    onDesignerReady?.(designer)
  }, [onDesignerReady])

  useEffect(() => {
    // Only initialize on client side after mount
    if (!mounted || !containerRef.current || designer) return

    let currentDesigner: BpmnDesigner | null = null
    let stopFixer: (() => void) | undefined

    // Add a small delay to ensure DOM is fully ready
    const timer = setTimeout(() => {
      try {
        console.log('Initializing BPMN designer...', memoizedOptions)
        currentDesigner = new BpmnDesigner({
          container: containerRef.current!,
          ...memoizedOptions
        })

        setDesigner(currentDesigner)
        handleDesignerReady(currentDesigner)
        console.log('BPMN designer initialized successfully')
        
        // Start fixing hit areas to ensure transparency
        stopFixer = startHitAreaFixer()
      } catch (error) {
        console.error('Failed to initialize BPMN designer:', error)
        console.error('Container element:', containerRef.current)
        console.error('Options:', memoizedOptions)
      }
    }, 150)

    return () => {
      clearTimeout(timer)
      stopFixer?.()
      if (currentDesigner) {
        currentDesigner.destroy()
        setDesigner(null)
      }
    }
  }, [mounted]) // Only run once after mount on client side

  // Handle theme changes separately without recreating the designer
  useEffect(() => {
    if (designer && memoizedOptions.theme) {
      designer.changeTheme(memoizedOptions.theme)
    }
  }, [designer, memoizedOptions.theme])

  return (
    <div 
      ref={containerRef} 
      className={`flex-1 bpmn-canvas ${className || ''}`}
    />
  )
})