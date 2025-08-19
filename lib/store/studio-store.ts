import { BpmnDesigner } from '@/lib/bpmn-designer'

export interface StudioState {
  // Designer
  designer: BpmnDesigner | null
  
  // View state
  zoomLevel: number
  isMinimapOpen: boolean
  isMeetingMode: boolean
  activeTool: string
  
  // History
  canUndo: boolean
  canRedo: boolean
  
  // UI state
  showPreview: boolean
  previewXml: string
  theme: 'light' | 'dark'
  
  // Document state
  isDirty: boolean
  lastSaved: Date | null
  documentId: string | null
}

export type StudioAction =
  | { type: 'SET_DESIGNER'; payload: BpmnDesigner | null }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'TOGGLE_MINIMAP' }
  | { type: 'TOGGLE_MEETING_MODE' }
  | { type: 'SET_ACTIVE_TOOL'; payload: string }
  | { type: 'SET_HISTORY'; payload: { canUndo: boolean; canRedo: boolean } }
  | { type: 'SHOW_PREVIEW'; payload: string }
  | { type: 'HIDE_PREVIEW' }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'MARK_DIRTY' }
  | { type: 'MARK_SAVED'; payload: Date }
  | { type: 'SET_DOCUMENT_ID'; payload: string | null }

export const initialStudioState: StudioState = {
  designer: null,
  zoomLevel: 100,
  isMinimapOpen: false,
  isMeetingMode: false,
  activeTool: 'hand',
  canUndo: false,
  canRedo: false,
  showPreview: false,
  previewXml: '',
  theme: 'light',
  isDirty: false,
  lastSaved: null,
  documentId: null,
}

export function studioReducer(state: StudioState, action: StudioAction): StudioState {
  switch (action.type) {
    case 'SET_DESIGNER':
      return { ...state, designer: action.payload }
    
    case 'SET_ZOOM':
      return { ...state, zoomLevel: action.payload }
    
    case 'TOGGLE_MINIMAP':
      return { ...state, isMinimapOpen: !state.isMinimapOpen }
    
    case 'TOGGLE_MEETING_MODE':
      return { ...state, isMeetingMode: !state.isMeetingMode }
    
    case 'SET_ACTIVE_TOOL':
      return { ...state, activeTool: action.payload }
    
    case 'SET_HISTORY':
      return { 
        ...state, 
        canUndo: action.payload.canUndo,
        canRedo: action.payload.canRedo 
      }
    
    case 'SHOW_PREVIEW':
      return { ...state, showPreview: true, previewXml: action.payload }
    
    case 'HIDE_PREVIEW':
      return { ...state, showPreview: false, previewXml: '' }
    
    case 'SET_THEME':
      return { ...state, theme: action.payload }
    
    case 'MARK_DIRTY':
      return { ...state, isDirty: true }
    
    case 'MARK_SAVED':
      return { ...state, isDirty: false, lastSaved: action.payload }
    
    case 'SET_DOCUMENT_ID':
      return { ...state, documentId: action.payload }
    
    default:
      return state
  }
}