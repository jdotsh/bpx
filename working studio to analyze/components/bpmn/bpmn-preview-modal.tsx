'use client'

import { useEffect, useState } from 'react'
import { X, Copy, CheckCircle2, FileCode2, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BpmnPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  xml: string
}

interface EntityCount {
  tasks: number
  events: number
  gateways: number
  dataObjects: number
  participants: number
  total: number
}

export function BpmnPreviewModal({ isOpen, onClose, xml }: BpmnPreviewModalProps) {
  const [highlightedXml, setHighlightedXml] = useState('')
  const [copied, setCopied] = useState(false)
  const [entityCount, setEntityCount] = useState<EntityCount>({
    tasks: 0,
    events: 0,
    gateways: 0,
    dataObjects: 0,
    participants: 0,
    total: 0
  })

  useEffect(() => {
    if (xml) {
      // Format and highlight XML
      const formatted = formatXml(xml)
      setHighlightedXml(formatted)
      
      // Count entities
      countEntities(xml)
    }
  }, [xml])

  const countEntities = (xmlString: string) => {
    const tasks = (xmlString.match(/<bpmn:(task|userTask|serviceTask|scriptTask|manualTask|receiveTask|sendTask)/gi) || []).length
    const startEvents = (xmlString.match(/<bpmn:startEvent/gi) || []).length
    const endEvents = (xmlString.match(/<bpmn:endEvent/gi) || []).length
    const intermediateEvents = (xmlString.match(/<bpmn:intermediate.*Event/gi) || []).length
    const boundaryEvents = (xmlString.match(/<bpmn:boundaryEvent/gi) || []).length
    const gateways = (xmlString.match(/<bpmn:.*Gateway/gi) || []).length
    const dataObjects = (xmlString.match(/<bpmn:(dataObject|dataStore)/gi) || []).length
    const participants = (xmlString.match(/<bpmn:participant/gi) || []).length
    
    const events = startEvents + endEvents + intermediateEvents + boundaryEvents
    const total = tasks + events + gateways + dataObjects + participants
    
    setEntityCount({
      tasks,
      events,
      gateways,
      dataObjects,
      participants,
      total
    })
  }

  const formatXml = (xml: string): string => {
    // Basic XML formatting with proper indentation
    let formatted = ''
    let indent = 0
    const lines = xml.split(/>\s*</)
    
    lines.forEach((line, index) => {
      if (index === 0) {
        formatted += line
      } else {
        if (line.match(/^\/\w/)) {
          indent--
        }
        
        const padding = '  '.repeat(Math.max(0, indent))
        formatted += '\n' + padding + '<' + line
        
        if (!line.match(/^\//) && !line.match(/\/\s*$/)) {
          indent++
        }
      }
    })
    
    return formatted
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(xml)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={cn(
        "relative z-10 w-[64vw] max-h-[80vh] bg-card rounded-lg shadow-xl",
        "border border-border overflow-hidden flex flex-col"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Preview</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileCode2 className="h-4 w-4" />
              <span className="font-medium">BPMN 2.0</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Action Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-4">
            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md transition-all",
                "hover:bg-accent text-sm font-medium",
                copied ? "bg-green-500/20 text-green-600 dark:text-green-400" : "bg-card"
              )}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy XML
                </>
              )}
            </button>
            
            {/* Entity Counter */}
            <div className="flex items-center gap-3 px-3 py-1.5 bg-card rounded-md">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">Entities:</span>
                <div className="flex items-center gap-3">
                  {entityCount.tasks > 0 && (
                    <span className="font-medium">
                      <span className="text-blue-600 dark:text-blue-400">{entityCount.tasks}</span>
                      <span className="text-muted-foreground ml-1">Tasks</span>
                    </span>
                  )}
                  {entityCount.events > 0 && (
                    <span className="font-medium">
                      <span className="text-green-600 dark:text-green-400">{entityCount.events}</span>
                      <span className="text-muted-foreground ml-1">Events</span>
                    </span>
                  )}
                  {entityCount.gateways > 0 && (
                    <span className="font-medium">
                      <span className="text-yellow-600 dark:text-yellow-400">{entityCount.gateways}</span>
                      <span className="text-muted-foreground ml-1">Gateways</span>
                    </span>
                  )}
                  {entityCount.dataObjects > 0 && (
                    <span className="font-medium">
                      <span className="text-purple-600 dark:text-purple-400">{entityCount.dataObjects}</span>
                      <span className="text-muted-foreground ml-1">Data</span>
                    </span>
                  )}
                  {entityCount.participants > 0 && (
                    <span className="font-medium">
                      <span className="text-indigo-600 dark:text-indigo-400">{entityCount.participants}</span>
                      <span className="text-muted-foreground ml-1">Pools</span>
                    </span>
                  )}
                  {entityCount.total === 0 && (
                    <span className="text-muted-foreground">No entities</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Total Count Badge */}
          {entityCount.total > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
              <span>Total:</span>
              <span className="font-bold">{entityCount.total}</span>
            </div>
          )}
        </div>
        
        {/* Body */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="preview-model">
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
              <code className="text-sm font-mono whitespace-pre">
                {highlightedXml}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}