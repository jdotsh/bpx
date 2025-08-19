import BpmnModeler from "bpmn-js/lib/Modeler";
import { isUndo, isRedo } from "diagram-js/lib/features/keyboard/KeyboardUtil";
import GridLineModule from "diagram-js-grid-bg";
import minimapModule from "diagram-js-minimap";
import * as jsYaml from "js-yaml";

import { initModelerStr, toBpmnXml, toProcessJson } from './bpmn-utils';
import { BpmnDesignerOptions, BpmnProcess } from './types';
import { perfMonitor } from './performance-monitor';

const defaultOptions: Partial<BpmnDesignerOptions> = {
  lang: "en",
  theme: "light",
  valueType: 'yaml',
  height: 70,
  gridLine: {
    smallGridSpacing: 10,
    gridSpacing: 50,
    gridLineStroke: 1,
    gridLineOpacity: 0.1,
    gridLineColor: '#e0e0e0'
  },
  keyboard: true
};

export class BpmnDesigner {
  private bpmnModeler!: BpmnModeler;
  private container!: HTMLElement;
  private options: BpmnDesignerOptions;
  private eventHandlers: Map<string, Function[]> = new Map();
  private pendingOperations: Set<Promise<any>> = new Set();
  private isDestroyed: boolean = false;

  constructor(options: BpmnDesignerOptions) {
    perfMonitor.mark('designer-init-start');
    this.options = { ...defaultOptions, ...options };
    this.initialize();
    perfMonitor.measure('designer-init', 'designer-init-start');
  }

  private async initialize() {
    this.setupContainer();
    this.createModeler();
    this.setupKeyboard();
    await this.loadInitialXml();
  }

  private setupContainer() {
    const rootEl = typeof this.options.container === "string" 
      ? document.querySelector(this.options.container) as HTMLElement
      : this.options.container;
    
    if (!rootEl) {
      throw new Error('Container not found');
    }

    rootEl.classList.add(`bpmn-designer-theme-${this.options.theme}`);
    
    if (this.options.theme === 'dark') {
      rootEl.classList.add('dark');
    }
    
    this.container = rootEl;
  }

  private createModeler() {
    const { height, gridLine, minimap } = this.options;

    // Enable hardware acceleration
    this.container.style.transform = 'translateZ(0)';
    this.container.style.willChange = 'transform';

    this.bpmnModeler = new BpmnModeler({
      container: this.container,
      height: `${height}vh`,
      additionalModules: this.getAdditionalModules(),
      gridLine,
      minimap,
      // Performance optimizations
      moveCanvas: {
        speed: 20
      },
      bendpoints: {
        bendpointMove: {
          tolerance: 5
        }
      }
    });
  }

  private getAdditionalModules() {
    return [
      minimapModule,
      GridLineModule
    ];
  }

  private setupKeyboard() {
    if (!this.options.keyboard) return;

    const eventBus = this.bpmnModeler.get("eventBus") as any;
    const commandStack = this.bpmnModeler.get("commandStack") as any;

    const handleKeys = (event: KeyboardEvent) => {
      if (this.isDestroyed) return;
      
      if (isUndo(event)) {
        commandStack.undo();
        event.preventDefault();
      } else if (isRedo(event)) {
        commandStack.redo();
        event.preventDefault();
      }
    };

    this.container.addEventListener("keydown", handleKeys, { passive: false });
    this.eventHandlers.set('keydown', [handleKeys]);
  }

  private async loadInitialXml(): Promise<void> {
    perfMonitor.mark('xml-load-start');
    
    const xml = initModelerStr();
    let valueStr = this.options.value;
    
    if (this.options.valueType !== 'bpmn' && this.options.value) {
      valueStr = toBpmnXml(jsYaml.load(this.options.value) as BpmnProcess);
    }

    try {
      const importPromise = this.bpmnModeler.importXML(valueStr || xml);
      this.pendingOperations.add(importPromise);
      
      const { warnings } = await importPromise;
      
      this.pendingOperations.delete(importPromise);
      
      if (warnings && warnings.length) {
        warnings.forEach((warn) => console.warn(warn));
      }
      
      this.setupEventListeners();
      this.options.onCreated?.(this.bpmnModeler);
      
      perfMonitor.measure('xml-load', 'xml-load-start');
    } catch (err) {
      this.options.onXmlError?.(err as Error);
      perfMonitor.measure('xml-load-error', 'xml-load-start');
    }
  }

