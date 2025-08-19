'use client'

import { BpmnStudio } from '@/components/bpmn/bpmn-studio'
import { ErrorBoundary } from '@/components/error-boundary'

export default function StudioPage() {
  return (
    <div className="h-screen">
      <ErrorBoundary>
        <BpmnStudio />
      </ErrorBoundary>
    </div>
  )
}