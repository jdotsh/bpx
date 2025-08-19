export interface BpmnElement {
  id: string
  name: string
  title: string
  action: string
  icon: string
  group: BpmnElementGroup
  shortcuts?: string[]
  draggable: boolean
  color?: string
}

export type BpmnElementGroup = 
  | 'TOOL'
  | 'START_EVENTS' 
  | 'END_EVENTS'
  | 'INTERMEDIATE_EVENTS'
  | 'TASKS'
  | 'GATEWAYS'
  | 'SUBPROCESS'
  | 'DATA'
  | 'PARTICIPANTS'

export interface BpmnElementGroupConfig {
  id: BpmnElementGroup
  name: string
  icon: string
  color: string
  expanded: boolean
}

export const BPMN_ELEMENT_GROUPS: Record<BpmnElementGroup, BpmnElementGroupConfig> = {
  TOOL: {
    id: 'TOOL',
    name: 'Tools',
    icon: 'wrench',
    color: 'var(--color-tools)',
    expanded: true
  },
  START_EVENTS: {
    id: 'START_EVENTS',
    name: 'Start Events',
    icon: 'circle',
    color: 'var(--color-start-event)',
    expanded: true
  },
  END_EVENTS: {
    id: 'END_EVENTS',
    name: 'End Events',
    icon: 'circle-dot',
    color: 'var(--color-end-event)',
    expanded: true
  },
  INTERMEDIATE_EVENTS: {
    id: 'INTERMEDIATE_EVENTS',
    name: 'Intermediate Events',
    icon: 'circle-dashed',
    color: 'var(--color-intermediate-event)',
    expanded: false
  },
  TASKS: {
    id: 'TASKS',
    name: 'Tasks',
    icon: 'user',
    color: 'var(--color-activity)',
    expanded: true
  },
  GATEWAYS: {
    id: 'GATEWAYS',
    name: 'Gateways',
    icon: 'diamond',
    color: 'var(--color-gateway)',
    expanded: true
  },
  SUBPROCESS: {
    id: 'SUBPROCESS',
    name: 'Subprocess',
    icon: 'square',
    color: 'var(--color-activity)',
    expanded: false
  },
  DATA: {
    id: 'DATA',
    name: 'Data Objects',
    icon: 'file',
    color: 'var(--color-data)',
    expanded: false
  },
  PARTICIPANTS: {
    id: 'PARTICIPANTS',
    name: 'Participants',
    icon: 'users',
    color: 'var(--color-participant)',
    expanded: false
  }
}

