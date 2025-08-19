'use client'

import { useState, useCallback, memo, useEffect, useRef } from 'react'
import { ChevronRight, ChevronLeft, ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BpmnPalettePopover } from './bpmn-palette-popover'
import { BPMN_ELEMENTS_REGISTRY } from '@/lib/bpmn-elements-registry'

interface BpmnElementsPaletteProps {
  className?: string
  onAction?: (action: string, event: Event | DragEvent) => void
  activeTool?: string
}

export const BpmnElementsPalette = memo(function BpmnElementsPalette({
  className,
  onAction,
  activeTool
}: BpmnElementsPaletteProps) {
  // Initialize with default value for SSR
  const [isOpen, setIsOpen] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const [showPopover, setShowPopover] = useState(false)
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const paletteRef = useRef<HTMLDivElement>(null)
  const popoverTriggerRef = useRef<HTMLElement | null>(null)
  
  // Load from localStorage only on client side after mount
  useEffect(() => {
    setIsClient(true)
    const stored = localStorage.getItem('bpmn-palette-expanded')
    if (stored !== null) {
      setIsOpen(JSON.parse(stored))
    }
    // Expand all groups by default when open
    setExpandedGroups(new Set(BPMN_ELEMENTS_REGISTRY.map(g => g.id)))
  }, [])

  const togglePalette = useCallback(() => {
    setIsOpen((prev: boolean) => {
      const newState = !prev
      // Persist state to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('bpmn-palette-expanded', JSON.stringify(newState))
      }
      // Hide popover when opening palette
      if (newState) {
        setShowPopover(false)
      }
      return newState
    })
  }, [])

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }, [])

  // Handle click to show popover for specific group
  const handleGroupClick = useCallback((event: React.MouseEvent, groupId: string) => {
    if (isOpen) return // Don't show popover when expanded
    
    event.stopPropagation()
    event.preventDefault()
    
    const target = event.currentTarget as HTMLElement
    popoverTriggerRef.current = target
    
    // Toggle popover on click
    if (hoveredGroup === groupId && showPopover) {
      // Close if clicking the same group
      setShowPopover(false)
      setHoveredGroup(null)
    } else {
      // Open popover for this group
      setHoveredGroup(groupId)
      setShowPopover(true)
    }
  }, [isOpen, hoveredGroup, showPopover])

  // Handle clicking outside to close popover
  useEffect(() => {
    if (!showPopover) return
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Check if click is outside both the trigger and popover
      if (!popoverTriggerRef.current?.contains(target)) {
        // Give popover a chance to handle its own clicks
        setTimeout(() => {
          setShowPopover(false)
          setHoveredGroup(null)
        }, 100)
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showPopover])

  const handlePopoverAction = useCallback((action: string, event: Event | DragEvent) => {
    onAction?.(action, event)
    setShowPopover(false)
    setHoveredGroup(null)
  }, [onAction])

  // Handle drag start for palette items
  const handleDragStart = useCallback((event: React.DragEvent, action: string) => {
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('bpmn/element', action)
    onAction?.(action, event.nativeEvent)
  }, [onAction])

  // Handle click for palette items
  const handleClick = useCallback((event: React.MouseEvent, action: string) => {
    event.preventDefault()
    event.stopPropagation()
    onAction?.(action, event.nativeEvent)
  }, [onAction])

  return (
    <>
      <div 
        ref={paletteRef}
        className={cn(
          "bpmn-palette transition-all duration-300 ease-in-out bg-card border-r border-border h-full overflow-hidden flex flex-col",
          "transform-none opacity-100",
          isOpen ? "w-64" : "w-12",
          className
        )}
        style={{ 
          isolation: 'isolate',
          willChange: 'width',
          backfaceVisibility: 'hidden'
        }}
      >
        {/* Header */}
        <div className="bpmn-palette_header flex items-center justify-between p-3 border-b border-border flex-shrink-0">
          {isOpen && (
            <p className="text-sm font-medium">
              <span>Elements palette</span>
            </p>
          )}
          {isClient && (
            <button
              onClick={togglePalette}
              className="p-1 hover:bg-accent rounded transition-colors"
              aria-label={isOpen ? "Collapse palette" : "Expand palette"}
            >
              {isOpen ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        {/* Expanded Content */}
        {isOpen && (
          <div className="bpmn-palette_content flex-1 overflow-y-auto">
            <div className="space-y-0">
              
              {/* Tools Group - Always visible, no popover */}
              <div className="border-b border-border/50 bg-muted/30">
                <div className="flex items-center justify-between p-3 font-medium text-sm">
                  <div className="flex items-center gap-2">
                    <i className="bpmn-icon-hand-tool text-sm"></i>
                    <span>Tools</span>
                  </div>
                </div>
                <div className="p-3 pt-0">
                  <div className="bpmn-entries-grid grid grid-cols-4 gap-2">
                    <div 
                      className={cn(
                        "bpmn-entry flex items-center justify-center p-2 rounded cursor-pointer transition-colors",
                        activeTool === 'hand' ? "highlighted-entry bg-primary/20" : "hover:bg-accent"
                      )} 
                      onClick={(e) => handleClick(e, 'hand-tool')}
                      data-action="hand-tool" 
                      data-group="TOOL"
                      title="Activate Hand Tool"
                    >
                      <i className="bpmn-entry-icon bpmn-icon-hand-tool"></i>
                    </div>
                    <div 
                      className={cn(
                        "bpmn-entry flex items-center justify-center p-2 rounded cursor-pointer transition-colors",
                        activeTool === 'lasso' ? "highlighted-entry bg-primary/20" : "hover:bg-accent"
                      )} 
                      onClick={(e) => handleClick(e, 'lasso-tool')}
                      data-action="lasso-tool" 
                      data-group="TOOL"
                      title="Activate Lasso Tool"
                    >
                      <i className="bpmn-entry-icon bpmn-icon-lasso-tool"></i>
                    </div>
                    <div 
                      className={cn(
                        "bpmn-entry flex items-center justify-center p-2 rounded cursor-pointer transition-colors",
                        activeTool === 'space' ? "highlighted-entry bg-primary/20" : "hover:bg-accent"
                      )} 
                      onClick={(e) => handleClick(e, 'space-tool')}
                      data-action="space-tool" 
                      data-group="TOOL"
                      title="Activate Space Tool"
                    >
                      <i className="bpmn-entry-icon bpmn-icon-space-tool"></i>
                    </div>
                    <div 
                      className={cn(
                        "bpmn-entry flex items-center justify-center p-2 rounded cursor-pointer transition-colors",
                        activeTool === 'global-connect' ? "highlighted-entry bg-primary/20" : "hover:bg-accent"
                      )} 
                      onClick={(e) => handleClick(e, 'global-connect-tool')}
                      data-action="global-connect-tool" 
                      data-group="TOOL"
                      title="Activate Global Connect Tool"
                    >
                      <i className="bpmn-entry-icon bpmn-icon-connection-multi"></i>
                    </div>
                  </div>
                </div>
              </div>

              {/* Render all element groups from registry */}
              {BPMN_ELEMENTS_REGISTRY.map((group) => {
                const isExpanded = expandedGroups.has(group.id)
                const firstFourItems = group.items.slice(0, 4)
                
                return (
                  <div key={group.id} className="border-b border-border/50">
                    <button
                      className="w-full flex items-center justify-between p-3 font-medium text-sm hover:bg-accent/50 transition-colors"
                      onClick={() => toggleGroup(group.id)}
                    >
                      <div className="flex items-center gap-2">
                        <i className={`${group.icon} text-sm`}></i>
                        <span>{group.title}</span>
                      </div>
                      <ChevronDown className={cn(
                        "h-4 w-4 transition-transform",
                        isExpanded ? "rotate-180" : ""
                      )} />
                    </button>
                    {isExpanded && (
                      <div className="p-3 pt-0">
                        <div className="bpmn-entries-grid grid grid-cols-4 gap-2">
                          {group.items.map((item) => (
                            <div 
                              key={item.action}
                              className="bpmn-entry flex items-center justify-center p-2 rounded cursor-pointer hover:bg-accent transition-colors" 
                              draggable="true" 
                              onDragStart={(e) => handleDragStart(e, item.action)}
                              onClick={(e) => handleClick(e, item.action)}
                              data-action={item.action} 
                              data-group={group.id} 
                              title={item.title} 
                              style={{ color: item.color }}
                            >
                              <i className={`bpmn-entry-icon ${item.icon}`}></i>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Collapsed Content - Tools and Elements Separated */}
        {!isOpen && (
          <div className="bpmn-palette_collapsed-content p-2 space-y-1 flex-1 overflow-y-auto">
            {/* Tools Section - NO POPOVER */}
            <div data-group="tools" className="tools-section space-y-1">
              <div 
                className={cn(
                  "bpmn-entry flex items-center justify-center p-2 rounded cursor-pointer transition-colors",
                  activeTool === 'hand' ? "highlighted-entry bg-primary/20" : "hover:bg-accent"
                )} 
                onClick={(e) => handleClick(e, 'hand-tool')}
                data-action="hand-tool" 
                data-group="TOOL"
                title="Hand Tool"
              >
                <i className="bpmn-entry-icon bpmn-icon-hand-tool"></i>
              </div>
              <div 
                className={cn(
                  "bpmn-entry flex items-center justify-center p-2 rounded cursor-pointer transition-colors",
                  activeTool === 'lasso' ? "highlighted-entry bg-primary/20" : "hover:bg-accent"
                )} 
                onClick={(e) => handleClick(e, 'lasso-tool')}
                data-action="lasso-tool" 
                data-group="TOOL"
                title="Lasso Tool"
              >
                <i className="bpmn-entry-icon bpmn-icon-lasso-tool"></i>
              </div>
              <div 
                className={cn(
                  "bpmn-entry flex items-center justify-center p-2 rounded cursor-pointer transition-colors",
                  activeTool === 'space' ? "highlighted-entry bg-primary/20" : "hover:bg-accent"
                )} 
                onClick={(e) => handleClick(e, 'space-tool')}
                data-action="space-tool" 
                data-group="TOOL"
                title="Space Tool"
              >
                <i className="bpmn-entry-icon bpmn-icon-space-tool"></i>
              </div>
              <div 
                className={cn(
                  "bpmn-entry flex items-center justify-center p-2 rounded cursor-pointer transition-colors",
                  activeTool === 'global-connect' ? "highlighted-entry bg-primary/20" : "hover:bg-accent"
                )} 
                onClick={(e) => handleClick(e, 'global-connect-tool')}
                data-action="global-connect-tool" 
                data-group="TOOL"
                title="Global Connect"
              >
                <i className="bpmn-entry-icon bpmn-icon-connection-multi"></i>
              </div>
            </div>
            
            {/* Visual Separator */}
            <div role="separator" className="h-px bg-border" style={{margin: '8px 0'}}></div>
            
            {/* Render collapsed groups - one icon per group with click popover */}
            {BPMN_ELEMENTS_REGISTRY.map((group) => (
              <div 
                key={group.id}
                className="bpmn-entry flex items-center justify-center p-2 rounded cursor-pointer hover:bg-accent transition-colors" 
                onClick={(e) => handleGroupClick(e, group.id)}
                data-group={group.id}
                title={`Click to show ${group.title}`}
                style={{ color: group.items[0]?.color }}
              >
                <i className={`bpmn-entry-icon ${group.icon}`}></i>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Popover for collapsed state */}
      {isClient && popoverTriggerRef.current && (
        <BpmnPalettePopover
          triggerRef={{ current: popoverTriggerRef.current }}
          groupId={hoveredGroup || undefined}
          isVisible={showPopover && !isOpen}
          onClose={() => {
            setShowPopover(false)
            setHoveredGroup(null)
          }}
          onAction={handlePopoverAction}
        />
      )}
    </>
  )
})