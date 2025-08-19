'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useDiagramApi } from './use-diagram-api'

interface AutoSaveOptions {
  diagramId?: string
  interval?: number // milliseconds
  enabled?: boolean
}

export function useAutoSave(
  getCurrentXml: () => Promise<string | null> | string | null,
  getCurrentTitle: () => string,
  options: AutoSaveOptions = {}
) {
  const { 
    interval = 30000, // 30 seconds default
    enabled = true,
    diagramId 
  } = options

  const { saveDiagram, loading, error } = useDiagramApi()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedXmlRef = useRef<string | null>(null)
  const isSavingRef = useRef(false)

  const performAutoSave = useCallback(async () => {
    if (!diagramId || !enabled || isSavingRef.current) {
      return
    }

    const xmlResult = getCurrentXml()
    const currentXml = xmlResult instanceof Promise ? await xmlResult : xmlResult
    if (!currentXml || currentXml === lastSavedXmlRef.current) {
      return // No changes to save
    }

    try {
      isSavingRef.current = true
      
      const result = await saveDiagram(diagramId, {
        bpmnXml: currentXml,
        title: getCurrentTitle(),
        metadata: {
          lastAutoSave: new Date().toISOString(),
          elementCount: countElements(currentXml)
        }
      })

      if (result) {
        lastSavedXmlRef.current = currentXml
        console.log('Auto-saved diagram:', result.title)
      }
    } catch (err) {
      console.error('Auto-save failed:', err)
    } finally {
      isSavingRef.current = false
    }
  }, [diagramId, enabled, getCurrentXml, getCurrentTitle, saveDiagram])

  const startAutoSave = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    if (enabled && diagramId) {
      intervalRef.current = setInterval(performAutoSave, interval)
    }
  }, [enabled, diagramId, interval, performAutoSave])

  const stopAutoSave = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const forceAutoSave = useCallback(() => {
    performAutoSave()
  }, [performAutoSave])

  // Reset last saved XML when diagram changes
  const resetAutoSave = useCallback((newXml?: string) => {
    lastSavedXmlRef.current = newXml || null
  }, [])

  // Start/stop auto-save based on options
  useEffect(() => {
    if (enabled && diagramId) {
      startAutoSave()
    } else {
      stopAutoSave()
    }

    return () => {
      stopAutoSave()
    }
  }, [enabled, diagramId, startAutoSave, stopAutoSave])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAutoSave()
    }
  }, [stopAutoSave])

  return {
    isAutoSaving: loading && isSavingRef.current,
    autoSaveError: error,
    forceAutoSave,
    resetAutoSave,
    startAutoSave,
    stopAutoSave
  }
}

// Helper function to count BPMN elements
function countElements(bpmnXml: string): number {
  try {
    const taskMatches = bpmnXml.match(/<bpmn[^>]*?task[^>]*>/gi) || []
    const gatewayMatches = bpmnXml.match(/<bpmn[^>]*?gateway[^>]*>/gi) || []
    const eventMatches = bpmnXml.match(/<bpmn[^>]*?event[^>]*>/gi) || []
    
    return taskMatches.length + gatewayMatches.length + eventMatches.length
  } catch {
    return 0
  }
}