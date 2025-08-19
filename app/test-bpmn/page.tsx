'use client'

import { useEffect, useRef, useState } from 'react'
import BpmnModeler from 'bpmn-js/lib/Modeler'

const initialDiagram = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
  id="Definitions_1" 
  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" name="Start">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_1" name="Sample Task">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_1" name="End">
      <bpmn:incoming>Flow_2</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="152" y="102" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="158" y="145" width="24" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1">
        <dc:Bounds x="240" y="80" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="392" y="102" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="400" y="145" width="20" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="188" y="120" />
        <di:waypoint x="240" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="340" y="120" />
        <di:waypoint x="392" y="120" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`

export default function TestBpmnPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState('Initializing...')
  const [error, setError] = useState<string | null>(null)
  const modelerRef = useRef<BpmnModeler | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const initModeler = async () => {
      try {
        setStatus('Creating BPMN Modeler...')
        
        // Create modeler
        const modeler = new BpmnModeler({
          container: containerRef.current!,
          keyboard: {
            bindTo: window
          }
        })
        
        modelerRef.current = modeler
        setStatus('Importing diagram...')
        
        // Import diagram
        await modeler.importXML(initialDiagram)
        
        setStatus('✅ BPMN Canvas Working!')
        
        // Zoom to fit
        const canvas = modeler.get('canvas') as any
        canvas.zoom('fit-viewport')
        
      } catch (err) {
        console.error('BPMN Error:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setStatus('❌ BPMN Canvas Failed')
      }
    }

    initModeler()

    // Cleanup
    return () => {
      if (modelerRef.current) {
        modelerRef.current.destroy()
        modelerRef.current = null
      }
    }
  }, [])

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">BPMN Canvas Test</h1>
        
        <div className="mb-4 p-4 bg-blue-50 rounded">
          <p className="font-semibold">Status: {status}</p>
          {error && (
            <div className="mt-2 p-2 bg-red-100 text-red-700 rounded">
              Error: {error}
            </div>
          )}
        </div>

        <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
          <div 
            ref={containerRef} 
            className="w-full bg-white"
            style={{ height: '600px' }}
          />
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Test Information:</h3>
          <ul className="text-sm space-y-1">
            <li>• Testing direct BPMN.js import</li>
            <li>• Should show Start → Task → End flow</li>
            <li>• If this works, issue is in our wrapper components</li>
            <li>• If this fails, issue is with BPMN.js library itself</li>
          </ul>
        </div>
      </div>
    </div>
  )
}