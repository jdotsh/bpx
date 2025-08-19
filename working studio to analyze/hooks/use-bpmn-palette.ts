'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { BpmnElement, BpmnElementGroup, BPMN_ELEMENT_GROUPS, searchElements } from '@/lib/bpmn-elements'

interface UseBpmnPaletteOptions {
  onElementAction?: (element: BpmnElement, event?: Event) => void
  onDragStart?: (element: BpmnElement, event: DragEvent) => void
  onDragEnd?: (element: BpmnElement, event: DragEvent) => void
}

export function useBpmnPalette(options: UseBpmnPaletteOptions = {}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<BpmnElementGroup>>(
    new Set(Object.values(BPMN_ELEMENT_GROUPS).filter(g => g.expanded).map(g => g.id))
  )
  const [activeElement, setActiveElement] = useState<string | null>(null)
  
  const draggedElement = useRef<BpmnElement | null>(null)
  const dragStartPosition = useRef<{ x: number; y: number } | null>(null)

  // Load saved state on mount
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('bpmn-palette-collapsed')
    if (savedCollapsed !== null) {
      setIsCollapsed(JSON.parse(savedCollapsed))
    }

    const savedGroups = localStorage.getItem('bpmn-palette-groups')
    if (savedGroups) {
      setExpandedGroups(new Set(JSON.parse(savedGroups)))
    }
  }, [])

  // Persist collapsed state
  const toggleCollapsed = useCallback(() => {
    setIsCollapsed(prev => {
      const newValue = !prev
      localStorage.setItem('bpmn-palette-collapsed', JSON.stringify(newValue))
      return newValue
    })
  }, [])

  // Persist expanded groups
  const toggleGroup = useCallback((groupId: BpmnElementGroup) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupId)) {
        newSet.delete(groupId)
      } else {
        newSet.add(groupId)
      }
      localStorage.setItem('bpmn-palette-groups', JSON.stringify(Array.from(newSet)))
      return newSet
    })
  }, [])

  // Search functionality
  const filteredElements = useCallback(() => {
    if (!searchQuery.trim()) {
      return null
    }
    return searchElements(searchQuery)
  }, [searchQuery])

  // Element interaction handlers
  const handleElementClick = useCallback((element: BpmnElement, event: React.MouseEvent) => {
    if (!element.draggable) {
      // Tool selection
      setActiveElement(element.id)
      options.onElementAction?.(element, event.nativeEvent)
    }
  }, [options])

  const handleDragStart = useCallback((element: BpmnElement, event: React.DragEvent) => {
    if (!element.draggable) {
      event.preventDefault()
      return
    }

    draggedElement.current = element
    dragStartPosition.current = { x: event.clientX, y: event.clientY }
    
    // Set drag data for BPMN.js
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('text/plain', element.action)
    event.dataTransfer.setData('application/bpmn-element', JSON.stringify(element))
    
    // Create drag image
    const dragImage = event.currentTarget.cloneNode(true) as HTMLElement
    dragImage.style.opacity = '0.8'
    dragImage.style.transform = 'rotate(5deg)'
    document.body.appendChild(dragImage)
    event.dataTransfer.setDragImage(dragImage, 20, 20)
    
    // Clean up drag image
    setTimeout(() => {
      document.body.removeChild(dragImage)
    }, 0)

    options.onDragStart?.(element, event.nativeEvent as DragEvent)
  }, [options])

  const handleDragEnd = useCallback((element: BpmnElement, event: React.DragEvent) => {
    draggedElement.current = null
    dragStartPosition.current = null
    options.onDragEnd?.(element, event.nativeEvent as DragEvent)
  }, [options])

  // Keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent, element: BpmnElement) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleElementClick(element, event as any)
    }
  }, [handleElementClick])

  // Search handler
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
  }, [])

  return {
    // State
    isCollapsed,
    searchQuery,
    expandedGroups,
    activeElement,
    filteredElements: filteredElements(),
    
    // Actions
    toggleCollapsed,
    toggleGroup,
    handleElementClick,
    handleDragStart, 
    handleDragEnd,
    handleKeyDown,
    handleSearchChange,
    clearSearch,
    setActiveElement,
    
    // Refs
    draggedElement: draggedElement.current,
    dragStartPosition: dragStartPosition.current
  }
}