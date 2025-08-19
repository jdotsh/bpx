import { getElementByAction } from './bpmn-elements-registry'

export class CustomPaletteProvider {
  static $inject = ['palette', 'create', 'elementFactory', 'spaceTool', 'lassoTool', 'handTool', 'globalConnect', 'translate', 'bpmnFactory', 'modeling']
  
  constructor(
    private palette: any,
    private create: any, 
    private elementFactory: any,
    private spaceTool: any,
    private lassoTool: any,
    private handTool: any,
    private globalConnect: any,
    private translate: any,
    private bpmnFactory: any,
    private modeling: any
  ) {
    palette.registerProvider(this)
    
    // Hide the default palette immediately
    this.hideDefaultPalette()
    
    // Store reference for external access
    ;(window as any).__customPaletteProvider = this
  }

  // Return empty entries to hide default palette
  getPaletteEntries() {
    return {} // This effectively hides the default palette
  }

  private hideDefaultPalette() {
    // Use CSS to hide the default palette container
    const style = document.createElement('style')
    style.textContent = `
      .djs-palette {
        display: none !important;
      }
    `
    document.head.appendChild(style)
  }

  // Public methods for our custom palette to use
  public activateHandTool(event?: Event) {
    this.handTool.activateHand(event)
  }

  public activateLassoTool(event?: Event) {
    this.lassoTool.activateSelection(event)
  }

  public activateSpaceTool(event?: Event) {
    this.spaceTool.activateSelection(event)
  }

  public activateGlobalConnect(event?: Event) {
    this.globalConnect.start(event)
  }

  // Create element using bpmn-js create service
  public createElement(action: string, event?: Event | DragEvent) {
    // Get element configuration from registry
    const element = getElementByAction(action)
    
    if (!element) {
      // Fallback to old mapping for backwards compatibility
      const elementType = this.getElementType(action)
      if (!elementType) return
      
      // Handle special cases
      if (action === 'create.subprocess-expanded' || action === 'expanded-subprocess') {
        this.createSubprocess(event)
      } else if (action === 'create.participant-expanded' || action === 'expanded-pool') {
        this.createParticipant(event)
      } else {
        const shape = this.elementFactory.createShape({ type: elementType })
        this.create.start(event, shape)
      }
      return
    }

    try {
      // Create business object with proper type
      const businessObject = this.bpmnFactory.create(element.type)
      
      // Add event definition if needed
      if (element.eventDefinitionType) {
        const eventDefinition = this.bpmnFactory.create(element.eventDefinitionType)
        businessObject.eventDefinitions = [eventDefinition]
      }
      
      // Set name for tasks and activities
      if (element.type.includes('Task') || element.type.includes('Activity')) {
        businessObject.name = element.title
      }
      
      // Create shape configuration
      const shapeConfig: any = {
        type: element.type,
        businessObject: businessObject
      }
      
      // Handle expanded/collapsed state for subprocess and participants
      if (element.isExpanded !== undefined) {
        shapeConfig.isExpanded = element.isExpanded
        if (businessObject.di) {
          businessObject.di.isExpanded = element.isExpanded
        }
      }
      
      // Special handling for participants (pools)
      if (element.type === 'bpmn:Participant') {
        const process = this.bpmnFactory.create('bpmn:Process')
        businessObject.processRef = process
        shapeConfig.width = element.isExpanded ? 600 : 400
        shapeConfig.height = element.isExpanded ? 250 : 60
      }
      
      // Special handling for lanes
      if (element.type === 'bpmn:Lane') {
        shapeConfig.width = 600
        shapeConfig.height = 120
      }
      
      // Special handling for subprocess
      if (element.type === 'bpmn:SubProcess' || element.type === 'bpmn:Transaction') {
        shapeConfig.width = element.isExpanded ? 350 : 100
        shapeConfig.height = element.isExpanded ? 200 : 80
        
        if (element.isExpanded) {
          // For expanded subprocess, include a start event
          const subProcess = this.elementFactory.createShape(shapeConfig)
          
          const startEvent = this.elementFactory.createShape({
            type: 'bpmn:StartEvent',
            x: 40,
            y: 82,
            parent: subProcess
          })
          
          this.create.start(event, [subProcess, startEvent], {
            hints: {
              autoSelect: [subProcess]
            }
          })
          return
        }
      }
      
      // Create the shape and start the create operation
      const shape = this.elementFactory.createShape(shapeConfig)
      this.create.start(event, shape)
      
    } catch (error) {
      console.error('Failed to create element:', error)
      // Fallback to simple creation
      const elementType = this.getElementType(action)
      if (elementType) {
        const shape = this.elementFactory.createShape({ type: elementType })
        this.create.start(event, shape)
      }
    }
  }

  private createSubprocess(event?: Event | DragEvent) {
    const subProcess = this.elementFactory.createShape({
      type: 'bpmn:SubProcess',
      x: 0,
      y: 0,
      isExpanded: true
    })

    const startEvent = this.elementFactory.createShape({
      type: 'bpmn:StartEvent',
      x: 40,
      y: 82,
      parent: subProcess
    })

    this.create.start(event, [subProcess, startEvent], {
      hints: {
        autoSelect: [subProcess]
      }
    })
  }

  private createParticipant(event?: Event | DragEvent) {
    this.create.start(event, this.elementFactory.createParticipantShape())
  }

  // Fallback method for element types not in registry
  public getElementType(action: string): string {
    const actionTypeMap: Record<string, string> = {
      // Tools (no element creation)
      'hand': '',
      'hand-tool': '',
      'lasso': '',
      'lasso-tool': '',
      'space': '',
      'space-tool': '',
      'global-connect': '',
      'global-connect-tool': '',
      
      // Events
      'create.start-event': 'bpmn:StartEvent',
      'none-start-event': 'bpmn:StartEvent',
      'create.intermediate-event': 'bpmn:IntermediateThrowEvent',
      'none-intermediate-throwing': 'bpmn:IntermediateThrowEvent',
      'create.end-event': 'bpmn:EndEvent',
      'none-end-event': 'bpmn:EndEvent',
      
      // Gateways
      'create.exclusive-gateway': 'bpmn:ExclusiveGateway',
      'exclusive-gateway': 'bpmn:ExclusiveGateway',
      'create.parallel-gateway': 'bpmn:ParallelGateway',
      'create.inclusive-gateway': 'bpmn:InclusiveGateway',
      'create.event-based-gateway': 'bpmn:EventBasedGateway',
      'create.complex-gateway': 'bpmn:ComplexGateway',
      
      // Activities/Tasks
      'create.task': 'bpmn:Task',
      'create.user-task': 'bpmn:UserTask',
      'create.service-task': 'bpmn:ServiceTask',
      'create.script-task': 'bpmn:ScriptTask',
      'create.manual-task': 'bpmn:ManualTask',
      'create.send-task': 'bpmn:SendTask',
      'create.receive-task': 'bpmn:ReceiveTask',
      'create.business-rule-task': 'bpmn:BusinessRuleTask',
      'create.call-activity': 'bpmn:CallActivity',
      
      // Data
      'create.data-object': 'bpmn:DataObjectReference',
      'create.data-store': 'bpmn:DataStoreReference',
      
      // Subprocess (handled specially)
      'create.subprocess-expanded': '',
      'expanded-subprocess': '',
      
      // Participant (handled specially)
      'create.participant-expanded': '',
      'expanded-pool': '',
      
      // Other
      'create.group': 'bpmn:Group',
      'create.text-annotation': 'bpmn:TextAnnotation'
    }

    return actionTypeMap[action] || ''
  }
}