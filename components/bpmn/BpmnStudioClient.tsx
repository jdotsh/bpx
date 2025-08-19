'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'

// Dynamically import BPMN components to avoid SSR issues
const BpmnStudioContent = dynamic(
  () => import('./BpmnStudioFinalFixed').then(mod => ({ default: mod.BpmnStudioFinalFixed })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading BPMN Studio...</p>
        </div>
      </div>
    )
  }
)

interface Props {
  diagramId?: string
  projectId?: string
}

export function BpmnStudioClient({ diagramId, projectId }: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Only render on client side to avoid hydration issues
  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading BPMN Studio...</p>
        </div>
      </div>
    )
  }

  return <BpmnStudioContent diagramId={diagramId} projectId={projectId} />
}