export interface BpmnElement {
  id: string
  action: string
  icon: string
  title: string
  draggable?: boolean
  group: string
}

export interface BpmnElementGroup {
  id: string
  title: string
  icon: string
  collapsed?: boolean
  elements: BpmnElement[]
}

// Map the existing BPMN.js toolbar elements to our grouped structure
export const BPMN_ELEMENT_GROUPS: BpmnElementGroup[] = [
  {
    id: 'tools',
    title: 'Tools',
    icon: 'bpmn-icon-hand-tool',
    elements: [
      {
        id: 'hand-tool',
        action: 'hand-tool',
        icon: 'bpmn-icon-hand-tool',
        title: 'Activate hand tool',
        draggable: true,
        group: 'tools'
      },
      {
        id: 'lasso-tool',
        action: 'lasso-tool', 
        icon: 'bpmn-icon-lasso-tool',
        title: 'Activate lasso tool',
        draggable: true,
        group: 'tools'
      },
      {
        id: 'space-tool',
        action: 'space-tool',
        icon: 'bpmn-icon-space-tool', 
        title: 'Activate create/remove space tool',
        draggable: true,
        group: 'tools'
      },
      {
        id: 'global-connect-tool',
        action: 'global-connect-tool',
        icon: 'bpmn-icon-connection-multi',
        title: 'Activate global connect tool',
        draggable: true,
        group: 'tools'
      }
    ]
  },
  {
    id: 'events',
    title: 'Start Events',
    icon: 'bpmn-icon-start-event-none',
    elements: [
      {
        id: 'start-event',
        action: 'create.start-event',
        icon: 'bpmn-icon-start-event-none',
        title: 'Create start event',
        draggable: true,
        group: 'event'
      },
      {
        id: 'intermediate-event',
        action: 'create.intermediate-event',
        icon: 'bpmn-icon-intermediate-event-none',
        title: 'Create intermediate/boundary event',
        draggable: true,
        group: 'event'
      },
      {
        id: 'end-event',
        action: 'create.end-event',
        icon: 'bpmn-icon-end-event-none',
        title: 'Create end event',
        draggable: true,
        group: 'event'
      }
    ]
  },
  {
    id: 'gateways',
    title: 'Gateways',
    icon: 'bpmn-icon-gateway-none',
    elements: [
      {
        id: 'exclusive-gateway',
        action: 'create.exclusive-gateway',
        icon: 'bpmn-icon-gateway-none',
        title: 'Create gateway',
        draggable: true,
        group: 'gateway'
      }
    ]
  },
  {
    id: 'activities',
    title: 'Tasks',
    icon: 'bpmn-icon-task',
    elements: [
      {
        id: 'task',
        action: 'create.task',
        icon: 'bpmn-icon-task',
        title: 'Create task',
        draggable: true,
        group: 'activity'
      },
      {
        id: 'subprocess-expanded',
        action: 'create.subprocess-expanded',
        icon: 'bpmn-icon-subprocess-expanded',
        title: 'Create expanded sub-process',
        draggable: true,
        group: 'activity'
      }
    ]
  },
  {
    id: 'data',
    title: 'Data Objects',
    icon: 'bpmn-icon-data-object',
    elements: [
      {
        id: 'data-object',
        action: 'create.data-object',
        icon: 'bpmn-icon-data-object',
        title: 'Create data object reference',
        draggable: true,
        group: 'data-object'
      },
      {
        id: 'data-store',
        action: 'create.data-store',
        icon: 'bpmn-icon-data-store',
        title: 'Create data store reference',
        draggable: true,
        group: 'data-store'
      }
    ]
  },
  {
    id: 'collaboration',
    title: 'Participant',
    icon: 'bpmn-icon-participant',
    elements: [
      {
        id: 'participant-expanded',
        action: 'create.participant-expanded',
        icon: 'bpmn-icon-participant',
        title: 'Create pool/participant',
        draggable: true,
        group: 'collaboration'
      }
    ]
  },
  {
    id: 'artifacts',
    title: 'Artifacts',
    icon: 'bpmn-icon-group',
    elements: [
      {
        id: 'group',
        action: 'create.group',
        icon: 'bpmn-icon-group',
        title: 'Create group',
        draggable: true,
        group: 'artifact'
      }
    ]
  }
]

// Collapsed state shows essential elements only
export const COLLAPSED_ESSENTIAL_ELEMENTS: BpmnElement[] = [
  {
    id: 'hand-tool',
    action: 'hand-tool',
    icon: 'bpmn-icon-hand-tool',
    title: 'Activate hand tool',
    draggable: true,
    group: 'tools'
  },
  {
    id: 'start-event',
    action: 'create.start-event',
    icon: 'bpmn-icon-start-event-none',
    title: 'Create start event',
    draggable: true,
    group: 'event'
  },
  {
    id: 'task',
    action: 'create.task',
    icon: 'bpmn-icon-task',
    title: 'Create task',
    draggable: true,
    group: 'activity'
  },
  {
    id: 'exclusive-gateway',
    action: 'create.exclusive-gateway',
    icon: 'bpmn-icon-gateway-none',
    title: 'Create gateway',
    draggable: true,
    group: 'gateway'
  },
  {
    id: 'end-event',
    action: 'create.end-event',
    icon: 'bpmn-icon-end-event-none',
    title: 'Create end event',
    draggable: true,
    group: 'event'
  }
]