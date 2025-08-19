import BpmnModeler from "bpmn-js/lib/Modeler";
import { isUndo, isRedo } from "diagram-js/lib/features/keyboard/KeyboardUtil";
import GridLineModule from "diagram-js-grid-bg";
import minimapModule from "diagram-js-minimap";
import * as jsYaml from "js-yaml";

import { initModelerStr, toBpmnXml, toProcessJson } from './bpmn-utils';
import { BpmnDesignerOptions, BpmnProcess } from './types';
import { CustomPaletteProvider } from './custom-palette-provider';
import { VirtualRenderer } from './virtual-renderer';
import { SaveManager } from './save-manager';

const defaultOptions: Partial<BpmnDesignerOptions> = {
  lang: "en",
  theme: "light",
  valueType: 'yaml',
  height: 70,
  gridLine: {
    smallGridSpacing: 20,
    gridSpacing: 100,
    gridLineStroke: 1,
    gridLineOpacity: 0.2,
    gridLineColor: '#e0e0e0'
  },
  keyboard: true
};

export class BpmnDesigner {
  private bpmnModeler!: BpmnModeler;
  private container!: HTMLElement;
  private options: BpmnDesignerOptions;
  private virtualRenderer?: VirtualRenderer;
  private saveManager?: SaveManager;

  constructor(options: BpmnDesignerOptions) {
    this.options = { ...defaultOptions, ...options };
    this.initialize();
  }

  private initialize() {
    this.setupContainer();
    this.createModeler();
    this.setupKeyboard();
    this.loadInitialXml();
  }

  private setupContainer() {
    const rootEl = typeof this.options.container === "string" 
      ? document.querySelector(this.options.container) as HTMLElement
      : this.options.container;
    
    if (!rootEl) {
      throw new Error('Container not found');
    }

    // Add theme classes
    rootEl.classList.add(`bpmn-designer-theme-${this.options.theme}`);
    
    // Ensure dark class is applied for dark theme
    if (this.options.theme === 'dark') {
      rootEl.classList.add('dark');
    }
    
    this.container = rootEl;
  }

  private createModeler() {
    const { height, gridLine } = this.options;

    this.bpmnModeler = new BpmnModeler({
      container: this.container,
      height: `${height}vh`,
      additionalModules: this.getAdditionalModules(),
      gridLine,
      minimap: {
        open: false  // Start with minimap closed
      }
    });
  }

  private getAdditionalModules() {
    return [
      minimapModule,
      GridLineModule,
      {
        __init__: ['customPaletteProvider'],
        customPaletteProvider: ['type', CustomPaletteProvider]
      }
    ];
  }

  private setupKeyboard() {
    if (!this.options.keyboard) return;

    const eventBus = this.bpmnModeler.get("eventBus") as any;
    const commandStack = this.bpmnModeler.get("commandStack") as any;

    const handleKeys = (event: KeyboardEvent) => {
      if (isUndo(event)) {
        commandStack.undo();
        event.preventDefault();
      } else if (isRedo(event)) {
        commandStack.redo();
        event.preventDefault();
      }
    };

    this.container.addEventListener("keydown", handleKeys);

    // Cleanup on destroy
    const originalDestroy = this.bpmnModeler.destroy.bind(this.bpmnModeler);
    this.bpmnModeler.destroy = () => {
      this.container.removeEventListener("keydown", handleKeys);
      originalDestroy();
    };
  }

  private loadInitialXml() {
    const xml = initModelerStr();
    let valueStr = this.options.value;
    
    if (this.options.valueType !== 'bpmn' && this.options.value) {
      valueStr = toBpmnXml(jsYaml.load(this.options.value) as BpmnProcess);
    }

    this.bpmnModeler.importXML(valueStr || xml).then(({ warnings }) => {
      if (warnings && warnings.length) {
        warnings.forEach((warn) => console.warn(warn));
      }
      this.setupEventListeners();
      
      // Initialize virtual renderer for performance
      this.virtualRenderer = new VirtualRenderer(this.bpmnModeler);
      
      this.options.onCreated?.(this.bpmnModeler);
    }).catch((err) => {
      this.options.onXmlError?.(err);
    });
  }

  private setupEventListeners() {
    const eventBus = this.bpmnModeler.get("eventBus") as any;
    
    // Initialize SaveManager for optimized saving
    if (this.options.onChange) {
      this.saveManager = new SaveManager(
        this.bpmnModeler,
        async (xml) => {
          // Call the original onChange with the saved XML
          this.options.onChange?.((valueType) => {
            if (valueType === "json") {
              return this.getJson();
            }
            if (valueType === "xml") {
              return xml;
            }
            if (valueType === "yaml") {
              return this.getValue();
            }
            return this.getValue();
          });
        },
        500 // 500ms debounce
      );
    }

    eventBus.on('element.selected', (e: any) => {
      this.options.onSelect?.(e);
    });
  }

  setValue(value?: string) {
    if (value && this.options.valueType !== 'bpmn') {
      value = toBpmnXml(jsYaml.load(value) as BpmnProcess);
    }
    
    this.bpmnModeler.importXML(value || initModelerStr()).then(({ warnings }) => {
      if (warnings && warnings.length) {
        warnings.forEach((warn) => console.warn(warn));
      }
    }).catch((err) => {
      this.options.onXmlError?.(err);
    });
  }

  getValue(): string {
    return jsYaml.dump(this.getJson());
  }

  getJson(): BpmnProcess {
    // Get XML from modeler and convert to JSON structure
    return toProcessJson(''); // Simplified - would need actual XML from modeler
  }

  getXml(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.bpmnModeler.saveXML({ format: true }).then((result) => {
        resolve(result.xml || '');
      }).catch(reject);
    });
  }

  getSvg(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.bpmnModeler.saveSVG().then((result) => {
        resolve(result.svg || '');
      }).catch(reject);
    });
  }

  clear() {
    this.setValue();
  }

  changeTheme(theme?: 'light' | 'dark') {
    const newTheme = theme || (this.options.theme === 'light' ? 'dark' : 'light');
    
    // Remove old theme classes
    this.container.classList.remove(`bpmn-designer-theme-${this.options.theme}`);
    
    // Add new theme classes
    this.container.classList.add(`bpmn-designer-theme-${newTheme}`);
    
    // Also ensure the dark class is properly applied to container for CSS selectors
    if (newTheme === 'dark') {
      this.container.classList.add('dark');
    } else {
      this.container.classList.remove('dark');
    }
    
    this.options.theme = newTheme;
    
    // Force a refresh of the BPMN canvas to apply theme changes
    const canvas = this.bpmnModeler.get('canvas') as any;
    canvas.resized();
  }

  changeLanguage(lang: string) {
    this.options.lang = lang;
    // Would need to reinitialize with new language modules
  }

  getCommandStack() {
    return this.bpmnModeler.get("commandStack");
  }

  getEventBus() {
    return this.bpmnModeler.get("eventBus");
  }

  getCanvas() {
    return this.bpmnModeler.get("canvas");
  }

  getModeling() {
    return this.bpmnModeler.get("modeling");
  }

  getSelection() {
    return this.bpmnModeler.get("selection");
  }

  toggleMinimap() {
    const minimap = this.bpmnModeler.get('minimap') as any;
    if (minimap) {
      minimap.toggle();
    }
  }

  destroy() {
    this.options.onDestroy?.(this);
    this.saveManager?.destroy();
    this.virtualRenderer?.destroy();
    this.bpmnModeler.destroy();
  }
}