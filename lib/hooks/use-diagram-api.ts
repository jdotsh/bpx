'use client'

import { useState, useCallback } from 'react'
import type { Diagram } from '@prisma/client'
import type { DiagramWithVersions } from '@/lib/services/diagram'

interface DiagramSaveData {
  title?: string
  bpmnXml: string
  metadata?: Record<string, any>
}

interface CreateDiagramData {
  title: string
  projectId: string
  bpmnXml?: string
  metadata?: Record<string, any>
}

export function useDiagramApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const createDiagram = useCallback(async (data: CreateDiagramData): Promise<Diagram | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/diagrams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create diagram')
      }

      const diagram = await response.json()
      return diagram
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create diagram'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const saveDiagram = useCallback(async (diagramId: string, data: DiagramSaveData): Promise<Diagram | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/diagrams/${diagramId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to save diagram')
      }

      const diagram = await response.json()
      return diagram
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save diagram'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const loadDiagram = useCallback(async (diagramId: string): Promise<DiagramWithVersions | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/diagrams/${diagramId}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to load diagram')
      }

      const diagram = await response.json()
      return diagram
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load diagram'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteDiagram = useCallback(async (diagramId: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/diagrams/${diagramId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete diagram')
      }

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete diagram'
      setError(message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const exportDiagram = useCallback(async (diagramId: string): Promise<string | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/diagrams/${diagramId}/xml`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to export diagram')
      }

      const xmlContent = await response.text()
      return xmlContent
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to export diagram'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    clearError,
    createDiagram,
    saveDiagram,
    loadDiagram,
    deleteDiagram,
    exportDiagram
  }
}