export const BPMN_ELEMENTS: BpmnElement[] = [
  // Tools
  {
    id: 'hand-tool',
    name: 'Hand Tool',
    title: 'Hand Tool',
    action: 'hand-tool',
    icon: 'bpmn-icon-hand-tool',
    group: 'TOOL',
    shortcuts: ['H'],
    draggable: false
  },
  {
    id: 'lasso-tool',
    name: 'Lasso Tool', 
    title: 'Lasso Tool',
    action: 'lasso-tool',
    icon: 'bpmn-icon-lasso-tool',
    group: 'TOOL',
    shortcuts: ['L'],
    draggable: false
  },
  {
    id: 'space-tool',
    name: 'Space Tool',
    title: 'Space Tool', 
    action: 'space-tool',
    icon: 'bpmn-icon-space-tool',
    group: 'TOOL',
    shortcuts: ['S'],
    draggable: false
  },
  {
    id: 'global-connect-tool',
    name: 'Connect Tool',
    title: 'Connect Tool',
    action: 'global-connect-tool',
    icon: 'bpmn-icon-connection-multi',
    group: 'TOOL',
    shortcuts: ['C'],
    draggable: false
  },

  // Start Events
  {
    id: 'start-event',
    name: 'Start Event',
    title: 'Start Event',
    action: 'create.start-event',
    icon: 'bpmn-icon-start-event-none',
    group: 'START_EVENTS',
    color: 'var(--color-start-event)',
    draggable: true
  },
  {
    id: 'start-event-message',
    name: 'Message Start',
    title: 'Message Start Event',
    action: 'create.start-event-message',
    icon: 'bpmn-icon-start-event-message',
    group: 'START_EVENTS',
    color: 'var(--color-start-event)',
    draggable: true
  },
  {
    id: 'start-event-timer',
    name: 'Timer Start',
    title: 'Timer Start Event',
    action: 'create.start-event-timer',
    icon: 'bpmn-icon-start-event-timer',
    group: 'START_EVENTS',
    color: 'var(--color-start-event)',
    draggable: true
  },
  {
    id: 'start-event-signal',
    name: 'Signal Start',
    title: 'Signal Start Event',
    action: 'create.start-event-signal',
    icon: 'bpmn-icon-start-event-signal',
    group: 'START_EVENTS',
    color: 'var(--color-start-event)',
    draggable: true
  },

  // End Events
  {
    id: 'end-event',
    name: 'End Event',
    title: 'End Event',
    action: 'create.end-event',
    icon: 'bpmn-icon-end-event-none',
    group: 'END_EVENTS',
    color: 'var(--color-end-event)',
    draggable: true
  },
  {
    id: 'end-event-message',
    name: 'Message End',
    title: 'Message End Event',
    action: 'create.end-event-message', 
    icon: 'bpmn-icon-end-event-message',
    group: 'END_EVENTS',
    color: 'var(--color-end-event)',
    draggable: true
  },
  {
    id: 'end-event-error',
    name: 'Error End',
    title: 'Error End Event',
    action: 'create.end-event-error',
    icon: 'bpmn-icon-end-event-error',
    group: 'END_EVENTS',
    color: 'var(--color-end-event)',
    draggable: true
  },
  {
    id: 'end-event-terminate',
    name: 'Terminate End',
    title: 'Terminate End Event',
    action: 'create.end-event-terminate',
    icon: 'bpmn-icon-end-event-terminate',
    group: 'END_EVENTS',
    color: 'var(--color-end-event)',
    draggable: true
  },

  // Intermediate Events
  {
    id: 'intermediate-event',
    name: 'Intermediate Event',
    title: 'Intermediate Catch Event',
    action: 'create.intermediate-event',
    icon: 'bpmn-icon-intermediate-event-none',
    group: 'INTERMEDIATE_EVENTS',
    color: 'var(--color-intermediate-event)',
    draggable: true
  },
  {
    id: 'intermediate-event-message',
    name: 'Message Intermediate',
    title: 'Message Intermediate Event',
    action: 'create.intermediate-event-message',
    icon: 'bpmn-icon-intermediate-event-catch-message',
    group: 'INTERMEDIATE_EVENTS',
    color: 'var(--color-intermediate-event)',
    draggable: true
  },
  {
    id: 'intermediate-event-timer',
    name: 'Timer Intermediate',
    title: 'Timer Intermediate Event',
    action: 'create.intermediate-event-timer',
    icon: 'bpmn-icon-intermediate-event-catch-timer',
    group: 'INTERMEDIATE_EVENTS',
    color: 'var(--color-intermediate-event)',
    draggable: true
  },

  // Tasks
  {
    id: 'task',
    name: 'Task',
    title: 'Task',
    action: 'create.task',
    icon: 'bpmn-icon-task',
    group: 'TASKS',
    color: 'var(--color-activity)',
    draggable: true
  },
  {
    id: 'user-task',
    name: 'User Task',
    title: 'User Task',
    action: 'create.user-task',
    icon: 'bpmn-icon-user',
    group: 'TASKS',
    color: 'var(--color-activity)',
    draggable: true
  },
  {
    id: 'service-task',
    name: 'Service Task',
    title: 'Service Task',
    action: 'create.service-task',
    icon: 'bpmn-icon-service',
    group: 'TASKS',
    color: 'var(--color-activity)',
    draggable: true
  },
  {
    id: 'script-task',
    name: 'Script Task',
    title: 'Script Task',
    action: 'create.script-task',
    icon: 'bpmn-icon-script',
    group: 'TASKS',
    color: 'var(--color-activity)',
    draggable: true
  },
  {
    id: 'send-task',
    name: 'Send Task',
    title: 'Send Task',
    action: 'create.send-task',
    icon: 'bpmn-icon-send',
    group: 'TASKS',
    color: 'var(--color-activity)',
    draggable: true
  },
  {
    id: 'receive-task',
    name: 'Receive Task',
    title: 'Receive Task',
    action: 'create.receive-task',
    icon: 'bpmn-icon-receive',
    group: 'TASKS',
    color: 'var(--color-activity)',
    draggable: true
  },
  {
    id: 'manual-task',
    name: 'Manual Task',
    title: 'Manual Task',
    action: 'create.manual-task',
    icon: 'bpmn-icon-manual',
    group: 'TASKS',
    color: 'var(--color-activity)',
    draggable: true
  },

  // Gateways
  {
    id: 'exclusive-gateway',
    name: 'Exclusive Gateway',
    title: 'Exclusive Gateway',
    action: 'create.exclusive-gateway',
    icon: 'bpmn-icon-gateway-xor',
    group: 'GATEWAYS',
    color: 'var(--color-gateway)',
    draggable: true
  },
  {
    id: 'parallel-gateway',
    name: 'Parallel Gateway',
    title: 'Parallel Gateway',
    action: 'create.parallel-gateway',
    icon: 'bpmn-icon-gateway-parallel',
    group: 'GATEWAYS',
    color: 'var(--color-gateway)',
    draggable: true
  },
  {
    id: 'inclusive-gateway',
    name: 'Inclusive Gateway',
    title: 'Inclusive Gateway',
    action: 'create.inclusive-gateway',
    icon: 'bpmn-icon-gateway-or',
    group: 'GATEWAYS',
    color: 'var(--color-gateway)',
    draggable: true
  },
  {
    id: 'event-gateway',
    name: 'Event Gateway',
    title: 'Event Gateway',
    action: 'create.event-gateway',
    icon: 'bpmn-icon-gateway-eventbased',
    group: 'GATEWAYS',
    color: 'var(--color-gateway)',
    draggable: true
  },

  // Subprocess
  {
    id: 'subprocess-collapsed',
    name: 'Subprocess',
    title: 'Collapsed Subprocess',
    action: 'create.subprocess-collapsed',
    icon: 'bpmn-icon-subprocess-collapsed',
    group: 'SUBPROCESS',
    color: 'var(--color-activity)',
    draggable: true
  },
  {
    id: 'subprocess-expanded',
    name: 'Expanded Subprocess',
    title: 'Expanded Subprocess',
    action: 'create.subprocess-expanded',
    icon: 'bpmn-icon-subprocess-expanded',
    group: 'SUBPROCESS',
    color: 'var(--color-activity)',
    draggable: true
  },

  // Data Objects
  {
    id: 'data-object',
    name: 'Data Object',
    title: 'Data Object',
    action: 'create.data-object',
    icon: 'bpmn-icon-data-object',
    group: 'DATA',
    color: 'var(--color-data)',
    draggable: true
  },
  {
    id: 'data-store',
    name: 'Data Store',
    title: 'Data Store',
    action: 'create.data-store',
    icon: 'bpmn-icon-data-store',
    group: 'DATA',
    color: 'var(--color-data)',
    draggable: true
  },

  // Participants
  {
    id: 'participant',
    name: 'Pool/Lane',
    title: 'Pool/Lane',
    action: 'create.participant-expanded',
    icon: 'bpmn-icon-participant',
    group: 'PARTICIPANTS',
    color: 'var(--color-participant)',
    draggable: true
  }
]

// Helper functions
export function getElementsByGroup(group: BpmnElementGroup): BpmnElement[] {
  return BPMN_ELEMENTS.filter(element => element.group === group)
}

export function searchElements(query: string): BpmnElement[] {
  const lowerQuery = query.toLowerCase()
  return BPMN_ELEMENTS.filter(element => 
    element.name.toLowerCase().includes(lowerQuery) ||
    element.title.toLowerCase().includes(lowerQuery) ||
    element.group.toLowerCase().includes(lowerQuery)
  )
}

export function getElementByAction(action: string): BpmnElement | undefined {
  return BPMN_ELEMENTS.find(element => element.action === action)
}