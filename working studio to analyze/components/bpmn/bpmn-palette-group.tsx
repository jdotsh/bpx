'use client'

import { memo } from 'react'
import { ChevronDown } from 'lucide-react'
import { BpmnElement, BpmnElementGroup, BPMN_ELEMENT_GROUPS, getElementsByGroup } from '@/lib/bpmn-elements'
import { BpmnElementItem } from './bpmn-element-item'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface BpmnPaletteGroupProps {
  groupId: BpmnElementGroup
  isExpanded: boolean
  isCollapsed: boolean
  activeElement: string | null
  onToggleGroup: (groupId: BpmnElementGroup) => void
  onElementClick: (element: BpmnElement, event: React.MouseEvent) => void
  onDragStart: (element: BpmnElement, event: React.DragEvent) => void
  onDragEnd: (element: BpmnElement, event: React.DragEvent) => void
  onKeyDown: (event: React.KeyboardEvent, element: BpmnElement) => void
  filteredElements?: BpmnElement[]
}

export const BpmnPaletteGroup = memo(function BpmnPaletteGroup({
  groupId,
  isExpanded,
  isCollapsed,
  activeElement,
  onToggleGroup,
  onElementClick,
  onDragStart,
  onDragEnd,
  onKeyDown,
  filteredElements
}: BpmnPaletteGroupProps) {
  const group = BPMN_ELEMENT_GROUPS[groupId]
  const elements = filteredElements || getElementsByGroup(groupId)
  
  if (elements.length === 0) return null

  const renderElements = () => (
    <div 
      className={cn(
        'grid gap-2',
        isCollapsed ? 'grid-cols-1' : 'grid-cols-4'
      )}
    >
      {elements.map((element) => (
        <BpmnElementItem
          key={element.id}
          element={element}
          isActive={activeElement === element.id}
          isCollapsed={isCollapsed}
          onElementClick={onElementClick}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onKeyDown={onKeyDown}
        />
      ))}
    </div>
  )

  if (isCollapsed) {
    return (
      <div className="border-b border-border/30 last:border-b-0">
        {renderElements()}
      </div>
    )
  }

  return (
    <div className="border-b border-border/30 last:border-b-0">
      {/* Group Header */}
      <Button
        variant="ghost"
        onClick={() => onToggleGroup(groupId)}
        className={cn(
          'w-full h-auto p-3 justify-between hover:bg-accent/50 rounded-none',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
        )}
        aria-expanded={isExpanded}
        aria-controls={`bpmn-group-${groupId}`}
      >
        <div className="flex items-center gap-2">
          {/* Group Icon */}
          <div 
            className="w-3.5 h-3.5 flex-shrink-0"
            style={{ color: group.color }}
            aria-hidden="true"
          >
            {groupId === 'TOOL' && (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            )}
            {groupId === 'START_EVENTS' && (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
              </svg>
            )}
            {groupId === 'END_EVENTS' && (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" fill="currentColor"/>
              </svg>
            )}
            {groupId === 'INTERMEDIATE_EVENTS' && (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" strokeDasharray="3 3"/>
              </svg>
            )}
            {groupId === 'TASKS' && (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            )}
            {groupId === 'GATEWAYS' && (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z"/>
              </svg>
            )}
            {groupId === 'SUBPROCESS' && (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2"/>
              </svg>
            )}
            {groupId === 'DATA' && (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
                <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
              </svg>
            )}
            {groupId === 'PARTICIPANTS' && (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            )}
          </div>
          
          <span className="text-sm font-medium">{group.name}</span>
        </div>
        
        <ChevronDown 
          className={cn(
            'h-4 w-4 transition-transform duration-200',
            isExpanded ? 'rotate-0' : '-rotate-90'
          )}
          aria-hidden="true"
        />
      </Button>
      
      {/* Group Content */}
      {isExpanded && (
        <div 
          id={`bpmn-group-${groupId}`}
          className="px-3 pb-3"
          role="region"
          aria-labelledby={`bpmn-group-header-${groupId}`}
        >
          {renderElements()}
        </div>
      )}
    </div>
  )
})

BpmnPaletteGroup.displayName = 'BpmnPaletteGroup'