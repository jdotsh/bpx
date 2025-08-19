'use client'

import { memo, forwardRef } from 'react'
import { BpmnElement } from '@/lib/bpmn-elements'
import { cn } from '@/lib/utils'

interface BpmnElementItemProps {
  element: BpmnElement
  isActive?: boolean
  isCollapsed?: boolean
  onElementClick: (element: BpmnElement, event: React.MouseEvent) => void
  onDragStart: (element: BpmnElement, event: React.DragEvent) => void
  onDragEnd: (element: BpmnElement, event: React.DragEvent) => void
  onKeyDown: (event: React.KeyboardEvent, element: BpmnElement) => void
  className?: string
}

export const BpmnElementItem = memo(forwardRef<HTMLDivElement, BpmnElementItemProps>(
  function BpmnElementItem({
    element,
    isActive = false,
    isCollapsed = false,
    onElementClick,
    onDragStart,
    onDragEnd,
    onKeyDown,
    className
  }, ref) {
    const shortcutsText = element.shortcuts?.join(' + ') || ''
    
    return (
      <div
        ref={ref}
        className={cn(
          'bpmn-element-item group relative flex items-center justify-center rounded-lg border border-border/50 transition-all duration-200',
          'hover:bg-accent hover:border-border cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          element.draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
          isActive && 'bg-primary/10 border-primary/50 ring-2 ring-primary/20',
          isCollapsed ? 'p-2' : 'p-3',
          className
        )}
        role="button"
        tabIndex={0}
        aria-label={`${element.title}${shortcutsText ? ` (${shortcutsText})` : ''}`}
        title={isCollapsed ? `${element.title}${shortcutsText ? ` (${shortcutsText})` : ''}` : element.title}
        draggable={element.draggable}
        data-action={element.action}
        data-group={element.group}
        data-element-id={element.id}
        onClick={(e) => onElementClick(element, e)}
        onDragStart={(e) => onDragStart(element, e)}
        onDragEnd={(e) => onDragEnd(element, e)}
        onKeyDown={(e) => onKeyDown(e, element)}
        style={{
          color: element.color || 'currentColor'
        }}
      >
        {/* BPMN Icon */}
        <i 
          className={cn(
            'bpmn-element-icon',
            element.icon,
            isCollapsed ? 'text-sm' : 'text-base'
          )}
          aria-hidden="true"
        />
        
        {/* Element Label (expanded only) */}
        {!isCollapsed && (
          <span className="ml-2 text-xs font-medium truncate">
            {element.name}
          </span>
        )}
        
        {/* Keyboard Shortcut (expanded only) */}
        {!isCollapsed && shortcutsText && (
          <span className="ml-auto text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            {shortcutsText}
          </span>
        )}
        
        {/* Active Indicator */}
        {isActive && (
          <div 
            className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r"
            aria-hidden="true"
          />
        )}
        
        {/* Drag Handle Indicator */}
        {element.draggable && (
          <div 
            className={cn(
              'absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity',
              'bg-gradient-to-r from-transparent via-primary/5 to-transparent',
              'pointer-events-none'
            )}
            aria-hidden="true"
          />
        )}
      </div>
    )
  }
))

BpmnElementItem.displayName = 'BpmnElementItem'