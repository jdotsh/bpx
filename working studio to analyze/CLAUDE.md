# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **BPMN Studio Web**, an enterprise-grade BPMN process design and modeling platform built as a Next.js application. It's designed as a modern, SaaS-ready web application for creating and editing BPMN diagrams.

**Key Characteristics:**
- Next.js 14 with App Router and TypeScript
- Tailwind CSS + shadcn/ui for styling
- BPMN.js engine for diagram editing
- Enterprise-grade architecture ready for SaaS deployment
- Full-stack web application (no longer a library)

## Development Commands

### Core Development
- `npm run dev` - Start development server at http://localhost:3000
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking

### Building and Testing
- `npm run build && npm start` - Test production build locally
- Next.js automatically handles hot module replacement in development

## Architecture Overview

### Next.js App Router Structure
```
app/
├── globals.css           # Global styles with Tailwind + BPMN.js styles
├── layout.tsx           # Root layout with Inter font
├── page.tsx            # Homepage with feature cards
└── studio/
    └── page.tsx        # BPMN Studio editor page
```

### Component Architecture
```
components/
├── ui/                 # shadcn/ui base components
│   ├── button.tsx     # Reusable button component
│   └── card.tsx       # Card components for layouts
└── bpmn/              # BPMN-specific components
    ├── bpmn-studio.tsx    # Main studio orchestrator
    ├── bpmn-toolbar.tsx   # Toolbar with actions
    └── bpmn-canvas.tsx    # BPMN diagram canvas
```

### Core Logic Architecture
```
lib/
├── bpmn-designer.ts   # Core BPMN.js integration class
├── bpmn-utils.ts      # BPMN XML/YAML/JSON utilities
├── types.ts           # TypeScript interfaces
└── utils.ts           # Tailwind utility functions
```

## Key Architectural Concepts

### 1. Enterprise SaaS Architecture
- **Next.js App Router**: Modern React framework with server/client components
- **Tailwind + shadcn/ui**: Consistent, theme-able design system
- **TypeScript**: Full type safety across the application
- **Component composition**: Reusable, composable React components

### 2. BPMN Integration Pattern
The BPMN functionality is encapsulated in the `BpmnDesigner` class:
- **BpmnDesigner**: Core class that wraps bpmn-js modeler
- **BpmnCanvas**: React component that initializes the designer
- **BpmnStudio**: High-level orchestrator component
- **BpmnToolbar**: Action handlers for editor operations

### 3. State Management
- **React state**: Local component state for UI
- **BPMN.js internal state**: Diagram data managed by BPMN.js
- **Theme state**: Global theme switching via React context and CSS classes

### 4. Styling Architecture
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Pre-built components with consistent design
- **CSS Custom Properties**: Theme variables for light/dark mode
- **BPMN.js styles**: Imported CSS for diagram rendering

## Important Implementation Details

### BPMN Designer Integration
```typescript
// Core integration class
export class BpmnDesigner {
  private bpmnModeler: BpmnModeler
  
  constructor(options: BpmnDesignerOptions) {
    this.createModeler()
    this.setupEventListeners()
  }
  
  // Key methods for React integration
  getXml(): Promise<string>
  getCommandStack() // For undo/redo
  getCanvas() // For zoom operations
}
```

### React Component Pattern
```typescript
// Components follow this pattern
export function BpmnComponent({ onSomething }: Props) {
  const [state, setState] = useState()
  
  const handleAction = useCallback(() => {
    // Business logic
    onSomething?.()
  }, [onSomething])
  
  return <div className="tailwind-classes">...</div>
}
```

### Type Safety
- All BPMN-related types defined in `lib/types.ts`
- External module types declared in `types/bpmn-modules.d.ts`
- Props interfaces for all React components

## Current Functionality

### ✅ Working Features
- **Visual BPMN Editor**: Full BPMN.js integration with drag-drop
- **Toolbar Actions**: Import, Export, Undo/Redo, Zoom, Theme toggle
- **File Operations**: BPMN XML import/export
- **Theme System**: Light/dark mode switching
- **Responsive Design**: Works on desktop and tablets
- **Type Safety**: Full TypeScript coverage

