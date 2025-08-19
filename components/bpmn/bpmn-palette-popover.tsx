'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronRight, Search, X } from 'lucide-react'
import { BPMN_ELEMENTS_REGISTRY, BpmnElementGroup } from '@/lib/bpmn-elements-registry'

interface BpmnPalettePopoverProps {
  triggerRef: React.RefObject<HTMLElement>
  groupId?: string
  isVisible: boolean
  onClose: () => void
  onAction: (action: string, event: Event | DragEvent) => void
}

export function BpmnPalettePopover({ triggerRef, groupId, isVisible, onClose, onAction }: BpmnPalettePopoverProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [expandedGroup, setExpandedGroup] = useState<string | null>(groupId || null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [mounted, setMounted] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<'left' | 'right'>('right')
  
  // Get the groups to display
  const groups = groupId 
    ? BPMN_ELEMENTS_REGISTRY.filter(g => g.id === groupId)
    : BPMN_ELEMENTS_REGISTRY
  
  // Filter groups based on search
  const filteredGroups = searchQuery 
    ? groups.map(group => ({
        ...group,
        items: group.items.filter(item => 
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.action.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(group => group.items.length > 0)
    : groups

  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate position based on trigger element
  useEffect(() => {
    if (!isVisible || !triggerRef.current) return

    const updatePosition = () => {
      const triggerRect = triggerRef.current!.getBoundingClientRect()
      const popoverWidth = groupId ? 280 : 360  // Smaller for single group
      const popoverHeight = groupId ? 300 : 450  // Smaller for single group
      
      // Position to the right of the trigger, centered vertically
      let left = triggerRect.right + 8
      let top = triggerRect.top + (triggerRect.height / 2) - (popoverHeight / 2)
      
      // Adjust horizontal position if it goes off screen
      if (left + popoverWidth > window.innerWidth - 10) {
        // Try left side
        left = triggerRect.left - popoverWidth - 8
        
        // If still off screen, position at the edge
        if (left < 10) {
          left = window.innerWidth - popoverWidth - 10
        }
      }
      
      // Adjust vertical position if it goes off screen
      if (top < 10) {
        top = 10
      } else if (top + popoverHeight > window.innerHeight - 10) {
        top = window.innerHeight - popoverHeight - 10
      }
      
      setPosition({ top, left })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition)
    }
  }, [isVisible, triggerRef])

  // Close on click outside (but not on the trigger element)
  useEffect(() => {
    if (!isVisible) return

    const handleClickOutside = (e: MouseEvent) => {
      // Don't close if clicking inside popover
      if (popoverRef.current?.contains(e.target as Node)) {
        return
      }
      
      // Don't close if clicking on trigger (handled by palette)
      if (triggerRef.current?.contains(e.target as Node)) {
        return
      }
      
      // Close popover
      onClose()
    }

    // Use a small delay to avoid immediate close on open
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 100)
    
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isVisible, onClose, triggerRef])

  // Auto-expand single group when showing specific group
  useEffect(() => {
    if (groupId && groups.length === 1) {
      setExpandedGroup(groupId)
    }
  }, [groupId, groups.length])
  
  // Focus search when opened with keyboard shortcut
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showSearch])
  
  const handleItemClick = (action: string, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    onAction(action, event.nativeEvent)
    onClose()
  }

  const handleItemDragStart = (action: string, event: React.DragEvent) => {
    // Don't prevent default for drag events - let browser handle it
    event.stopPropagation()
    onAction(action, event.nativeEvent)
    // Don't close immediately on drag start to allow dragging
  }
  
  const toggleSearch = () => {
    setShowSearch(!showSearch)
    setSearchQuery('')
    if (!showSearch) {
      setTimeout(() => searchInputRef.current?.focus(), 0)
    }
  }
  
  // Handle tooltip positioning based on available space
  const handleItemMouseEnter = useCallback((action: string, event: React.MouseEvent<HTMLDivElement>) => {
    setHoveredItem(action)
    
    // Check if tooltip would go off-screen
    const element = event.currentTarget
    const rect = element.getBoundingClientRect()
    const tooltipWidth = 200 // Approximate tooltip width
    
    // If element is too far right, show tooltip on left
    if (rect.right + tooltipWidth > window.innerWidth - 20) {
      setTooltipPosition('left')
    } else {
      setTooltipPosition('right')
    }
  }, [])
  
  const handleItemMouseLeave = useCallback(() => {
    setHoveredItem(null)
  }, [])

  if (!mounted || !isVisible) return null

  return createPortal(
    <div
      ref={popoverRef}
      className="bpmn-palette-popover fixed z-[9999] bg-card border border-border rounded-lg shadow-2xl overflow-hidden animate-in fade-in-0 slide-in-from-left-2 duration-200"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: groupId ? '280px' : '360px',
        maxHeight: groupId ? '300px' : '450px'
      }}
    >
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="flex items-center justify-between p-2 bg-muted/50">
          <h3 className="text-sm font-semibold">
            {groupId ? groups[0]?.title : 'BPMN Elements'}
          </h3>
          <div className="flex items-center gap-1">
            {!groupId && (
              <button
                onClick={toggleSearch}
                className="p-1 rounded hover:bg-accent transition-colors"
                title="Search elements (Ctrl+F)"
              >
                <Search className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-accent transition-colors"
              title="Close (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        {showSearch && (
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search elements..."
                className="w-full pl-8 pr-2 py-1 text-sm bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowSearch(false)
                    setSearchQuery('')
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
      
      <div className="overflow-y-auto overflow-x-visible" style={{ maxHeight: groupId ? '240px' : '350px', position: 'relative' }}>
        <div className="p-2 overflow-visible">
          {filteredGroups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No elements found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.id} className="mb-2">
                {!groupId && (
                  <button
                    className="w-full flex items-center justify-between p-2 rounded hover:bg-accent transition-colors text-sm font-medium"
                    onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
                  >
                    <div className="flex items-center gap-2">
                      <i className={`${group.icon} text-base`}></i>
                      <span>{group.title}</span>
                      <span className="text-xs text-muted-foreground">({group.items.length})</span>
                    </div>
                    <ChevronRight 
                      className={`h-4 w-4 transition-transform ${
                        expandedGroup === group.id ? 'rotate-90' : ''
                      }`}
                    />
                  </button>
                )}
                
                {(expandedGroup === group.id || searchQuery) && (
                  <div className={`grid ${groupId ? 'grid-cols-3' : 'grid-cols-4'} gap-1 p-2 mt-1 bg-muted/30 rounded overflow-visible`} style={{ position: 'relative', zIndex: 1 }}>
                    {group.items.map((item) => {
                      const isHovered = hoveredItem === item.action
                      const positionClass = tooltipPosition === 'left' 
                        ? 'right-full left-auto mr-2' 
                        : 'left-full right-auto ml-2'
                      const arrowClass = tooltipPosition === 'left'
                        ? 'left-full right-auto border-l-4 border-r-0 border-l-border'
                        : 'right-full left-auto border-r-4 border-l-0 border-r-border'
                      
                      return (
                        <div
                          key={item.action}
                          className="bpmn-entry flex flex-col items-center justify-center p-2 rounded cursor-pointer hover:bg-accent transition-colors group relative overflow-visible"
                          draggable="true"
                          data-action={item.action}
                          style={{ color: item.color }}
                          onClick={(e) => handleItemClick(item.action, e)}
                          onDragStart={(e) => handleItemDragStart(item.action, e)}
                          onMouseEnter={(e) => handleItemMouseEnter(item.action, e)}
                          onMouseLeave={handleItemMouseLeave}
                        >
                          <i className={`bpmn-entry-icon ${item.icon} text-lg mb-1`}></i>
                          <span className="text-[10px] text-center leading-tight text-muted-foreground group-hover:text-foreground">
                            {item.title.length > 12 ? item.title.substring(0, 10) + '...' : item.title}
                          </span>
                          
                          {/* Smart positioned tooltip */}
                          <div 
                            className={`absolute top-1/2 transform -translate-y-1/2 ${positionClass} px-3 py-2 bg-popover border border-border text-popover-foreground rounded-md shadow-xl transition-all duration-200 pointer-events-none whitespace-nowrap ${
                              isHovered ? 'opacity-100 scale-100 z-[10002]' : 'opacity-0 scale-95 z-[10000]'
                            }`}
                            style={{
                              visibility: isHovered ? 'visible' : 'hidden',
                              transitionDelay: isHovered ? '500ms' : '0ms'
                            }}
                          >
                            <div className="font-semibold text-sm">{item.title}</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              Action: {item.action}
                            </div>
                            {/* Dynamic arrow */}
                            <div className={`absolute top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-[5px] border-b-[5px] border-transparent ${arrowClass}`}></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}