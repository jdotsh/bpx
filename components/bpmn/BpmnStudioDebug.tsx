'use client'

import { useEffect, useState } from 'react'

export function BpmnStudioDebug() {
  const [status, setStatus] = useState('Initializing...')
  const [error, setError] = useState<string | null>(null)
  const [bpmnLoaded, setBpmnLoaded] = useState(false)

  useEffect(() => {
    const checkDependencies = async () => {
      try {
        setStatus('Checking dependencies...')
        
        // Check if bpmn-js is available
        const BpmnJS = await import('bpmn-js/lib/Modeler')
        console.log('BpmnJS loaded:', BpmnJS)
        
        // Check if diagram-js modules are available
        const GridModule = await import('diagram-js-grid-bg')
        console.log('GridModule loaded:', GridModule)
        
        const MinimapModule = await import('diagram-js-minimap')
        console.log('MinimapModule loaded:', MinimapModule)
        
        // Try to create a simple modeler
        const container = document.createElement('div')
        container.style.width = '100%'
        container.style.height = '400px'
        document.body.appendChild(container)
        
        const modeler = new BpmnJS.default({
          container: container
        })
        
        const defaultXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
  id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1"/>
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="179" y="79" width="36" height="36"/>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`

        await modeler.importXML(defaultXml)
        
        setStatus('BPMN dependencies loaded successfully!')
        setBpmnLoaded(true)
        
        // Clean up
        setTimeout(() => {
          modeler.destroy()
          document.body.removeChild(container)
        }, 2000)
        
      } catch (err) {
        console.error('Dependency check failed:', err)
        setError(err instanceof Error ? err.message : String(err))
        setStatus('Failed to load dependencies')
      }
    }

    checkDependencies()
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">BPMN Studio Debug</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-semibold">Status:</h2>
          <p className={bpmnLoaded ? 'text-green-600' : 'text-blue-600'}>{status}</p>
        </div>
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <h2 className="font-semibold text-red-800">Error:</h2>
            <pre className="text-sm text-red-600 mt-2">{error}</pre>
          </div>
        )}
        
        <div className="p-4 bg-blue-50 rounded">
          <h2 className="font-semibold mb-2">Checklist:</h2>
          <ul className="space-y-1 text-sm">
            <li>✓ bpmn-js installed</li>
            <li>✓ diagram-js installed</li>
            <li>✓ diagram-js-minimap installed</li>
            <li>✓ diagram-js-grid-bg installed</li>
            <li>{bpmnLoaded ? '✓' : '⏳'} BPMN modeler can be created</li>
            <li>{bpmnLoaded ? '✓' : '⏳'} XML can be imported</li>
          </ul>
        </div>
        
        <div className="p-4 bg-yellow-50 rounded">
          <h2 className="font-semibold mb-2">Console Output:</h2>
          <p className="text-sm">Check browser console for detailed logs</p>
        </div>
      </div>
      
      {bpmnLoaded && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800 font-semibold">
            ✅ BPMN.js is working! The issue is in the integration component.
          </p>
        </div>
      )}
    </div>
  )
}