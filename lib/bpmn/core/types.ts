export interface BpmnDesignerOptions {
  container: string | HTMLElement;
  value?: string;
  valueType?: 'bpmn' | 'json' | 'yaml';
  theme?: 'dark' | 'light';
  keyboard?: boolean;
  lang?: string | 'zh' | 'en';
  i18n?: Record<string, Record<string, string>>;
  height?: number;
  gridLine?: boolean | {
    smallGridSpacing?: number;
    gridSpacing?: number;
    gridLineStroke?: number;
    gridLineOpacity?: number;
    gridLineColor?: string;
  };
  minimap?: {
    open: boolean;
    position: { x: number; y: 'bottom' | number };
  };
  onChange?: (callback: (valueType?: "json" | "yaml" | "xml") => any) => void;
  onSelect?: (element: any) => void;
  onXmlError?: (error: Error | string) => void;
  onCreated?: (modeler: any) => void;
  onDestroy?: (designer: any) => void;
}

export interface BpmnNode {
  id?: string;
  type: string;
  title?: string;
  when?: string;
  task?: string;
  meta?: Record<string, any>;
  link: BpmnLink[] | string | string[] | BpmnLink;
}

export interface BpmnLink {
  nextId?: string;
  when?: string;
  title: string;
  id: string;
  [key: string]: any;
}

export interface BpmnProcess {
  id: string;
  title?: string;
  driver?: string;
  meta?: Record<string, any>;
  layout: BpmnNode[];
  bpmn: Record<string, any>;
}