### 🔄 Simplified Implementations (Extension Points)
- **YAML/JSON Export**: Basic structure, needs full conversion logic
- **Property Panel**: Placeholder for element properties
- **Minimap Toggle**: Button exists, needs implementation
- **Advanced BPMN Elements**: Currently supports basic BPMN shapes

## Development Patterns

### Adding New Features
1. **Types First**: Define interfaces in `lib/types.ts`
2. **Core Logic**: Implement in appropriate `lib/` file
3. **React Components**: Create in `components/` with proper TypeScript
4. **Styling**: Use Tailwind classes and shadcn/ui components

### Component Creation
```typescript
// Follow this pattern for new components
'use client' // Only if client-side features needed

import { ComponentProps } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MyComponentProps extends ComponentProps<'div'> {
  // Custom props
}

export function MyComponent({ className, ...props }: MyComponentProps) {
  return (
    <div className={cn("base-styles", className)} {...props}>
      {/* Component content */}
    </div>
  )
}
```

### Theme Integration
- Use Tailwind's `dark:` prefix for dark mode styles
- Leverage CSS custom properties from `globals.css`
- Toggle theme via `document.documentElement.classList.toggle('dark')`

This is now a production-ready enterprise BPMN studio application, not a library. The architecture supports scaling to a full SaaS platform with user authentication, project management, and collaborative editing features.

## Critical Analysis: Palette Implementation (2025-08-18)

### Current Implementation vs BPMN.js Standards

After analyzing the official diagram-js Palette implementation, several key insights:

#### 1. **Tool Actions vs Element Creation**
The BPMN.js palette distinguishes between:
- **Tools** (group='tools'): Change interaction mode (`hand-tool`, `lasso-tool`, `space-tool`, `global-connect-tool`)
- **Elements**: Create new BPMN elements via drag or click

**Key Finding**: Tools use `highlighted-entry` class when active and DON'T need popover effects.

#### 2. **Palette Provider Pattern**
BPMN.js uses a provider pattern where:
```javascript
palette.registerProvider(provider)
provider.getPaletteEntries() // Returns entries with action handlers
```

Each entry has:
- `group`: Category (tools, events, tasks, etc.)
- `action`: Handler function or object with click/dragstart handlers
- `className`: CSS classes for styling
- `title`: Tooltip text

#### 3. **Event Handling**
The official implementation uses:
- `click` events for tools (mode switching)
- `dragstart` events for element creation
- `palette.trigger` event for custom handling

#### 4. **Critical Improvements Needed**

**MUST FIX**:
1. Top 4 tools should NOT trigger popover - they're mode switchers
2. Separate visual treatment for tools vs elements
3. Use proper BPMN.js event delegation pattern
4. Implement `highlighted-entry` for active tool

**Current Issues**:
- We're treating all palette items the same
- No visual distinction between tools and elements
- Popover appears for tool actions (incorrect)
- Not following BPMN.js group structure

### Proposed Solution Architecture

```typescript
// Palette Structure
Tools Section (no popover):
├── Hand Tool (selection mode)
├── Lasso Tool (multi-select)  
├── Space Tool (pan mode)
└── Global Connect (connection mode)

Elements Section (with popover when collapsed):
├── Events (start, end, intermediate)
├── Tasks (user, service, manual, etc.)
├── Gateways (exclusive, parallel, etc.)
└── Data Objects

// Behavior Rules
1. Tools: Click to activate, highlight when active
2. Elements: Hover shows popover (collapsed), drag to create
3. Visual separator between sections
4. Follow BPMN.js event patterns
```

### Implementation Plan

1. **Refactor Palette Component**:
   - Split tools and elements into separate sections
   - Add visual separator
   - Implement proper group handling

2. **Event Handling**:
   - Tools: Only `click`, no popover
   - Elements: Support both `click` and `dragstart`
   - Add `highlighted-entry` for active tool

3. **Popover Logic**:
   - Only show for element entries when collapsed
   - Never show for tool entries
   - Group elements by category in popover

4. **Follow BPMN.js Patterns**:
   - Use data-group attribute
   - Implement proper event delegation
   - Support palette.trigger events