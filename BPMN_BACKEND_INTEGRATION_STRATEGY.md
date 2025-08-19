# 🔌 BPMN Backend Integration Strategy

## Goal: Wire existing BPMN UI with backend functionality properly

### Current Gaps Analysis
1. **SimpleBpmnStudio** only saves to localStorage - not database
2. Missing connection between BPMN.js and Supabase
3. No proper adapter pattern between frontend and backend
4. Working studio has good UI but no backend connection
5. Current app has backend but broken BPMN functionality

## Integration Architecture

### Phase 1: Create Backend Adapter Layer (Immediate)

```typescript
// lib/bpmn/BpmnBackendAdapter.ts
import { createClient } from '@/lib/auth/client'
import type { Database } from '@/lib/database.types'

export class BpmnBackendAdapter {
  private supabase = createClient()
  
  async saveDiagram(data: {
    id?: string
    name: string
    bpmn_xml: string
    project_id?: string
  }) {
    const { data: user } = await this.supabase.auth.getUser()
    if (!user.user) throw new Error('Not authenticated')
    
    if (data.id) {
      // Update existing
      return await this.supabase
        .from('diagrams')
        .update({
          name: data.name,
          bpmn_xml: data.bpmn_xml,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id)
        .select()
        .single()
    } else {
      // Create new
      return await this.supabase
        .from('diagrams')
        .insert({
          name: data.name,
          bpmn_xml: data.bpmn_xml,
          project_id: data.project_id,
          profile_id: user.user.id
        })
        .select()
        .single()
    }
  }
  
  async loadDiagram(id: string) {
    const { data, error } = await this.supabase
      .from('diagrams')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }
  
  async listDiagrams() {
    const { data, error } = await this.supabase
      .from('diagrams')
      .select('id, name, created_at, updated_at')
      .order('updated_at', { ascending: false })
    
    if (error) throw error
    return data
  }
}
```

### Phase 2: Copy Working Studio Components (Keep UI)

```bash
# Components to copy (UI layer)
cp working studio to analyze/components/bpmn/bpmn-studio.tsx components/bpmn/BpmnStudioUI.tsx
cp working studio to analyze/components/bpmn/bpmn-toolbar.tsx components/bpmn/BpmnToolbarUI.tsx
cp working studio to analyze/components/bpmn/bpmn-canvas.tsx components/bpmn/BpmnCanvasUI.tsx
cp working studio to analyze/components/bpmn/bpmn-elements-palette.tsx components/bpmn/BpmnPaletteUI.tsx

# Core libraries to copy
cp working studio to analyze/lib/bpmn-designer.ts lib/bpmn/core/BpmnDesigner.ts
cp working studio to analyze/lib/custom-palette-provider.ts lib/bpmn/core/CustomPaletteProvider.ts
```

### Phase 3: Create Integrated Component

