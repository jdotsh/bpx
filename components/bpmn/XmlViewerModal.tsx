'use client'

import { useState, useEffect } from 'react'
import { X, Copy, Check, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface XmlViewerModalProps {
  isOpen: boolean
  onClose: () => void
  xml: string
  onSave?: (xml: string) => void
  readOnly?: boolean
}

export function XmlViewerModal({ isOpen, onClose, xml, onSave, readOnly = false }: XmlViewerModalProps) {
  const [editedXml, setEditedXml] = useState(xml)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setEditedXml(xml)
    setError(null)
  }, [xml])

  if (!isOpen) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(editedXml)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([editedXml], { type: 'text/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'diagram.bpmn'
    a.click()
    URL.revokeObjectURL(url)
  }

  const validateXml = (xmlString: string) => {
    try {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml')
      const errorNode = xmlDoc.querySelector('parsererror')
      if (errorNode) {
        setError('Invalid XML: ' + errorNode.textContent)
        return false
      }
      setError(null)
      return true
    } catch (e) {
      setError('XML parsing error')
      return false
    }
  }

  const handleSave = () => {
    if (validateXml(editedXml) && onSave) {
      onSave(editedXml)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card w-[90%] max-w-5xl h-[80vh] rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">BPMN XML {readOnly ? 'Viewer' : 'Editor'}</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="flex items-center gap-2"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* XML Content */}
        <div className="flex-1 p-4 overflow-hidden">
          <textarea
            value={editedXml}
            onChange={(e) => {
              setEditedXml(e.target.value)
              validateXml(e.target.value)
            }}
            readOnly={readOnly}
            className="w-full h-full p-4 font-mono text-sm bg-muted rounded border resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            spellCheck={false}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="px-4 pb-2">
            <div className="text-sm text-destructive bg-destructive/10 rounded p-2">
              {error}
            </div>
          </div>
        )}

        {/* Footer */}
        {!readOnly && (
          <div className="flex items-center justify-end gap-2 p-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!!error}>
              Apply Changes
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}