'use client'

import { useState, useRef, useEffect } from 'react'
import { Download, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExportDropdownProps {
  onExport: (format: 'bpmn' | 'xml' | 'svg' | 'png') => void
  disabled?: boolean
}

export function ExportDropdown({ onExport, disabled = false }: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleExport = (format: 'bpmn' | 'xml' | 'svg' | 'png') => {
    onExport(format)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          disabled && "opacity-50 cursor-not-allowed",
          isOpen && "bg-accent text-accent-foreground"
        )}
        title="Export Diagram"
      >
        <Download className="h-4 w-4" />
        <ChevronDown className="h-3 w-3" />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 left-0 z-50 min-w-[160px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
          <button
            onClick={() => handleExport('bpmn')}
            className="flex w-full items-center px-2 py-1.5 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Download as BPMN
          </button>
          <button
            onClick={() => handleExport('xml')}
            className="flex w-full items-center px-2 py-1.5 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Download as XML
          </button>
          <button
            onClick={() => handleExport('svg')}
            className="flex w-full items-center px-2 py-1.5 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Download as SVG
          </button>
          <button
            onClick={() => handleExport('png')}
            className="flex w-full items-center px-2 py-1.5 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Download as PNG
          </button>
        </div>
      )}
    </div>
  )
}