  private setupEventListeners() {
    const eventBus = this.bpmnModeler.get("eventBus") as any;
    
    // Debounce change events for better performance
    let changeTimeout: NodeJS.Timeout;
    const debouncedChange = () => {
      clearTimeout(changeTimeout);
      changeTimeout = setTimeout(() => {
        if (this.isDestroyed) return;
        
        this.options.onChange?.((valueType) => {
          if (valueType === "json") {
            return this.getJson();
          }
          return this.getValue();
        });
      }, 300);
    };

    eventBus.on('element.changed', debouncedChange);
    eventBus.on('elements.changed', debouncedChange);

    // Throttle selection events
    let lastSelectionTime = 0;
    eventBus.on('element.selected', (e: any) => {
      const now = Date.now();
      if (now - lastSelectionTime > 100) {
        lastSelectionTime = now;
        this.options.onSelect?.(e);
      }
    });
  }

  async setValue(value?: string): Promise<void> {
    if (this.isDestroyed) return;
    
    perfMonitor.mark('set-value-start');
    
    if (value && this.options.valueType !== 'bpmn') {
      value = toBpmnXml(jsYaml.load(value) as BpmnProcess);
    }
    
    try {
      const importPromise = this.bpmnModeler.importXML(value || initModelerStr());
      this.pendingOperations.add(importPromise);
      
      const { warnings } = await importPromise;
      
      this.pendingOperations.delete(importPromise);
      
      if (warnings && warnings.length) {
        warnings.forEach((warn) => console.warn(warn));
      }
      
      perfMonitor.measure('set-value', 'set-value-start');
    } catch (err) {
      this.options.onXmlError?.(err as Error);
      perfMonitor.measure('set-value-error', 'set-value-start');
    }
  }

  getValue(): string {
    return jsYaml.dump(this.getJson());
  }

  getJson(): BpmnProcess {
    // Get XML from modeler and convert to JSON structure
    return toProcessJson(''); // Simplified - would need actual XML from modeler
  }

  async getXml(): Promise<string> {
    if (this.isDestroyed) {
      throw new Error('Designer is destroyed');
    }
    
    perfMonitor.mark('get-xml-start');
    
    try {
      const result = await this.bpmnModeler.saveXML({ format: true });
      perfMonitor.measure('get-xml', 'get-xml-start');
      return result.xml || '';
    } catch (error) {
      perfMonitor.measure('get-xml-error', 'get-xml-start');
      throw error;
    }
  }

  async clear(): Promise<void> {
    await this.setValue();
  }

  changeTheme(theme?: 'light' | 'dark') {
    const newTheme = theme || (this.options.theme === 'light' ? 'dark' : 'light');
    
    // Batch DOM operations
    requestAnimationFrame(() => {
      this.container.classList.remove(`bpmn-designer-theme-${this.options.theme}`);
      this.container.classList.add(`bpmn-designer-theme-${newTheme}`);
      
      if (newTheme === 'dark') {
        this.container.classList.add('dark');
      } else {
        this.container.classList.remove('dark');
      }
      
      this.options.theme = newTheme;
      
      // Force a refresh of the BPMN canvas
      const canvas = this.bpmnModeler.get('canvas') as any;
      canvas.resized();
    });
  }

  changeLanguage(lang: string) {
    this.options.lang = lang;
    // Would need to reinitialize with new language modules
  }

  getCommandStack() {
    return this.bpmnModeler.get("commandStack");
  }

  getCanvas() {
    return this.bpmnModeler.get("canvas");
  }

  async destroy() {
    if (this.isDestroyed) return;
    
    this.isDestroyed = true;
    
    // Wait for pending operations
    await Promise.all(this.pendingOperations);
    
    // Remove event listeners
    this.eventHandlers.forEach((handlers, event) => {
      handlers.forEach(handler => {
        this.container.removeEventListener(event, handler as EventListener);
      });
    });
    
    this.eventHandlers.clear();
    
    this.options.onDestroy?.(this);
    
    try {
      this.bpmnModeler.destroy();
    } catch (error) {
      console.error('Error destroying modeler:', error);
    }
    
    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      perfMonitor.logMetrics();
    }
  }
}