```typescript
// components/bpmn/BpmnStudioIntegrated.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { BpmnDesigner } from '@/lib/bpmn/core/BpmnDesigner'
import { BpmnBackendAdapter } from '@/lib/bpmn/BpmnBackendAdapter'
import { BpmnToolbarUI } from './BpmnToolbarUI'
import { BpmnCanvasUI } from './BpmnCanvasUI'
import { BpmnPaletteUI } from './BpmnPaletteUI'
import { useToast } from '@/hooks/use-toast'

interface Props {
  diagramId?: string
  projectId?: string
}

export function BpmnStudioIntegrated({ diagramId, projectId }: Props) {
  const [designer, setDesigner] = useState<BpmnDesigner | null>(null)
  const [adapter] = useState(() => new BpmnBackendAdapter())
  const [loading, setLoading] = useState(true)
  const [currentDiagram, setCurrentDiagram] = useState<any>(null)
  const { toast } = useToast()
  
  // Initialize designer
  useEffect(() => {
    const initDesigner = async () => {
      try {
        // Load diagram if ID provided
        let initialXml = undefined
        if (diagramId) {
          const diagram = await adapter.loadDiagram(diagramId)
          setCurrentDiagram(diagram)
          initialXml = diagram.bpmn_xml
        }
        
        // Create designer with backend integration
        const bpmnDesigner = new BpmnDesigner({
          container: '#bpmn-container',
          value: initialXml,
          valueType: 'bpmn',
          theme: 'light',
          gridLine: true,
          keyboard: true,
          onChange: async (getValue) => {
            // Auto-save to backend
            if (currentDiagram?.id) {
              const xml = await getValue('xml')
              await adapter.saveDiagram({
                id: currentDiagram.id,
                name: currentDiagram.name,
                bpmn_xml: xml
              })
            }
          }
        })
        
        setDesigner(bpmnDesigner)
        setLoading(false)
      } catch (error) {
        console.error('Failed to initialize designer:', error)
        toast({
          title: 'Error',
          description: 'Failed to load diagram',
          variant: 'destructive'
        })
        setLoading(false)
      }
    }
    
    initDesigner()
    
    return () => {
      designer?.destroy()
    }
  }, [diagramId])
  
  // Save handler
  const handleSave = async () => {
    if (!designer) return
    
    try {
      const xml = await designer.getXml()
      const name = currentDiagram?.name || `Diagram ${Date.now()}`
      
      const result = await adapter.saveDiagram({
        id: currentDiagram?.id,
        name,
        bpmn_xml: xml,
        project_id: projectId
      })
      
      if (!currentDiagram) {
        setCurrentDiagram(result.data)
      }
      
      toast({
        title: 'Success',
        description: 'Diagram saved successfully'
      })
    } catch (error) {
      console.error('Save failed:', error)
      toast({
        title: 'Error',
        description: 'Failed to save diagram',
        variant: 'destructive'
      })
    }
  }
  
  // Export handler
  const handleExport = async () => {
    if (!designer) return
    
    const xml = await designer.getXml()
    const blob = new Blob([xml], { type: 'text/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentDiagram?.name || 'diagram'}.bpmn`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  return (
    <div className="flex h-screen">
      {/* Keep exact UI from working studio */}
      <BpmnPaletteUI designer={designer} />
      
      <div className="flex-1 flex flex-col">
        <BpmnToolbarUI 
          designer={designer}
          onSave={handleSave}
          onExport={handleExport}
          diagramName={currentDiagram?.name}
        />
        
        <BpmnCanvasUI id="bpmn-container" />
      </div>
    </div>
  )
}
```

### Phase 4: Database Schema (Already exists)

```sql
-- Already created in Supabase
CREATE TABLE public.diagrams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  bpmn_xml TEXT,
  thumbnail TEXT,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Phase 5: API Routes

```typescript
// app/api/diagrams/route.ts
import { createClient } from '@/lib/auth/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { data, error } = await supabase
    .from('diagrams')
    .select('*')
    .eq('profile_id', user.id)
    .order('updated_at', { ascending: false })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const body = await request.json()
  
  const { data, error } = await supabase
    .from('diagrams')
    .insert({
      ...body,
      profile_id: user.id
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}
```

## Implementation Steps

### Today (Immediate Actions)

1. **Create adapter layer** ✅
   - BpmnBackendAdapter.ts for database operations
   - Handle authentication and user context

2. **Copy working UI components** ✅
   - Keep exact same visual appearance
   - Maintain all interactions

3. **Wire backend to UI** ✅
   - Connect save/load to database
   - Add auto-save functionality
   - Handle errors gracefully

4. **Test end-to-end** ✅
   - Create new diagram
   - Save to database
   - Load existing diagram
   - Export as BPMN

### Tomorrow (Enhancement)

1. **Add version history**
2. **Implement collaborative features**
3. **Add diagram templates**
4. **Performance optimization**

## Success Metrics

- [ ] Can create and save diagram to database
- [ ] Can load diagram from database
- [ ] UI looks exactly like working studio
- [ ] Auto-save works (every 30 seconds)
- [ ] Export/Import functionality works
- [ ] No console errors
- [ ] Responsive and performant

## Key Integration Points

1. **BpmnDesigner class** - Core BPMN.js wrapper
2. **BpmnBackendAdapter** - Database operations
3. **Supabase client** - Authentication & data
4. **Auto-save** - Via onChange callback
5. **Error handling** - Toast notifications

This strategy keeps the working UI while properly wiring it to the backend functionality.