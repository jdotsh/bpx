'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import BpmnModeler from 'bpmn-js/lib/Modeler'
import { BpmnToolbar } from './bpmn-toolbar'
import { BpmnElementsPalette } from './bpmn-elements-palette'
import { XmlViewerModal } from './XmlViewerModal'
import { useTheme } from '@/components/theme-provider'

// NO CSS imports here - they are in globals.css

const DEFAULT_BPMN = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
  xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" 
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
  id="sample-diagram" 
  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn2:process id="Process_1" isExecutable="false">
    <bpmn2:startEvent id="StartEvent_1" name="Start"/>
  </bpmn2:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds height="36.0" width="36.0" x="412.0" y="240.0"/>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>`

export function BpmnStudioFixed() {
  const containerRef = useRef<HTMLDivElement>(null)
  const modelerRef = useRef<BpmnModeler | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const { theme, setTheme } = useTheme()
  const styleElementRef = useRef<HTMLStyleElement | null>(null)
  const [zoomLevel, setZoomLevel] = useState(100)
  const [saving, setSaving] = useState(false)
  const [activeTool, setActiveTool] = useState<string | undefined>(undefined)
  const [isMeetingMode, setIsMeetingMode] = useState(false)
  const [isMinimapOpen, setIsMinimapOpen] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [showXmlViewer, setShowXmlViewer] = useState(false)
  const [currentXml, setCurrentXml] = useState('')
  const [selectedElements, setSelectedElements] = useState<any[]>([])

  // Helper function to apply styles (needs to be defined before useEffect)
  const applyBpmnStyles = useCallback((modeler: BpmnModeler | null, currentTheme: 'light' | 'dark') => {
    if (!modeler) return
    
    try {
      const canvas = modeler.get('canvas') as any
      if (!canvas) return
      
      // Get the container and ensure SVG is available
      const container = canvas._container || canvas.getContainer()
      const svg = container?.querySelector('svg') || canvas._svg
      
      // Check if SVG element exists and has necessary methods
      if (!svg || typeof svg.createSVGMatrix !== 'function') {
        console.warn('SVG element not ready, delaying style application')
        setTimeout(() => applyBpmnStyles(modeler, currentTheme), 100)
        return
      }
      
      // Reuse existing style element or create new one
      let style = styleElementRef.current
      if (!style) {
        style = document.createElement('style')
        style.id = 'bpmn-custom-styles'
        styleElementRef.current = style
      }
    
    // Define styles based on current theme
    const isDark = currentTheme === 'dark'
    console.log('Applying BPMN styles for theme:', currentTheme, 'isDark:', isDark)
    
    style.textContent = `
      /* Ensure proper pointer events for drag and drop */
      .djs-container {
        pointer-events: auto !important;
      }
      
      .djs-element > * {
        pointer-events: all !important;
      }
      
      .djs-hit {
        pointer-events: all !important;
        fill: transparent !important;
        stroke: transparent !important;
      }
      
      .djs-shape .djs-hit {
        fill: transparent !important;
        pointer-events: all !important;
      }
      
      .djs-drag-active {
        pointer-events: all !important;
      }
      
      /* === ACTIVITIES (Tasks, Sub-processes) === */
      
      /* Task rectangles - MAXIMUM SPECIFICITY */
      .djs-shape .djs-visual > rect,
      .djs-element[data-element-id*="Task"] rect,
      .djs-element[data-element-id*="Activity"] rect,
      rect.djs-hit,
      rect.djs-outline {
        stroke: ${isDark ? '#ffffff' : '#000000'} !important;
        stroke-dasharray: none !important;
        stroke-width: 2px !important;
        fill: ${isDark ? '#1f2937' : '#ffffff'} !important;
      }
      
      /* All rect elements in shapes (fallback) */
      .djs-shape rect {
        stroke: ${isDark ? '#ffffff' : '#000000'} !important;
        fill: ${isDark ? '#1f2937' : '#ffffff'} !important;
      }
      
      /* NUCLEAR OPTION: Override ANY rect with black stroke in dark mode */
      ${isDark ? `
        rect[stroke="#000000"],
        rect[stroke="black"],
        rect[stroke="rgb(0, 0, 0)"],
        rect[style*="stroke: rgb(0, 0, 0)"],
        rect[style*="stroke:#000000"],
        rect[style*="stroke: #000000"],
        rect[style*="stroke:black"] {
          stroke: #ffffff !important;
          stroke-opacity: 1 !important;
        }
        
        /* SUPER NUCLEAR: Target Tasks by ANY means necessary */
        g[data-element-id*="Task"] rect,
        g[data-element-id*="Activity"] rect,
        .djs-group[data-element-id*="Task"] rect,
        g.djs-element rect,
        g.djs-shape rect,
        svg rect:not([fill="none"]):not([fill="transparent"]) {
          stroke: #ffffff !important;
          stroke-opacity: 1 !important;
          stroke-width: 2px !important;
        }
        
        /* Target the visual rect specifically */
        g[data-element-id*="Task"] > .djs-visual > rect,
        g[data-element-id*="Activity"] > .djs-visual > rect {
          stroke: #ffffff !important;
          fill: #1f2937 !important;
          stroke-opacity: 1 !important;
        }
      ` : ''}
      
      /* Task type icons (user, service, script, etc) */
      .djs-element[data-element-id*="Task"] .djs-visual > path,
      .djs-element[data-element-id*="Task"] .djs-visual > g > path {
        stroke: ${isDark ? '#ffffff' : '#000000'} !important;
        fill: ${isDark ? '#ffffff' : '#000000'} !important;
      }
      
      /* Sub-process markers (+) */
      .djs-element[data-element-id*="SubProcess"] .djs-visual > path {
        stroke: ${isDark ? '#ffffff' : '#000000'} !important;
        fill: none !important;
      }
      
      /* === EVENTS === */
      
      /* Event circles (outer) */
      .djs-shape .djs-visual > circle {
        stroke: ${isDark ? '#ffffff' : '#000000'} !important;
        stroke-width: 2px !important;
        fill: ${isDark ? '#1f2937' : '#ffffff'} !important;
      }
      
      /* All circle elements in shapes (fallback) */
      .djs-shape circle {
        stroke: ${isDark ? '#ffffff' : '#000000'} !important;
        fill: ${isDark ? '#1f2937' : '#ffffff'} !important;
      }
      
      /* Event inner circles (for intermediate/boundary) */
      .djs-shape .djs-visual > g > circle {
        stroke: ${isDark ? '#ffffff' : '#000000'} !important;
        fill: ${isDark ? '#1f2937' : '#ffffff'} !important;
      }
      
      /* Event type icons (message, timer, error, signal, etc) */
      .djs-element[data-element-id*="Event"] .djs-visual > g > path,
      .djs-element[data-element-id*="Event"] .djs-visual > path {
        stroke: ${isDark ? '#ffffff' : '#000000'} !important;
        fill: ${isDark ? '#ffffff' : '#000000'} !important;
        stroke-width: 1px !important;
      }
      
      /* Boundary events (attached to activities) */
      .djs-element[data-element-id*="BoundaryEvent"] .djs-visual > circle {
        stroke: ${isDark ? '#ffffff' : '#000000'} !important;
        fill: ${isDark ? '#1f2937' : '#ffffff'} !important;
      }
      
      /* === GATEWAYS === */
      
      /* Gateway diamonds */
      .djs-shape .djs-visual > polygon {
        stroke: ${isDark ? '#ffffff' : '#000000'} !important;
        stroke-width: 2px !important;
        fill: ${isDark ? '#1f2937' : '#ffffff'} !important;
      }
      
      /* All polygon elements in shapes (fallback) */
      .djs-shape polygon {
        stroke: ${isDark ? '#ffffff' : '#000000'} !important;
        fill: ${isDark ? '#1f2937' : '#ffffff'} !important;
      }
      
      /* Gateway symbols (X, +, O, etc) */
      .djs-element[data-element-id*="Gateway"] .djs-visual > g > path,
      .djs-element[data-element-id*="Gateway"] .djs-visual > path {
        stroke: ${isDark ? '#ffffff' : '#000000'} !important;
        fill: none !important;
        stroke-width: 2px !important;
      }
      
      /* Complex gateway star */
      .djs-element[data-element-id*="ComplexGateway"] .djs-visual > path {
        fill: ${isDark ? '#ffffff' : '#000000'} !important;
        stroke: ${isDark ? '#ffffff' : '#000000'} !important;
      }
      
      /* === DATA OBJECTS === */
      
      /* Data object shapes */
      .djs-element[data-element-id*="DataObject"] .djs-visual > path,
      .djs-element[data-element-id*="DataStore"] .djs-visual > path {
        stroke: ${isDark ? '#ffffff' : '#000000'} !important;
        fill: ${isDark ? '#1f2937' : '#ffffff'} !important;
      }
      
      /* Data collection markers */
      .djs-element[data-element-id*="DataObject"] .djs-visual > g > path {
        stroke: ${isDark ? '#ffffff' : '#000000'} !important;
        fill: none !important;
      }
      
      /* === PARTICIPANTS (Pools/Lanes) === */
      
      /* Pool/Lane containers */
      .djs-element[data-element-id*="Participant"] .djs-visual > rect,
      .djs-element[data-element-id*="Lane"] .djs-visual > rect {
        stroke: ${isDark ? '#ffffff' : '#000000'} !important;
        fill: ${isDark ? '#1f2937' : '#ffffff'} !important;
      }
      
      /* Pool/Lane headers */
      .djs-element[data-element-id*="Participant"] .djs-visual > g > rect:first-child,
      .djs-element[data-element-id*="Lane"] .djs-visual > g > rect:first-child {
        fill: ${isDark ? '#374151' : '#e5e7eb'} !important;
      }
      
      /* === CONNECTIONS === */
      
      /* Sequence flows and message flows */
      .djs-connection .djs-visual > path {
        stroke: ${isDark ? '#ffffff' : '#000000'} !important;
        fill: none !important;
      }
      
      /* Arrow heads */
      .djs-connection .djs-visual > polyline,
      .djs-connection .djs-visual > polygon {
        stroke: ${isDark ? '#ffffff' : '#000000'} !important;
        fill: ${isDark ? '#ffffff' : '#000000'} !important;
      }
      
      /* Association/Data association (dotted lines) */
      .djs-connection[data-element-id*="Association"] .djs-visual > path {
        stroke: ${isDark ? '#ffffff' : '#000000'} !important;
        stroke-dasharray: 5, 5 !important;
      }
      
      /* Message flows (dashed lines) */
      .djs-connection[data-element-id*="MessageFlow"] .djs-visual > path {
        stroke: ${isDark ? '#ffffff' : '#000000'} !important;
        stroke-dasharray: 10, 5 !important;
      }
      
      /* === ARTIFACTS === */
      
      /* Text annotations */
      .djs-element[data-element-id*="TextAnnotation"] .djs-visual > rect {
        stroke: ${isDark ? '#ffffff' : '#000000'} !important;
        fill: none !important;
        stroke-dasharray: 5, 5 !important;
      }
      
      /* Groups */
      .djs-element[data-element-id*="Group"] .djs-visual > rect {
        stroke: ${isDark ? '#ffffff' : '#000000'} !important;
        fill: none !important;
        stroke-dasharray: 8, 3, 1, 3 !important;
        stroke-width: 1px !important;
      }
      
      /* === TEXT LABELS === */
      
      /* All text elements */
      .djs-label,
      .djs-shape .djs-visual text,
      .djs-element text,
      text {
        fill: ${isDark ? '#ffffff' : '#000000'} !important;
      }
      
      /* Label backgrounds should be transparent */
      .djs-label .djs-visual rect {
        fill: transparent !important;
        stroke: none !important;
      }
      
      /* === GENERIC FALLBACKS === */
      
      /* Any other path elements */
      .djs-shape .djs-visual > path {
        stroke: ${isDark ? '#ffffff' : '#000000'} !important;
      }
      
      /* All paths with stroke attribute */
      path[stroke]:not([stroke="none"]) {
        stroke: ${isDark ? '#ffffff' : '#000000'} !important;
      }
      
      /* All ellipse elements */
      ellipse {
        stroke: ${isDark ? '#ffffff' : '#000000'} !important;
        fill: ${isDark ? '#1f2937' : '#ffffff'} !important;
      }
      
      /* All line elements */
      line {
        stroke: ${isDark ? '#ffffff' : '#000000'} !important;
      }
      
      /* Filled path elements (icons, markers) */
      .djs-shape .djs-visual > g > path[fill]:not([fill="none"]) {
        fill: ${isDark ? '#ffffff' : '#000000'} !important;
      }
      
      /* Catch all SVG shapes that might have black stroke in light mode */
      .djs-visual > *[stroke="#000000"],
      .djs-visual > *[stroke="black"],
      .djs-visual > *[stroke="rgb(0,0,0)"],
      .djs-visual > *[stroke="rgb(0, 0, 0)"] {
        stroke: ${isDark ? '#ffffff' : '#000000'} !important;
      }
      
      /* Catch all nested elements with black stroke */
      .djs-visual *[stroke="#000000"],
      .djs-visual *[stroke="black"],
      .djs-visual *[stroke="rgb(0,0,0)"],
      .djs-visual *[stroke="rgb(0, 0, 0)"] {
        stroke: ${isDark ? '#ffffff' : '#000000'} !important;
      }
      
      /* Catch all SVG shapes that might have white fill in light mode */
      .djs-visual > *[fill="#ffffff"],
      .djs-visual > *[fill="white"],
      .djs-visual > *[fill="rgb(255,255,255)"],
      .djs-visual > *[fill="rgb(255, 255, 255)"] {
        fill: ${isDark ? '#1f2937' : '#ffffff'} !important;
      }
      
      /* Catch all nested elements with white fill */
      .djs-visual *[fill="#ffffff"],
      .djs-visual *[fill="white"],
      .djs-visual *[fill="rgb(255,255,255)"],
      .djs-visual *[fill="rgb(255, 255, 255)"] {
        fill: ${isDark ? '#1f2937' : '#ffffff'} !important;
      }
      
      /* Direct editing text */
      .djs-direct-editing-parent {
        color: ${isDark ? '#ffffff' : '#000000'} !important;
        background: transparent !important;
      }
      
      .djs-direct-editing-content {
        color: ${isDark ? '#ffffff' : '#000000'} !important;
        background: transparent !important;
        caret-color: ${isDark ? '#ffffff' : '#000000'} !important;
      }
      
      /* Ensure the editing box itself is transparent */
      .djs-direct-editing-parent > div {
        background: transparent !important;
      }
      
      /* Contenteditable elements should be transparent */
      [contenteditable="true"] {
        background: transparent !important;
        outline: none !important;
      }
      
      /* Focus state for editing */
      .djs-direct-editing-content:focus {
        background: transparent !important;
        outline: 1px dotted ${isDark ? '#60a5fa' : '#2563eb'} !important;
      }
      
      /* === SELECTION VISIBILITY FIX === */
      
      /* Selected element outline - make it highly visible */
      .djs-outline {
        stroke: ${isDark ? '#60a5fa' : '#2563eb'} !important;
        stroke-width: 3px !important;
        stroke-dasharray: 5, 5 !important;
        fill: none !important;
        fill-opacity: 0 !important;
        opacity: 1 !important;
      }
      
      /* Outline paths and polygons must be transparent */
      .djs-outline path,
      .djs-outline polygon,
      .djs-outline polyline,
      .djs-outline rect,
      .djs-outline circle,
      .djs-outline ellipse {
        fill: none !important;
        fill-opacity: 0 !important;
      }
      
      /* Selection box overlay - MUST BE TRANSPARENT */
      .djs-lasso-overlay {
        stroke: ${isDark ? '#60a5fa' : '#2563eb'} !important;
        stroke-width: 2px !important;
        fill: ${isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(37, 99, 235, 0.1)'} !important;
        opacity: 1 !important;
      }
      
      /* Multi-select marquee - transparent background */
      .djs-marquee {
        fill: ${isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(37, 99, 235, 0.1)'} !important;
        stroke: ${isDark ? '#60a5fa' : '#2563eb'} !important;
        stroke-width: 1px !important;
        stroke-dasharray: 5, 5 !important;
      }
      
      /* Selected elements get a highlight */
      .djs-element.selected .djs-outline {
        stroke: ${isDark ? '#60a5fa' : '#2563eb'} !important;
        stroke-width: 3px !important;
        opacity: 1 !important;
      }
      
      /* Hover state for better visibility */
      .djs-element.hover .djs-outline {
        stroke: ${isDark ? '#93c5fd' : '#60a5fa'} !important;
        stroke-width: 2px !important;
        opacity: 0.8 !important;
      }
      
      /* Selection frame around elements */
      .djs-select-visual {
        stroke: ${isDark ? '#60a5fa' : '#2563eb'} !important;
        stroke-width: 2px !important;
        stroke-dasharray: 5, 5 !important;
        fill: none !important;
      }
      
      /* Multi-selection visual */
      .djs-multiselect-visual {
        stroke: ${isDark ? '#60a5fa' : '#2563eb'} !important;
        stroke-width: 2px !important;
        fill: ${isDark ? 'rgba(96, 165, 250, 0.05)' : 'rgba(37, 99, 235, 0.05)'} !important;
      }
      
      /* Resize handles - small corner squares */
      .djs-resizer-visual,
      .djs-resizer-hit {
        stroke: ${isDark ? '#60a5fa' : '#2563eb'} !important;
        fill: transparent !important;
        opacity: 1 !important;
      }
      
      /* Resize handle corners - the actual squares */
      .djs-resizer-visual rect,
      .djs-resizer-hit rect {
        fill: ${isDark ? '#60a5fa' : '#2563eb'} !important;
        stroke: ${isDark ? '#ffffff' : '#000000'} !important;
        stroke-width: 1px !important;
        width: 6px !important;
        height: 6px !important;
      }
      
      /* Selection frame - MUST BE TRANSPARENT */
      .djs-selection-frame {
        fill: transparent !important;
        stroke: ${isDark ? '#60a5fa' : '#2563eb'} !important;
        stroke-width: 2px !important;
        stroke-dasharray: 5, 5 !important;
      }
      
      /* Selection visual box - TRANSPARENT BACKGROUND */
      .djs-selection-visual {
        fill: transparent !important;
        stroke: ${isDark ? '#60a5fa' : '#2563eb'} !important;
      }
      
      /* Selection overlay background - CRITICAL FIX */
      .djs-overlay-container .djs-overlay {
        background: transparent !important;
      }
      
      /* Any selection-related overlays must be transparent */
      .djs-overlay-container > * {
        background: transparent !important;
      }
      
      /* Lasso selection area */
      .djs-lasso-overlay rect {
        fill: ${isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(37, 99, 235, 0.1)'} !important;
        stroke: ${isDark ? '#60a5fa' : '#2563eb'} !important;
      }
      
      /* Drag selection marquee box */
      .djs-drag-marquee {
        fill: ${isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(37, 99, 235, 0.1)'} !important;
        stroke: ${isDark ? '#60a5fa' : '#2563eb'} !important;
        stroke-width: 1px !important;
        stroke-dasharray: 5, 5 !important;
      }
      
      /* Group selection frame */
      .djs-group-selector {
        fill: transparent !important;
        stroke: ${isDark ? '#60a5fa' : '#2563eb'} !important;
        stroke-width: 2px !important;
        stroke-dasharray: 5, 5 !important;
      }
      
      /* Selected state visual feedback */
      .selected > .djs-visual {
        filter: ${isDark ? 'drop-shadow(0 0 4px rgba(96, 165, 250, 0.5))' : 'drop-shadow(0 0 4px rgba(37, 99, 235, 0.3))'} !important;
      }
      
      /* Make sure selection doesn't hide elements */
      .djs-overlay {
        pointer-events: none !important;
      }
      
      .djs-overlay.djs-lasso-overlay {
        pointer-events: all !important;
      }
      
      /* AGGRESSIVE FIX: Force ALL selection rectangles to be transparent */
      .selected rect:not(.djs-visual rect) {
        fill: transparent !important;
      }
      
      /* Selection indicators should only be outlines */
      .djs-outline rect,
      .djs-selection rect,
      .djs-select rect {
        fill: transparent !important;
        stroke: ${isDark ? '#60a5fa' : '#2563eb'} !important;
        stroke-width: 2px !important;
      }
      
      /* Ensure no background on selection visuals */
      [class*="select"] rect:not(.djs-visual rect) {
        fill: transparent !important;
      }
      
      /* Remove any fill from selection frames */
      .djs-frame rect {
        fill: transparent !important;
      }
      
      /* Canvas background - target multiple selectors for better coverage */
      .djs-container,
      .djs-container svg,
      .djs-viewport,
      .djs-plane {
        background-color: ${isDark ? '#111827' : '#f9fafb'} !important;
      }
      
      /* Grid pattern background */
      .grid-background {
        background-image: 
          linear-gradient(${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} 1px, transparent 1px),
          linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} 1px, transparent 1px);
        background-size: 20px 20px;
        background-position: 0 0, 0 0;
      }
      
      /* Apply grid to canvas when enabled */
      .djs-container.show-grid > svg {
        background-image: 
          linear-gradient(${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} 1px, transparent 1px),
          linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} 1px, transparent 1px);
        background-size: 20px 20px;
        background-position: 0 0, 0 0;
        background-color: ${isDark ? '#111827' : '#f9fafb'} !important;
      }
      
      /* Ensure the SVG itself has the right background */
      .djs-container > svg {
        background-color: ${isDark ? '#111827' : '#f9fafb'} !important;
      }
      
      /* Hide native BPMN.js palette since we use custom */
      .djs-palette {
        display: none !important;
      }
      
      /* === ULTIMATE FALLBACK - Catch ANY element that might be missed === */
      
      /* AGGRESSIVE: Force all strokes in djs elements */
      .djs-container svg * {
        stroke: ${isDark ? '#ffffff' : '#000000'} !important;
      }
      
      /* But preserve transparent strokes */
      .djs-container svg *[stroke="none"],
      .djs-container svg *[stroke="transparent"],
      .djs-container svg *[stroke-opacity="0"] {
        stroke: transparent !important;
      }
      
      /* Force proper fills on basic shapes */
      .djs-container svg rect:not([fill="none"]):not([fill="transparent"]),
      .djs-container svg circle:not([fill="none"]):not([fill="transparent"]),
      .djs-container svg ellipse:not([fill="none"]):not([fill="transparent"]),
      .djs-container svg polygon:not([fill="none"]):not([fill="transparent"]) {
        fill: ${isDark ? '#1f2937' : '#ffffff'} !important;
      }
      
      /* Ensure text is always visible */
      .djs-container svg text,
      .djs-container svg tspan {
        fill: ${isDark ? '#ffffff' : '#000000'} !important;
      }
      
      /* SUPER AGGRESSIVE: Override ANY stroke attribute in dark mode */
      ${isDark ? `
        .djs-container svg *:not([stroke="none"]):not([stroke="transparent"]) {
          stroke: #ffffff !important;
        }
        
        .djs-container svg path:not([stroke="none"]):not([stroke="transparent"]) {
          stroke: #ffffff !important;
        }
        
        .djs-container svg line:not([stroke="none"]):not([stroke="transparent"]) {
          stroke: #ffffff !important;
        }
        
        .djs-container svg polyline:not([stroke="none"]):not([stroke="transparent"]) {
          stroke: #ffffff !important;
        }
        
        .djs-container svg rect:not([stroke="none"]):not([stroke="transparent"]) {
          stroke: #ffffff !important;
        }
        
        .djs-container svg circle:not([stroke="none"]):not([stroke="transparent"]) {
          stroke: #ffffff !important;
        }
        
        .djs-container svg ellipse:not([stroke="none"]):not([stroke="transparent"]) {
          stroke: #ffffff !important;
        }
        
        .djs-container svg polygon:not([stroke="none"]):not([stroke="transparent"]) {
          stroke: #ffffff !important;
        }
      ` : `
        .djs-container svg *:not([stroke="none"]):not([stroke="transparent"]) {
          stroke: #000000 !important;
        }
      `}
    `
    
      // Only append if not already in DOM
      if (!style.parentNode) {
        document.head.appendChild(style)
      }
      
      // Also add class to the canvas container for CSS targeting
      if (container) {
        if (isDark) {
          container.classList.add('dark-mode')
          container.classList.remove('light-mode')
        } else {
          container.classList.add('light-mode')
          container.classList.remove('dark-mode')
        }
        
        // Directly set background on container and SVG
        container.style.backgroundColor = isDark ? '#111827' : '#f9fafb'
        const svgElement = container.querySelector('svg')
        if (svgElement) {
          svgElement.style.backgroundColor = isDark ? '#111827' : '#f9fafb'
        }
      }
      
      // Force a redraw - but check if eventBus exists
      const eventBus = modeler.get('eventBus') as any
      if (eventBus) {
        eventBus.fire('canvas.viewbox.changed')
      }
      
      // AGGRESSIVE FALLBACK: Force color updates on ALL elements
      const forceColorUpdate = () => {
        const svgElements = document.querySelectorAll('.djs-container svg *')
        svgElements.forEach((el: any) => {
          const tagName = el.tagName?.toLowerCase()
          
          // FORCE stroke colors
          if (el.hasAttribute('stroke') || el.style.stroke) {
            const currentStroke = el.getAttribute('stroke') || el.style.stroke
            if (currentStroke && currentStroke !== 'none' && currentStroke !== 'transparent') {
              // Check if it's a black stroke in dark mode or white in light mode (needs fixing)
              const needsFix = (isDark && (currentStroke === '#000000' || currentStroke === 'black' || currentStroke === 'rgb(0, 0, 0)')) ||
                             (!isDark && (currentStroke === '#ffffff' || currentStroke === 'white' || currentStroke === 'rgb(255, 255, 255)'))
              
              if (needsFix || tagName === 'rect' || tagName === 'circle' || tagName === 'polygon' || tagName === 'path' || tagName === 'line') {
                const newStroke = isDark ? '#ffffff' : '#000000'
                el.setAttribute('stroke', newStroke)
                el.style.stroke = newStroke
                el.style.strokeOpacity = '1'
              }
            }
          }
          
          // FORCE fill colors for shapes
          if (tagName === 'rect' || tagName === 'circle' || tagName === 'ellipse' || tagName === 'polygon') {
            const currentFill = el.getAttribute('fill') || el.style.fill
            if (currentFill && currentFill !== 'none' && currentFill !== 'transparent') {
              // Skip selection boxes
              if (!el.closest('.djs-outline') && !el.closest('.djs-selection')) {
                const newFill = isDark ? '#1f2937' : '#ffffff'
                el.setAttribute('fill', newFill)
                el.style.fill = newFill
              }
            }
          }
          
          // Text and icons
          if (tagName === 'text' || tagName === 'tspan') {
            const newColor = isDark ? '#ffffff' : '#000000'
            el.setAttribute('fill', newColor)
            el.style.fill = newColor
          }
        })
      }
      
      // Run multiple times to catch all updates
      forceColorUpdate()
      setTimeout(forceColorUpdate, 50)
      setTimeout(forceColorUpdate, 100)
      setTimeout(forceColorUpdate, 200)
      setTimeout(forceColorUpdate, 500)
    } catch (err) {
      console.error('Error applying BPMN styles:', err)
    }
  }, [])

  // Initialize BPMN Modeler
  useEffect(() => {
    let mounted = true
    let modeler: BpmnModeler | null = null
    let observer: MutationObserver | null = null

    const initBpmn = async () => {
      const container = containerRef.current
      if (!container || !mounted) return

      try {
        // Wait for container to have dimensions
        if (container.offsetWidth === 0 || container.offsetHeight === 0) {
          setTimeout(initBpmn, 100)
          return
        }

        // Create modeler with full default modules (including palette)
        modeler = new BpmnModeler({
          container: container,
          keyboard: {
            bindTo: window
          },
          // Ensure all default modules are enabled
          additionalModules: [],
          moddleExtensions: {}
        })
        
        modelerRef.current = modeler

        // Import default diagram
        await modeler.importXML(DEFAULT_BPMN)
        
        // Wait a bit for canvas to be fully initialized
        await new Promise(resolve => setTimeout(resolve, 50))

        // Setup command stack listeners - with safety checks
        const eventBus = modeler.get('eventBus') as any
        const commandStack = modeler.get('commandStack') as any
        
        if (!eventBus || !commandStack) {
          console.warn('BPMN modules not fully initialized, retrying...')
          setTimeout(initBpmn, 100)
          return
        }
        
        const updateUndoRedo = () => {
          if (!mounted) return
          setCanUndo(commandStack.canUndo())
          setCanRedo(commandStack.canRedo())
        }
        
        eventBus.on('commandStack.changed', updateUndoRedo)
        updateUndoRedo()
        
        // Track selection changes for alignment tools
        const selection = modeler.get('selection') as any
        eventBus.on('selection.changed', (e: any) => {
          if (!mounted) return
          const elements = e.newSelection || []
          setSelectedElements(elements)
          
          // Apply visual feedback for selection
          if (elements.length > 0) {
            console.log(`Selected ${elements.length} element(s)`)
            
            // FORCE TRANSPARENCY: Remove any opaque selection boxes
            setTimeout(() => {
              const selectionBoxes = document.querySelectorAll('.djs-outline rect, .djs-selection rect, [class*="select"] rect')
              selectionBoxes.forEach((box: any) => {
                // Skip actual shape rectangles
                if (box.closest('.djs-visual')) return
                
                // Force transparent fill
                box.style.fill = 'transparent'
                box.style.fillOpacity = '0'
                box.setAttribute('fill', 'none')
                box.setAttribute('fill-opacity', '0')
              })
              
              // Also check for any selection frames
              const frames = document.querySelectorAll('.djs-frame, .djs-selection-frame, .djs-select-visual')
              frames.forEach((frame: any) => {
                if (frame.tagName === 'rect' || frame.querySelector('rect')) {
                  const rect = frame.tagName === 'rect' ? frame : frame.querySelector('rect')
                  if (rect && !rect.closest('.djs-visual')) {
                    rect.style.fill = 'transparent'
                    rect.setAttribute('fill', 'none')
                  }
                }
              })
            }, 0)
          }
        })
        
        // Add keyboard shortcuts
        const keyboard = modeler.get('keyboard') as any
        const editorActions = modeler.get('editorActions') as any
        
        if (keyboard && editorActions) {
          // Register Ctrl+A for select all
          editorActions.register('selectAll', () => {
            const elementRegistry = modeler.get('elementRegistry') as any
            const allElements = elementRegistry.filter((element: any) => {
              return element.type !== 'label' && 
                     element.type !== 'bpmn:SequenceFlow' &&
                     element.id !== 'Process_1' &&
                     !element.labelTarget
            })
            selection.select(allElements)
            console.log(`Selected all ${allElements.length} elements`)
          })
          
          // Register spacebar for replace menu
          editorActions.register('showReplaceMenu', () => {
            const selectedElements = selection.get()
            if (selectedElements.length === 1) {
              const element = selectedElements[0]
              
              // Skip if it's the root element
              if (element.id === 'Process_1' || element.type === 'bpmn:Process') {
                return
              }
              
              // Get the replace menu module
              const popupMenu = modeler.get('popupMenu') as any
              const replaceMenuProvider = modeler.get('replaceMenuProvider') as any
              
              if (popupMenu && replaceMenuProvider) {
                // Get the position of the selected element
                const elementRegistry = modeler.get('elementRegistry') as any
                const elementShape = elementRegistry.get(element.id)
                
                if (elementShape) {
                  // Calculate position for the popup
                  const position = {
                    x: elementShape.x + (elementShape.width || 100) / 2,
                    y: elementShape.y - 10
                  }
                  
                  // Get replace options for this element
                  const entries = replaceMenuProvider.getPopupMenuEntries(element)
                  
                  if (entries && Object.keys(entries).length > 0) {
                    // Open the popup menu
                    popupMenu.open(element, 'bpmn-replace', position, entries)
                    console.log('Replace menu opened for:', element.type)
                  }
                }
              } else {
                // Fallback: Try to trigger the replace tool directly
                const replacePreview = modeler.get('replacePreview') as any
                if (replacePreview) {
                  replacePreview.toggle()
                }
              }
            }
          })
          
          // Bind keyboard shortcuts
          keyboard.addListener((context: any) => {
            const key = context.keyEvent.key
            const ctrl = context.keyEvent.ctrlKey || context.keyEvent.metaKey
            
            // Ctrl+A or Cmd+A for select all
            if (ctrl && key === 'a') {
              editorActions.trigger('selectAll')
              context.keyEvent.preventDefault()
              return true
            }
            
            // Spacebar for replace menu
            if (key === ' ' && !ctrl && !context.keyEvent.shiftKey && !context.keyEvent.altKey) {
              // Check if we're not in a text input
              const activeElement = document.activeElement
              if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                return false
              }
              
              editorActions.trigger('showReplaceMenu')
              context.keyEvent.preventDefault()
              return true
            }
            
            return false
          })
        }

        // Apply initial styles
        applyBpmnStyles(modeler, theme)
        
        // Add a global keyboard listener for spacebar (fallback)
        const handleGlobalKeydown = (e: KeyboardEvent) => {
          // Only handle spacebar when canvas is focused
          if (e.key === ' ' && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
            const activeElement = document.activeElement
            
            // Skip if typing in an input
            if (activeElement && 
                (activeElement.tagName === 'INPUT' || 
                 activeElement.tagName === 'TEXTAREA' ||
                 activeElement.getAttribute('contenteditable') === 'true')) {
              return
            }
            
            // Check if the canvas or its container has focus
            const canvasElement = container.querySelector('.djs-container')
            if (canvasElement && (canvasElement.contains(activeElement) || activeElement === document.body)) {
              const selectedElements = selection.get()
              
              if (selectedElements.length === 1) {
                e.preventDefault()
                e.stopPropagation()
                
                const element = selectedElements[0]
                
                // Skip root element
                if (element.id === 'Process_1' || element.type === 'bpmn:Process') {
                  return
                }
                
                console.log('Spacebar pressed with element selected:', element.type)
                
                // Try to open replace menu
                const popupMenu = modeler.get('popupMenu') as any
                const replaceMenuProvider = modeler.get('replaceMenuProvider') as any
                
                if (popupMenu && replaceMenuProvider) {
                  const elementRegistry = modeler.get('elementRegistry') as any
                  const elementShape = elementRegistry.get(element.id)
                  
                  if (elementShape) {
                    const position = {
                      x: elementShape.x + (elementShape.width || 100) / 2,
                      y: elementShape.y - 10
                    }
                    
                    const entries = replaceMenuProvider.getPopupMenuEntries(element)
                    
                    if (entries && Object.keys(entries).length > 0) {
                      popupMenu.open(element, 'bpmn-replace', position, entries)
                      console.log('Replace menu triggered via spacebar')
                    }
                  }
                }
              }
            }
          }
        }
        
        // Attach the global listener
        document.addEventListener('keydown', handleGlobalKeydown)
        
        // Store reference for cleanup
        modelerRef.current._spacebarHandler = handleGlobalKeydown
        
        // Apply initial grid state
        const canvas = modeler.get('canvas') as any
        const canvasContainer = canvas._container || canvas.getContainer()
        if (canvasContainer && showGrid) {
          canvasContainer.classList.add('show-grid')
        }
        
        // Set up MutationObserver to catch dynamically added elements
        if (canvasContainer) {
          observer = new MutationObserver((mutations) => {
            const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
            const isDarkMode = currentTheme === 'dark'
            
            mutations.forEach((mutation) => {
              // Process added nodes
              mutation.addedNodes.forEach((node: any) => {
                if (node.nodeType === 1) { // Element node
                  // Process the node itself if it's an SVG element
                  if (node.tagName) {
                    const tagName = node.tagName.toLowerCase()
                    
                    // IMMEDIATE fix for rectangles (Tasks)
                    if (tagName === 'rect' || tagName === 'g' || tagName === 'svg') {
                      // Fix the node itself
                      if (tagName === 'rect') {
                        node.style.stroke = isDarkMode ? '#ffffff' : '#000000'
                        node.setAttribute('stroke', isDarkMode ? '#ffffff' : '#000000')
                        
                        if (!node.closest('.djs-outline') && !node.closest('.djs-selection')) {
                          node.style.fill = isDarkMode ? '#1f2937' : '#ffffff'
                          node.setAttribute('fill', isDarkMode ? '#1f2937' : '#ffffff')
                        }
                      }
                      
                      // Fix all rect children
                      const rects = node.querySelectorAll ? node.querySelectorAll('rect') : []
                      rects.forEach((rect: any) => {
                        rect.style.stroke = isDarkMode ? '#ffffff' : '#000000'
                        rect.setAttribute('stroke', isDarkMode ? '#ffffff' : '#000000')
                        rect.style.strokeOpacity = '1'
                        
                        if (!rect.closest('.djs-outline') && !rect.closest('.djs-selection')) {
                          rect.style.fill = isDarkMode ? '#1f2937' : '#ffffff'
                          rect.setAttribute('fill', isDarkMode ? '#1f2937' : '#ffffff')
                        }
                      })
                    }
                    
                    // Process all descendants
                    if (node.querySelectorAll) {
                      const elements = node.querySelectorAll('*')
                      elements.forEach((el: any) => {
                        const elTag = el.tagName?.toLowerCase()
                        
                        // Force colors on all shape elements
                        if (elTag === 'rect' || elTag === 'circle' || elTag === 'polygon' || elTag === 'path' || elTag === 'line') {
                          if (el.hasAttribute('stroke') || el.style.stroke) {
                            el.style.stroke = isDarkMode ? '#ffffff' : '#000000'
                            el.setAttribute('stroke', isDarkMode ? '#ffffff' : '#000000')
                            el.style.strokeOpacity = '1'
                          }
                          
                          if ((elTag === 'rect' || elTag === 'circle' || elTag === 'polygon') && 
                              !el.closest('.djs-outline') && !el.closest('.djs-selection')) {
                            el.style.fill = isDarkMode ? '#1f2937' : '#ffffff'
                            el.setAttribute('fill', isDarkMode ? '#1f2937' : '#ffffff')
                          }
                        }
                      })
                    }
                  }
                }
              })
              
              // Also check attribute changes for stroke/fill
              if (mutation.type === 'attributes' && mutation.target) {
                const target = mutation.target as any
                if (target.tagName) {
                  const tagName = target.tagName.toLowerCase()
                  if (tagName === 'rect' && (mutation.attributeName === 'stroke' || mutation.attributeName === 'style')) {
                    // Force correct color if it was changed to wrong color
                    const currentStroke = target.getAttribute('stroke') || target.style.stroke
                    if (isDarkMode && (currentStroke === '#000000' || currentStroke === 'black')) {
                      target.style.stroke = '#ffffff'
                      target.setAttribute('stroke', '#ffffff')
                    }
                  }
                }
              }
            })
          })
          
          observer.observe(canvasContainer, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['stroke', 'fill', 'style']
          })
        }

        setIsReady(true)
        setError(null)
      } catch (err) {
        console.error('BPMN initialization error:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize')
      }
    }


    // Start initialization after a small delay
    setTimeout(initBpmn, 100)

    return () => {
      mounted = false
      if (observer) {
        observer.disconnect()
      }
      if (modeler) {
        try {
          // Remove global keyboard handler
          if (modeler._spacebarHandler) {
            document.removeEventListener('keydown', modeler._spacebarHandler)
          }
          modeler.destroy()
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  }, [theme, applyBpmnStyles])

  // Re-apply styles when theme changes
  useEffect(() => {
    if (modelerRef.current && isReady) {
      applyBpmnStyles(modelerRef.current, theme)
      
      // Also update grid if it's enabled
      const canvas = modelerRef.current.get('canvas') as any
      const container = canvas?._container || canvas?.getContainer()
      if (container && showGrid) {
        container.classList.add('show-grid')
      }
      
      // AGGRESSIVE: Continuous Task fix for stubborn elements
      const fixTaskColors = () => {
        const isDark = theme === 'dark'
        const tasks = document.querySelectorAll('[data-element-id*="Task"]')
        
        tasks.forEach(task => {
          const rects = task.querySelectorAll('rect')
          rects.forEach(rect => {
            // Check current color
            const currentStroke = rect.getAttribute('stroke') || rect.style.stroke
            const needsFix = isDark ? 
              (currentStroke === '#000000' || currentStroke === 'black' || currentStroke === 'rgb(0, 0, 0)') :
              (currentStroke === '#ffffff' || currentStroke === 'white' || currentStroke === 'rgb(255, 255, 255)')
            
            if (needsFix) {
              console.log('Fixing Task stroke:', currentStroke, '→', isDark ? '#ffffff' : '#000000')
              rect.setAttribute('stroke', isDark ? '#ffffff' : '#000000')
              rect.style.stroke = isDark ? '#ffffff' : '#000000'
              rect.style.strokeOpacity = '1'
              
              if (!rect.closest('.djs-outline')) {
                rect.setAttribute('fill', isDark ? '#1f2937' : '#ffffff')
                rect.style.fill = isDark ? '#1f2937' : '#ffffff'
              }
            }
          })
        })
      }
      
      // Run multiple times to catch stubborn elements
      const intervals = [0, 100, 200, 500, 1000, 2000]
      intervals.forEach(delay => {
        setTimeout(fixTaskColors, delay)
      })
    }
  }, [theme, isReady, showGrid, applyBpmnStyles])

  // Handlers
  const handleSave = useCallback(async () => {
    if (!modelerRef.current) return
    setSaving(true)
    try {
      const { xml } = await modelerRef.current.saveXML({ format: true })
      localStorage.setItem('bpmn-diagram', xml || '')
      console.log('Saved to localStorage')
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
  }, [])

  const handleExport = useCallback(async () => {
    if (!modelerRef.current) return
    try {
      const { xml } = await modelerRef.current.saveXML({ format: true })
      
      // Show export format options
      const format = prompt('Export format: xml, json, or yaml?', 'xml')?.toLowerCase()
      
      let content = xml || ''
      let filename = 'diagram.bpmn'
      let mimeType = 'text/xml'
      
      if (format === 'json') {
        // Convert XML to JSON representation
        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(xml || '', 'text/xml')
        const jsonData = {
          type: 'bpmn:definitions',
          process: xmlDoc.querySelector('process')?.getAttribute('id') || 'Process_1',
          elements: Array.from(xmlDoc.querySelectorAll('*[id]')).map(el => ({
            id: el.getAttribute('id'),
            type: el.tagName,
            name: el.getAttribute('name') || ''
          }))
        }
        content = JSON.stringify(jsonData, null, 2)
        filename = 'diagram.json'
        mimeType = 'application/json'
      } else if (format === 'yaml' || format === 'yml') {
        // Simple YAML conversion (would need proper library for production)
        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(xml || '', 'text/xml')
        let yamlContent = 'type: bpmn:definitions\n'
        yamlContent += `process: ${xmlDoc.querySelector('process')?.getAttribute('id') || 'Process_1'}\n`
        yamlContent += 'elements:\n'
        xmlDoc.querySelectorAll('*[id]').forEach(el => {
          yamlContent += `  - id: ${el.getAttribute('id')}\n`
          yamlContent += `    type: ${el.tagName}\n`
          const name = el.getAttribute('name')
          if (name) yamlContent += `    name: ${name}\n`
        })
        content = yamlContent
        filename = 'diagram.yaml'
        mimeType = 'text/yaml'
      }
      
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error:', err)
    }
  }, [])

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !modelerRef.current) return
    
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string
        let xml = content
        
        // Check file extension to determine format
        const ext = file.name.split('.').pop()?.toLowerCase()
        
        if (ext === 'json') {
          // Convert JSON back to BPMN XML (simplified)
          const jsonData = JSON.parse(content)
          xml = DEFAULT_BPMN // Start with default and modify
          console.log('Importing JSON format:', jsonData)
          // Would need proper JSON to BPMN conversion
          alert('JSON import: Elements detected, using default template. Full JSON import requires custom parser.')
        } else if (ext === 'yaml' || ext === 'yml') {
          // Convert YAML back to BPMN XML (simplified)
          console.log('Importing YAML format')
          xml = DEFAULT_BPMN // Start with default
          alert('YAML import: Using default template. Full YAML import requires yaml parser library.')
        }
        
        await modelerRef.current?.importXML(xml)
      } catch (err) {
        console.error('Import error:', err)
        alert('Import failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
      }
    }
    reader.readAsText(file)
  }, [])

  const handleUndo = useCallback(() => {
    const commandStack = modelerRef.current?.get('commandStack') as any
    if (commandStack?.canUndo()) {
      commandStack.undo()
    }
  }, [])

  const handleRedo = useCallback(() => {
    const commandStack = modelerRef.current?.get('commandStack') as any
    if (commandStack?.canRedo()) {
      commandStack.redo()
    }
  }, [])

  const handleZoomIn = useCallback(() => {
    if (!modelerRef.current) return
    try {
      const canvas = modelerRef.current.get('canvas') as any
      if (!canvas) return
      
      // Ensure SVG context is available
      const svg = canvas._svg || canvas._container?.querySelector('svg')
      if (!svg || !svg.createSVGMatrix) {
        console.warn('SVG not ready for zoom')
        return
      }
      
      const currentZoom = canvas.zoom()
      if (typeof currentZoom === 'number') {
        const newZoom = Math.min(currentZoom * 1.2, 4)
        canvas.zoom(newZoom)
        setZoomLevel(Math.round(newZoom * 100))
      }
    } catch (err) {
      console.error('Zoom in error:', err)
    }
  }, [])

  const handleZoomOut = useCallback(() => {
    if (!modelerRef.current) return
    try {
      const canvas = modelerRef.current.get('canvas') as any
      if (!canvas) return
      
      // Ensure SVG context is available
      const svg = canvas._svg || canvas._container?.querySelector('svg')
      if (!svg || !svg.createSVGMatrix) {
        console.warn('SVG not ready for zoom')
        return
      }
      
      const currentZoom = canvas.zoom()
      if (typeof currentZoom === 'number') {
        const newZoom = Math.max(currentZoom / 1.2, 0.2)
        canvas.zoom(newZoom)
        setZoomLevel(Math.round(newZoom * 100))
      }
    } catch (err) {
      console.error('Zoom out error:', err)
    }
  }, [])

  const handleZoomReset = useCallback(() => {
    if (!modelerRef.current) return
    try {
      const canvas = modelerRef.current.get('canvas') as any
      if (!canvas) return
      
      // Ensure SVG context is available
      const svg = canvas._svg || canvas._container?.querySelector('svg')
      if (!svg || !svg.createSVGMatrix) {
        console.warn('SVG not ready for zoom')
        return
      }
      
      canvas.zoom('fit-viewport')
      setZoomLevel(100)
    } catch (err) {
      console.error('Zoom reset error:', err)
    }
  }, [])

  const handleClear = useCallback(async () => {
    if (!modelerRef.current) return
    // Clear the entire diagram immediately
    await modelerRef.current.importXML(DEFAULT_BPMN)
  }, [])

  const handleThemeToggle = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    console.log('Theme toggle:', theme, '->', newTheme)
    setTheme(newTheme)  // ThemeProvider handles DOM manipulation
    
    // Re-apply BPMN styles with new theme
    if (modelerRef.current) {
      // Apply new styles (this will update the existing style element)
      applyBpmnStyles(modelerRef.current, newTheme)
      
      // IMMEDIATE: Force direct SVG manipulation for instant color change
      const forceColorUpdate = () => {
        const isDarkMode = newTheme === 'dark'
        const svgElements = document.querySelectorAll('.djs-container svg *')
        
        svgElements.forEach((el: any) => {
          // Update stroke attributes
          if (el.hasAttribute('stroke')) {
            const stroke = el.getAttribute('stroke')
            if (stroke && stroke !== 'none' && stroke !== 'transparent') {
              // Force white in dark mode, black in light mode
              el.style.stroke = isDarkMode ? '#ffffff' : '#000000'
              el.setAttribute('stroke', isDarkMode ? '#ffffff' : '#000000')
            }
          }
          
          // Update fill attributes
          if (el.hasAttribute('fill')) {
            const fill = el.getAttribute('fill')
            if (fill && fill !== 'none' && fill !== 'transparent') {
              // Shapes get background color
              if (el.tagName === 'rect' || el.tagName === 'circle' || 
                  el.tagName === 'ellipse' || el.tagName === 'polygon') {
                el.style.fill = isDarkMode ? '#1f2937' : '#ffffff'
                el.setAttribute('fill', isDarkMode ? '#1f2937' : '#ffffff')
              }
              // Text and icons get foreground color
              else if (el.tagName === 'text' || el.tagName === 'tspan' || el.tagName === 'path') {
                el.style.fill = isDarkMode ? '#ffffff' : '#000000'
                el.setAttribute('fill', isDarkMode ? '#ffffff' : '#000000')
              }
            }
          }
          
          // Also set style attribute to override any inline styles
          if (el.tagName === 'rect' || el.tagName === 'circle' || 
              el.tagName === 'ellipse' || el.tagName === 'polygon' ||
              el.tagName === 'path' || el.tagName === 'line' || el.tagName === 'polyline') {
            if (!el.getAttribute('stroke-opacity') || el.getAttribute('stroke-opacity') !== '0') {
              el.style.stroke = isDarkMode ? '#ffffff' : '#000000'
            }
          }
        })
      }
      
      // Execute immediately and after a short delay
      forceColorUpdate()
      setTimeout(forceColorUpdate, 100)
      setTimeout(forceColorUpdate, 300)
      
      // Force a complete redraw using a safer method
      try {
        const canvas = modelerRef.current.get('canvas') as any
        const eventBus = modelerRef.current.get('eventBus') as any
        
        if (canvas && eventBus) {
          // Get the current viewbox to preserve position
          const viewbox = canvas.viewbox()
          
          // Directly update canvas container background
          const container = canvas._container || canvas.getContainer()
          if (container) {
            const bgColor = newTheme === 'dark' ? '#111827' : '#f9fafb'
            container.style.backgroundColor = bgColor
            
            // Update SVG background
            const svg = container.querySelector('svg')
            if (svg) {
              svg.style.backgroundColor = bgColor
            }
            
            // Update any viewport elements
            const viewport = container.querySelector('.djs-viewport')
            if (viewport) {
              viewport.style.backgroundColor = bgColor
            }
            
            // Preserve grid state after theme change
            if (showGrid) {
              container.classList.add('show-grid')
            }
          }
          
          // Simply trigger a canvas refresh without manipulating elements
          // The styles will be re-applied through the style element update
          requestAnimationFrame(() => {
            if (eventBus) {
              // Just fire a viewbox change to refresh the rendering
              eventBus.fire('canvas.viewbox.changed', viewbox)
            }
          })
        }
      } catch (err) {
        console.error('Theme toggle redraw error:', err)
      }
    }
  }, [theme, applyBpmnStyles])

  // Alignment handlers
  const handleAlignLeft = useCallback(() => {
    if (!modelerRef.current || selectedElements.length < 2) return
    const modeling = modelerRef.current.get('modeling') as any
    const canvas = modelerRef.current.get('canvas') as any
    
    // Find leftmost element
    const leftMost = selectedElements.reduce((min, el) => 
      el.x < min.x ? el : min, selectedElements[0])
    
    // Align all elements to leftmost
    selectedElements.forEach(el => {
      if (el.id !== leftMost.id) {
        modeling.moveElements([el], { x: leftMost.x - el.x, y: 0 })
      }
    })
  }, [selectedElements])

  const handleAlignCenter = useCallback(() => {
    if (!modelerRef.current || selectedElements.length < 2) return
    const modeling = modelerRef.current.get('modeling') as any
    
    // Calculate center position
    const centerX = selectedElements.reduce((sum, el) => sum + el.x + el.width/2, 0) / selectedElements.length
    
    // Align all elements to center
    selectedElements.forEach(el => {
      const targetX = centerX - el.width/2
      modeling.moveElements([el], { x: targetX - el.x, y: 0 })
    })
  }, [selectedElements])

  const handleAlignRight = useCallback(() => {
    if (!modelerRef.current || selectedElements.length < 2) return
    const modeling = modelerRef.current.get('modeling') as any
    
    // Find rightmost element
    const rightMost = selectedElements.reduce((max, el) => 
      (el.x + el.width) > (max.x + max.width) ? el : max, selectedElements[0])
    
    const rightEdge = rightMost.x + rightMost.width
    
    // Align all elements to rightmost
    selectedElements.forEach(el => {
      if (el.id !== rightMost.id) {
        const targetX = rightEdge - el.width
        modeling.moveElements([el], { x: targetX - el.x, y: 0 })
      }
    })
  }, [selectedElements])

  const handleAlignTop = useCallback(() => {
    if (!modelerRef.current || selectedElements.length < 2) return
    const modeling = modelerRef.current.get('modeling') as any
    
    // Find topmost element
    const topMost = selectedElements.reduce((min, el) => 
      el.y < min.y ? el : min, selectedElements[0])
    
    // Align all elements to topmost
    selectedElements.forEach(el => {
      if (el.id !== topMost.id) {
        modeling.moveElements([el], { x: 0, y: topMost.y - el.y })
      }
    })
  }, [selectedElements])

  const handleAlignMiddle = useCallback(() => {
    if (!modelerRef.current || selectedElements.length < 2) return
    const modeling = modelerRef.current.get('modeling') as any
    
    // Calculate middle position
    const middleY = selectedElements.reduce((sum, el) => sum + el.y + el.height/2, 0) / selectedElements.length
    
    // Align all elements to middle
    selectedElements.forEach(el => {
      const targetY = middleY - el.height/2
      modeling.moveElements([el], { x: 0, y: targetY - el.y })
    })
  }, [selectedElements])

  const handleAlignBottom = useCallback(() => {
    if (!modelerRef.current || selectedElements.length < 2) return
    const modeling = modelerRef.current.get('modeling') as any
    
    // Find bottommost element
    const bottomMost = selectedElements.reduce((max, el) => 
      (el.y + el.height) > (max.y + max.height) ? el : max, selectedElements[0])
    
    const bottomEdge = bottomMost.y + bottomMost.height
    
    // Align all elements to bottommost
    selectedElements.forEach(el => {
      if (el.id !== bottomMost.id) {
        const targetY = bottomEdge - el.height
        modeling.moveElements([el], { x: 0, y: targetY - el.y })
      }
    })
  }, [selectedElements])

  // Preview handler - opens XML viewer modal
  const handlePreview = useCallback(async () => {
    if (!modelerRef.current) return
    try {
      const { xml } = await modelerRef.current.saveXML({ format: true })
      setCurrentXml(xml || '')
      setShowXmlViewer(true)
    } catch (err) {
      console.error('Preview error:', err)
    }
  }, [])

  // Handle XML save from viewer
  const handleXmlSave = useCallback(async (newXml: string) => {
    if (!modelerRef.current) return
    try {
      await modelerRef.current.importXML(newXml)
      setShowXmlViewer(false)
    } catch (err) {
      console.error('XML import error:', err)
      alert('Failed to apply XML changes: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }, [])

  // Run Process handler (simulation)
  const handleRunProcess = useCallback(() => {
    if (!modelerRef.current) return
    console.log('Starting process simulation...')
    // This would integrate with a BPMN engine for execution
    alert('Process simulation would start here. This requires integration with a BPMN engine.')
  }, [])

  // Meeting/Presentation Mode handler
  const handleMeetingMode = useCallback(() => {
    setIsMeetingMode(!isMeetingMode)
    if (!isMeetingMode) {
      // Enter presentation mode - hide palette, maximize canvas
      document.documentElement.requestFullscreen()
    } else {
      // Exit presentation mode
      if (document.fullscreenElement) {
        document.exitFullscreen()
      }
    }
  }, [isMeetingMode])

  // Minimap toggle handler
  const handleToggleMinimap = useCallback(() => {
    setIsMinimapOpen(!isMinimapOpen)
    // BPMN.js doesn't have built-in minimap, would need custom implementation
    console.log('Minimap toggle:', !isMinimapOpen)
  }, [isMinimapOpen])

  // Language toggle handler
  const handleToggleLanguage = useCallback(() => {
    // Would implement i18n here
    console.log('Language toggle - would implement i18n')
    alert('Language switching would be implemented with i18n library')
  }, [])

  // Grid toggle handler
  const handleToggleGrid = useCallback(() => {
    setShowGrid(prev => {
      const newValue = !prev
      // Apply or remove grid class to canvas container
      if (modelerRef.current) {
        const canvas = modelerRef.current.get('canvas') as any
        const container = canvas._container || canvas.getContainer()
        if (container) {
          if (newValue) {
            container.classList.add('show-grid')
          } else {
            container.classList.remove('show-grid')
          }
        }
      }
      return newValue
    })
  }, [])

  // Handle palette actions
  const handlePaletteAction = useCallback((action: string, event: Event | DragEvent) => {
    if (!modelerRef.current) return
    
    console.log('Palette action:', action)
    
    // Handle tool actions
    if (action.endsWith('-tool')) {
      setActiveTool(action.replace('-tool', ''))
      
      // Activate the tool in BPMN.js
      const handTool = modelerRef.current.get('handTool') as any
      const lassoTool = modelerRef.current.get('lassoTool') as any
      const spaceTool = modelerRef.current.get('spaceTool') as any
      const globalConnect = modelerRef.current.get('globalConnect') as any
      
      switch (action) {
        case 'hand-tool':
          handTool?.activateHand(event)
          break
        case 'lasso-tool':
          lassoTool?.activateSelection(event)
          break
        case 'space-tool':
          spaceTool?.activateSelection(event)
          break
        case 'global-connect-tool':
          globalConnect?.toggle(event)
          break
      }
      return
    }
    
    // Handle element creation
    if (action.startsWith('create.')) {
      const elementFactory = modelerRef.current.get('elementFactory') as any
      const create = modelerRef.current.get('create') as any
      const canvas = modelerRef.current.get('canvas') as any
      const modeling = modelerRef.current.get('modeling') as any
      
      // Parse the element type from action (keep original format)
      const elementType = action.replace('create.', '')
      console.log('Creating element type:', elementType)
      
      let type = 'bpmn:Task' // default
      let eventDefinitionType = undefined
      
      // Map all possible actions to BPMN types (matching registry actions)
      const typeMap: Record<string, { type: string; eventDefinitionType?: string; isExpanded?: boolean; triggeredByEvent?: boolean }> = {
        // Start Events
        'start-event': { type: 'bpmn:StartEvent' },
        'start-event-message': { type: 'bpmn:StartEvent', eventDefinitionType: 'bpmn:MessageEventDefinition' },
        'start-event-timer': { type: 'bpmn:StartEvent', eventDefinitionType: 'bpmn:TimerEventDefinition' },
        'start-event-conditional': { type: 'bpmn:StartEvent', eventDefinitionType: 'bpmn:ConditionalEventDefinition' },
        'start-event-signal': { type: 'bpmn:StartEvent', eventDefinitionType: 'bpmn:SignalEventDefinition' },
        
        // End Events
        'end-event': { type: 'bpmn:EndEvent' },
        'end-event-message': { type: 'bpmn:EndEvent', eventDefinitionType: 'bpmn:MessageEventDefinition' },
        'end-event-escalation': { type: 'bpmn:EndEvent', eventDefinitionType: 'bpmn:EscalationEventDefinition' },
        'end-event-error': { type: 'bpmn:EndEvent', eventDefinitionType: 'bpmn:ErrorEventDefinition' },
        'end-event-cancel': { type: 'bpmn:EndEvent', eventDefinitionType: 'bpmn:CancelEventDefinition' },
        'end-event-compensation': { type: 'bpmn:EndEvent', eventDefinitionType: 'bpmn:CompensateEventDefinition' },
        'end-event-signal': { type: 'bpmn:EndEvent', eventDefinitionType: 'bpmn:SignalEventDefinition' },
        'end-event-terminate': { type: 'bpmn:EndEvent', eventDefinitionType: 'bpmn:TerminateEventDefinition' },
        
        // Intermediate Events
        'intermediate-event': { type: 'bpmn:IntermediateThrowEvent' },
        'intermediate-event-message': { type: 'bpmn:IntermediateThrowEvent', eventDefinitionType: 'bpmn:MessageEventDefinition' },
        'intermediate-event-timer': { type: 'bpmn:IntermediateCatchEvent', eventDefinitionType: 'bpmn:TimerEventDefinition' },
        'intermediate-event-escalation': { type: 'bpmn:IntermediateThrowEvent', eventDefinitionType: 'bpmn:EscalationEventDefinition' },
        'intermediate-event-conditional': { type: 'bpmn:IntermediateCatchEvent', eventDefinitionType: 'bpmn:ConditionalEventDefinition' },
        'intermediate-event-link': { type: 'bpmn:IntermediateThrowEvent', eventDefinitionType: 'bpmn:LinkEventDefinition' },
        'intermediate-event-compensation': { type: 'bpmn:IntermediateThrowEvent', eventDefinitionType: 'bpmn:CompensateEventDefinition' },
        'intermediate-event-signal': { type: 'bpmn:IntermediateThrowEvent', eventDefinitionType: 'bpmn:SignalEventDefinition' },
        
        // Tasks
        'task': { type: 'bpmn:Task' },
        'user-task': { type: 'bpmn:UserTask' },
        'service-task': { type: 'bpmn:ServiceTask' },
        'script-task': { type: 'bpmn:ScriptTask' },
        'business-rule-task': { type: 'bpmn:BusinessRuleTask' },
        'send-task': { type: 'bpmn:SendTask' },
        'receive-task': { type: 'bpmn:ReceiveTask' },
        'manual-task': { type: 'bpmn:ManualTask' },
        
        // Gateways
        'exclusive-gateway': { type: 'bpmn:ExclusiveGateway' },
        'parallel-gateway': { type: 'bpmn:ParallelGateway' },
        'inclusive-gateway': { type: 'bpmn:InclusiveGateway' },
        'event-based-gateway': { type: 'bpmn:EventBasedGateway' },
        'complex-gateway': { type: 'bpmn:ComplexGateway' },
        
        // Sub Process
        'subprocess-expanded': { type: 'bpmn:SubProcess', isExpanded: true },
        'subprocess-collapsed': { type: 'bpmn:SubProcess', isExpanded: false },
        'event-subprocess': { type: 'bpmn:SubProcess', triggeredByEvent: true },
        'transaction': { type: 'bpmn:Transaction' },
        'call-activity': { type: 'bpmn:CallActivity' },
        
        // Data
        'data-object': { type: 'bpmn:DataObjectReference' },
        'data-store': { type: 'bpmn:DataStoreReference' },
        'data-input': { type: 'bpmn:DataInput' },
        'data-output': { type: 'bpmn:DataOutput' },
        
        // Participants
        'participant-expanded': { type: 'bpmn:Participant' },
        'participant': { type: 'bpmn:Participant' },
        'lane': { type: 'bpmn:Lane' },
        
        // Artifacts
        'group': { type: 'bpmn:Group' },
        'text-annotation': { type: 'bpmn:TextAnnotation' }
      }
      
      const elementConfig = typeMap[elementType] || { type: 'bpmn:Task' }
      
      // Create the shape with proper configuration
      const shapeConfig: any = { type: elementConfig.type }
      
      // Add event definition if needed
      if (elementConfig.eventDefinitionType) {
        const bpmnFactory = modelerRef.current.get('bpmnFactory') as any
        const eventDefinition = bpmnFactory.create(elementConfig.eventDefinitionType)
        shapeConfig.eventDefinitionType = elementConfig.eventDefinitionType
        shapeConfig.businessObject = bpmnFactory.create(elementConfig.type, {
          eventDefinitions: [eventDefinition]
        })
      }
      
      // Handle expanded/collapsed state
      if ('isExpanded' in elementConfig) {
        shapeConfig.isExpanded = elementConfig.isExpanded
      }
      
      if ('triggeredByEvent' in elementConfig) {
        shapeConfig.triggeredByEvent = elementConfig.triggeredByEvent
      }
      
      const shape = elementFactory.createShape(shapeConfig)
      
      // If it's a drag event, use drag coordinates
      if (event instanceof DragEvent) {
        console.log('Starting drag create for:', elementType)
        // For drag events, we need to let BPMN.js handle the drop
        // The create module expects the drag event to continue
        create.start(event, shape)
      } else {
        // For click events, directly create the shape at a position
        console.log('Creating element via click:', elementType)
        const rootElement = canvas.getRootElement()
        const viewport = canvas.viewbox()
        
        // Calculate center position accounting for current zoom
        const centerX = viewport.x + (viewport.width / 2)
        const centerY = viewport.y + (viewport.height / 2)
        
        // Directly create the shape using modeling
        modeling.createShape(shape, { x: centerX, y: centerY }, rootElement)
      }
    }
  }, [])

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Studio</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Use the proper BpmnToolbar component with all handlers */}
      <BpmnToolbar
        onSave={handleSave}
        onExport={handleExport}
        onImport={() => fileInputRef.current?.click()}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitToViewport={handleZoomReset}
        onClear={handleClear}
        onToggleTheme={handleThemeToggle}
        onAlignLeft={handleAlignLeft}
        onAlignCenter={handleAlignCenter}
        onAlignRight={handleAlignRight}
        onAlignTop={handleAlignTop}
        onAlignMiddle={handleAlignMiddle}
        onAlignBottom={handleAlignBottom}
        onPreview={handlePreview}
        onRun={handleRunProcess}
        onMeetingMode={handleMeetingMode}
        onToggleMinimap={handleToggleMinimap}
        onToggleLanguage={handleToggleLanguage}
        onToggleGrid={handleToggleGrid}
        theme={theme}
        zoomLevel={zoomLevel}
        canUndo={canUndo}
        canRedo={canRedo}
        disabled={saving}
        isMeetingMode={isMeetingMode}
        isMinimapOpen={isMinimapOpen}
        showGrid={showGrid}
      />

      {/* Main Content Area with Custom Collapsible Palette */}
      <div className="flex-1 flex overflow-hidden">
        {/* Custom Collapsible BPMN Elements Palette - hide in meeting mode */}
        {!isMeetingMode && (
          <BpmnElementsPalette 
            onAction={handlePaletteAction}
            activeTool={activeTool}
          />
        )}

        {/* Canvas Container */}
        <div className="flex-1 relative bg-gray-50 dark:bg-gray-900">
          <div 
            ref={containerRef}
            className="w-full h-full"
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0
            }}
          />
          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50/90 dark:bg-gray-900/90 pointer-events-none">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Initializing BPMN Studio...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".bpmn,.xml"
        onChange={handleImport}
        className="hidden"
      />

      {/* XML Viewer Modal */}
      <XmlViewerModal
        isOpen={showXmlViewer}
        onClose={() => setShowXmlViewer(false)}
        xml={currentXml}
        onSave={handleXmlSave}
        readOnly={false}
      />
    </div>
  )
}