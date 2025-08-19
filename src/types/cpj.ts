// Canonical Process JSON (CPJ) - LLM-friendly intermediate representation
export type Id = string;

export interface CpjProcess {
  id: Id;
  name: string;
  lanes?: CpjLane[];
  elements: CpjElement[];
  flows: CpjFlow[];
}

export interface CpjLane {
  id: Id;
  name: string;           // department/role
  participants?: string[]; // optional user groups
}

export type CpjElement =
  | { type: 'startEvent'; id: Id; name?: string }
  | { type: 'endEvent'; id: Id; name?: string }
  | { type: 'task'; id: Id; name: string; kind?: 'user'|'service'|'script'; laneId?: Id; assignee?: string }
  | { type: 'gateway'; id: Id; name?: string; gatewayType: 'exclusive'|'parallel'|'inclusive' }
  | { type: 'subProcess'; id: Id; name: string; collapsed?: boolean }
  | { type: 'intermediateEvent'; id: Id; name?: string; eventKind: 'message'|'timer'|'signal'|'error' }

export interface CpjFlow {
  id: Id;
  sourceId: Id;
  targetId: Id;
  condition?: string;   // DMN/expression text for XOR
  isDefault?: boolean;
}