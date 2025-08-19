export interface BpmnElement {
  action: string
  type: string
  icon: string
  title: string
  color?: string
  eventDefinitionType?: string
  isExpanded?: boolean
}

export interface BpmnElementGroup {
  id: string
  title: string
  icon: string
  items: BpmnElement[]
}

export const BPMN_ELEMENTS_REGISTRY: BpmnElementGroup[] = [
  // Order: Tools (handled separately), Start Events, Tasks, Gateways, End Events, Intermediate, Subprocess, Boundary, Participants
  
  // 1. START EVENTS
  {
    id: 'start-events',
    title: 'Start Events',
    icon: 'bpmn-icon-start-event-none',
    items: [
      {
        action: 'create.start-event',
        type: 'bpmn:StartEvent',
        icon: 'bpmn-icon-start-event-none',
        title: 'Start Event',
        color: 'var(--color-start-event)'
      },
      {
        action: 'create.start-event-message',
        type: 'bpmn:StartEvent',
        eventDefinitionType: 'bpmn:MessageEventDefinition',
        icon: 'bpmn-icon-start-event-message',
        title: 'Message Start Event',
        color: 'var(--color-start-event)'
      },
      {
        action: 'create.start-event-timer',
        type: 'bpmn:StartEvent',
        eventDefinitionType: 'bpmn:TimerEventDefinition',
        icon: 'bpmn-icon-start-event-timer',
        title: 'Timer Start Event',
        color: 'var(--color-start-event)'
      },
      {
        action: 'create.start-event-conditional',
        type: 'bpmn:StartEvent',
        eventDefinitionType: 'bpmn:ConditionalEventDefinition',
        icon: 'bpmn-icon-start-event-condition',
        title: 'Conditional Start Event',
        color: 'var(--color-start-event)'
      },
      {
        action: 'create.start-event-signal',
        type: 'bpmn:StartEvent',
        eventDefinitionType: 'bpmn:SignalEventDefinition',
        icon: 'bpmn-icon-start-event-signal',
        title: 'Signal Start Event',
        color: 'var(--color-start-event)'
      },
      {
        action: 'create.start-event-error',
        type: 'bpmn:StartEvent',
        eventDefinitionType: 'bpmn:ErrorEventDefinition',
        icon: 'bpmn-icon-start-event-error',
        title: 'Error Start Event',
        color: 'var(--color-start-event)'
      },
      {
        action: 'create.start-event-escalation',
        type: 'bpmn:StartEvent',
        eventDefinitionType: 'bpmn:EscalationEventDefinition',
        icon: 'bpmn-icon-start-event-escalation',
        title: 'Escalation Start Event',
        color: 'var(--color-start-event)'
      },
      {
        action: 'create.start-event-compensation',
        type: 'bpmn:StartEvent',
        eventDefinitionType: 'bpmn:CompensateEventDefinition',
        icon: 'bpmn-icon-start-event-compensation',
        title: 'Compensation Start Event',
        color: 'var(--color-start-event)'
      }
    ]
  },
  
  // 2. TASKS
  {
    id: 'tasks',
    title: 'Tasks',
    icon: 'bpmn-icon-task',
    items: [
      {
        action: 'create.task',
        type: 'bpmn:Task',
        icon: 'bpmn-icon-task',
        title: 'Task',
        color: 'var(--color-activity)'
      },
      {
        action: 'create.user-task',
        type: 'bpmn:UserTask',
        icon: 'bpmn-icon-user-task',
        title: 'User Task',
        color: 'var(--color-activity)'
      },
      {
        action: 'create.service-task',
        type: 'bpmn:ServiceTask',
        icon: 'bpmn-icon-service-task',
        title: 'Service Task',
        color: 'var(--color-activity)'
      },
      {
        action: 'create.script-task',
        type: 'bpmn:ScriptTask',
        icon: 'bpmn-icon-script-task',
        title: 'Script Task',
        color: 'var(--color-activity)'
      },
      {
        action: 'create.business-rule-task',
        type: 'bpmn:BusinessRuleTask',
        icon: 'bpmn-icon-business-rule-task',
        title: 'Business Rule Task',
        color: 'var(--color-activity)'
      },
      {
        action: 'create.send-task',
        type: 'bpmn:SendTask',
        icon: 'bpmn-icon-send-task',
        title: 'Send Task',
        color: 'var(--color-activity)'
      },
      {
        action: 'create.receive-task',
        type: 'bpmn:ReceiveTask',
        icon: 'bpmn-icon-receive-task',
        title: 'Receive Task',
        color: 'var(--color-activity)'
      },
      {
        action: 'create.manual-task',
        type: 'bpmn:ManualTask',
        icon: 'bpmn-icon-manual-task',
        title: 'Manual Task',
        color: 'var(--color-activity)'
      }
    ]
  },
  
  // 3. GATEWAYS
  {
    id: 'gateways',
    title: 'Gateways',
    icon: 'bpmn-icon-gateway-none',
    items: [
      {
        action: 'create.exclusive-gateway',
        type: 'bpmn:ExclusiveGateway',
        icon: 'bpmn-icon-gateway-xor',
        title: 'Exclusive Gateway',
        color: 'var(--color-gateway)'
      },
      {
        action: 'create.parallel-gateway',
        type: 'bpmn:ParallelGateway',
        icon: 'bpmn-icon-gateway-parallel',
        title: 'Parallel Gateway',
        color: 'var(--color-gateway)'
      },
      {
        action: 'create.inclusive-gateway',
        type: 'bpmn:InclusiveGateway',
        icon: 'bpmn-icon-gateway-or',
        title: 'Inclusive Gateway',
        color: 'var(--color-gateway)'
      },
      {
        action: 'create.event-based-gateway',
        type: 'bpmn:EventBasedGateway',
        icon: 'bpmn-icon-gateway-eventbased',
        title: 'Event-based Gateway',
        color: 'var(--color-gateway)'
      },
      {
        action: 'create.complex-gateway',
        type: 'bpmn:ComplexGateway',
        icon: 'bpmn-icon-gateway-complex',
        title: 'Complex Gateway',
        color: 'var(--color-gateway)'
      }
    ]
  },
  
  // 4. END EVENTS
  {
    id: 'end-events',
    title: 'End Events',
    icon: 'bpmn-icon-end-event-none',
    items: [
      {
        action: 'create.end-event',
        type: 'bpmn:EndEvent',
        icon: 'bpmn-icon-end-event-none',
        title: 'End Event',
        color: 'var(--color-end-event)'
      },
      {
        action: 'create.end-event-message',
        type: 'bpmn:EndEvent',
        eventDefinitionType: 'bpmn:MessageEventDefinition',
        icon: 'bpmn-icon-end-event-message',
        title: 'Message End Event',
        color: 'var(--color-end-event)'
      },
      {
        action: 'create.end-event-escalation',
        type: 'bpmn:EndEvent',
        eventDefinitionType: 'bpmn:EscalationEventDefinition',
        icon: 'bpmn-icon-end-event-escalation',
        title: 'Escalation End Event',
        color: 'var(--color-end-event)'
      },
      {
        action: 'create.end-event-error',
        type: 'bpmn:EndEvent',
        eventDefinitionType: 'bpmn:ErrorEventDefinition',
        icon: 'bpmn-icon-end-event-error',
        title: 'Error End Event',
        color: 'var(--color-end-event)'
      },
      {
        action: 'create.end-event-compensation',
        type: 'bpmn:EndEvent',
        eventDefinitionType: 'bpmn:CompensateEventDefinition',
        icon: 'bpmn-icon-end-event-compensation',
        title: 'Compensation End Event',
        color: 'var(--color-end-event)'
      },
      {
        action: 'create.end-event-signal',
        type: 'bpmn:EndEvent',
        eventDefinitionType: 'bpmn:SignalEventDefinition',
        icon: 'bpmn-icon-end-event-signal',
        title: 'Signal End Event',
        color: 'var(--color-end-event)'
      },
      {
        action: 'create.end-event-terminate',
        type: 'bpmn:EndEvent',
        eventDefinitionType: 'bpmn:TerminateEventDefinition',
        icon: 'bpmn-icon-end-event-terminate',
        title: 'Terminate End Event',
        color: 'var(--color-end-event)'
      },
      {
        action: 'create.end-event-cancel',
        type: 'bpmn:EndEvent',
        eventDefinitionType: 'bpmn:CancelEventDefinition',
        icon: 'bpmn-icon-end-event-cancel',
        title: 'Cancel End Event',
        color: 'var(--color-end-event)'
      },
      {
        action: 'create.end-event-link',
        type: 'bpmn:EndEvent',
        eventDefinitionType: 'bpmn:LinkEventDefinition',
        icon: 'bpmn-icon-end-event-link',
        title: 'Link End Event',
        color: 'var(--color-end-event)'
      }
    ]
  },
  
  // 5. INTERMEDIATE EVENTS
  {
    id: 'intermediate-events',
    title: 'Intermediate Events',
    icon: 'bpmn-icon-intermediate-event-none',
    items: [
      {
        action: 'create.intermediate-throw-event',
        type: 'bpmn:IntermediateThrowEvent',
        icon: 'bpmn-icon-intermediate-event-none',
        title: 'Intermediate Throw Event',
        color: 'var(--color-throw-event)'
      },
      {
        action: 'create.intermediate-catch-event',
        type: 'bpmn:IntermediateCatchEvent',
        icon: 'bpmn-icon-intermediate-event-none',
        title: 'Intermediate Catch Event',
        color: 'var(--color-catch-event)'
      },
      {
        action: 'create.intermediate-catch-event-message',
        type: 'bpmn:IntermediateCatchEvent',
        eventDefinitionType: 'bpmn:MessageEventDefinition',
        icon: 'bpmn-icon-intermediate-event-catch-message',
        title: 'Message Intermediate Catch Event',
        color: 'var(--color-catch-event)'
      },
      {
        action: 'create.intermediate-throw-event-message',
        type: 'bpmn:IntermediateThrowEvent',
        eventDefinitionType: 'bpmn:MessageEventDefinition',
        icon: 'bpmn-icon-intermediate-event-throw-message',
        title: 'Message Intermediate Throw Event',
        color: 'var(--color-throw-event)'
      },
      {
        action: 'create.intermediate-catch-event-timer',
        type: 'bpmn:IntermediateCatchEvent',
        eventDefinitionType: 'bpmn:TimerEventDefinition',
        icon: 'bpmn-icon-intermediate-event-catch-timer',
        title: 'Timer Intermediate Catch Event',
        color: 'var(--color-catch-event)'
      },
      {
        action: 'create.intermediate-catch-event-conditional',
        type: 'bpmn:IntermediateCatchEvent',
        eventDefinitionType: 'bpmn:ConditionalEventDefinition',
        icon: 'bpmn-icon-intermediate-event-catch-condition',
        title: 'Conditional Intermediate Catch Event',
        color: 'var(--color-catch-event)'
      },
      {
        action: 'create.intermediate-catch-event-link',
        type: 'bpmn:IntermediateCatchEvent',
        eventDefinitionType: 'bpmn:LinkEventDefinition',
        icon: 'bpmn-icon-intermediate-event-catch-link',
        title: 'Link Intermediate Catch Event',
        color: 'var(--color-catch-event)'
      },
      {
        action: 'create.intermediate-throw-event-link',
        type: 'bpmn:IntermediateThrowEvent',
        eventDefinitionType: 'bpmn:LinkEventDefinition',
        icon: 'bpmn-icon-intermediate-event-throw-link',
        title: 'Link Intermediate Throw Event',
        color: 'var(--color-throw-event)'
      },
      {
        action: 'create.intermediate-catch-event-signal',
        type: 'bpmn:IntermediateCatchEvent',
        eventDefinitionType: 'bpmn:SignalEventDefinition',
        icon: 'bpmn-icon-intermediate-event-catch-signal',
        title: 'Signal Intermediate Catch Event',
        color: 'var(--color-catch-event)'
      },
      {
        action: 'create.intermediate-throw-event-signal',
        type: 'bpmn:IntermediateThrowEvent',
        eventDefinitionType: 'bpmn:SignalEventDefinition',
        icon: 'bpmn-icon-intermediate-event-throw-signal',
        title: 'Signal Intermediate Throw Event',
        color: 'var(--color-throw-event)'
      },
      {
        action: 'create.intermediate-throw-event-compensation',
        type: 'bpmn:IntermediateThrowEvent',
        eventDefinitionType: 'bpmn:CompensateEventDefinition',
        icon: 'bpmn-icon-intermediate-event-throw-compensation',
        title: 'Compensation Intermediate Throw Event',
        color: 'var(--color-throw-event)'
      },
      {
        action: 'create.intermediate-throw-event-escalation',
        type: 'bpmn:IntermediateThrowEvent',
        eventDefinitionType: 'bpmn:EscalationEventDefinition',
        icon: 'bpmn-icon-intermediate-event-throw-escalation',
        title: 'Escalation Intermediate Throw Event',
        color: 'var(--color-throw-event)'
      }
    ]
  },
  
  // 6. SUBPROCESS
  {
    id: 'subprocess',
    title: 'Sub Process',
    icon: 'bpmn-icon-subprocess-expanded',
    items: [
      {
        action: 'create.subprocess-expanded',
        type: 'bpmn:SubProcess',
        icon: 'bpmn-icon-subprocess-expanded',
        title: 'Sub Process (Expanded)',
        color: 'var(--color-activity)',
        isExpanded: true
      },
      {
        action: 'create.subprocess-collapsed',
        type: 'bpmn:SubProcess',
        icon: 'bpmn-icon-subprocess-collapsed',
        title: 'Sub Process (Collapsed)',
        color: 'var(--color-activity)',
        isExpanded: false
      },
      {
        action: 'create.event-subprocess-expanded',
        type: 'bpmn:SubProcess',
        eventDefinitionType: 'bpmn:EventSubProcess',
        icon: 'bpmn-icon-event-subprocess-expanded',
        title: 'Event Sub Process',
        color: 'var(--color-activity)',
        isExpanded: true
      },
      {
        action: 'create.transaction',
        type: 'bpmn:Transaction',
        icon: 'bpmn-icon-transaction',
        title: 'Transaction',
        color: 'var(--color-activity)',
        isExpanded: true
      },
      {
        action: 'create.call-activity',
        type: 'bpmn:CallActivity',
        icon: 'bpmn-icon-call-activity',
        title: 'Call Activity',
        color: 'var(--color-activity)'
      }
    ]
  },
  
  // 7. BOUNDARY EVENTS
  {
    id: 'boundary-events',
    title: 'Boundary Events',
    icon: 'bpmn-icon-intermediate-event-none',
    items: [
      {
        action: 'create.boundary-event',
        type: 'bpmn:BoundaryEvent',
        icon: 'bpmn-icon-intermediate-event-none',
        title: 'Boundary Event',
        color: 'var(--color-catch-event)'
      },
      {
        action: 'create.boundary-event-message',
        type: 'bpmn:BoundaryEvent',
        eventDefinitionType: 'bpmn:MessageEventDefinition',
        icon: 'bpmn-icon-intermediate-event-catch-message',
        title: 'Message Boundary Event',
        color: 'var(--color-catch-event)'
      },
      {
        action: 'create.boundary-event-timer',
        type: 'bpmn:BoundaryEvent',
        eventDefinitionType: 'bpmn:TimerEventDefinition',
        icon: 'bpmn-icon-intermediate-event-catch-timer',
        title: 'Timer Boundary Event',
        color: 'var(--color-catch-event)'
      },
      {
        action: 'create.boundary-event-escalation',
        type: 'bpmn:BoundaryEvent',
        eventDefinitionType: 'bpmn:EscalationEventDefinition',
        icon: 'bpmn-icon-intermediate-event-catch-escalation',
        title: 'Escalation Boundary Event',
        color: 'var(--color-catch-event)'
      },
      {
        action: 'create.boundary-event-conditional',
        type: 'bpmn:BoundaryEvent',
        eventDefinitionType: 'bpmn:ConditionalEventDefinition',
        icon: 'bpmn-icon-intermediate-event-catch-condition',
        title: 'Conditional Boundary Event',
        color: 'var(--color-catch-event)'
      },
      {
        action: 'create.boundary-event-error',
        type: 'bpmn:BoundaryEvent',
        eventDefinitionType: 'bpmn:ErrorEventDefinition',
        icon: 'bpmn-icon-intermediate-event-catch-error',
        title: 'Error Boundary Event',
        color: 'var(--color-catch-event)'
      },
      {
        action: 'create.boundary-event-signal',
        type: 'bpmn:BoundaryEvent',
        eventDefinitionType: 'bpmn:SignalEventDefinition',
        icon: 'bpmn-icon-intermediate-event-catch-signal',
        title: 'Signal Boundary Event',
        color: 'var(--color-catch-event)'
      },
      {
        action: 'create.boundary-event-compensation',
        type: 'bpmn:BoundaryEvent',
        eventDefinitionType: 'bpmn:CompensateEventDefinition',
        icon: 'bpmn-icon-intermediate-event-catch-compensation',
        title: 'Compensation Boundary Event',
        color: 'var(--color-catch-event)'
      },
      {
        action: 'create.boundary-event-cancel',
        type: 'bpmn:BoundaryEvent',
        eventDefinitionType: 'bpmn:CancelEventDefinition',
        icon: 'bpmn-icon-intermediate-event-catch-cancel',
        title: 'Cancel Boundary Event',
        color: 'var(--color-catch-event)'
      }
    ]
  },
  
  // 8. PARTICIPANTS
  {
    id: 'participants',
    title: 'Participants',
    icon: 'bpmn-icon-participant',
    items: [
      {
        action: 'create.participant-expanded',
        type: 'bpmn:Participant',
        icon: 'bpmn-icon-participant',
        title: 'Pool',
        color: 'var(--color-participant)',
        isExpanded: true
      },
      {
        action: 'create.participant-collapsed',
        type: 'bpmn:Participant',
        icon: 'bpmn-icon-lane',
        title: 'Collapsed Pool',
        color: 'var(--color-participant)',
        isExpanded: false
      },
      {
        action: 'create.lane',
        type: 'bpmn:Lane',
        icon: 'bpmn-icon-lane',
        title: 'Lane',
        color: 'var(--color-participant)'
      }
    ]
  },
  
  // Additional groups that were in the original but not in the specified order
  {
    id: 'data',
    title: 'Data Objects',
    icon: 'bpmn-icon-data-object',
    items: [
      {
        action: 'create.data-object',
        type: 'bpmn:DataObjectReference',
        icon: 'bpmn-icon-data-object',
        title: 'Data Object',
        color: 'var(--color-data)'
      },
      {
        action: 'create.data-store',
        type: 'bpmn:DataStoreReference',
        icon: 'bpmn-icon-data-store',
        title: 'Data Store',
        color: 'var(--color-data)'
      },
      {
        action: 'create.data-input',
        type: 'bpmn:DataInput',
        icon: 'bpmn-icon-data-input',
        title: 'Data Input',
        color: 'var(--color-data)'
      },
      {
        action: 'create.data-output',
        type: 'bpmn:DataOutput',
        icon: 'bpmn-icon-data-output',
        title: 'Data Output',
        color: 'var(--color-data)'
      }
    ]
  },
  
  {
    id: 'artifacts',
    title: 'Artifacts',
    icon: 'bpmn-icon-text-annotation',
    items: [
      {
        action: 'create.group',
        type: 'bpmn:Group',
        icon: 'bpmn-icon-group',
        title: 'Group',
        color: 'var(--color-artifact)'
      },
      {
        action: 'create.text-annotation',
        type: 'bpmn:TextAnnotation',
        icon: 'bpmn-icon-text-annotation',
        title: 'Text Annotation',
        color: 'var(--color-artifact)'
      }
    ]
  }
]

export function getElementByAction(action: string): BpmnElement | undefined {
  for (const group of BPMN_ELEMENTS_REGISTRY) {
    const element = group.items.find(item => item.action === action)
    if (element) {
      return element
    }
  }
  return undefined
}

export function getAllElements(): BpmnElement[] {
  const allElements: BpmnElement[] = []
  for (const group of BPMN_ELEMENTS_REGISTRY) {
    allElements.push(...group.items)
  }
  return allElements
}

export function getElementGroups(): BpmnElementGroup[] {
  return BPMN_ELEMENTS_REGISTRY
}