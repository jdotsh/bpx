# 🔌 Backend-Frontend Wiring: Memory-Efficient Architecture

## **MEMORY-EFFICIENT DESIGN PRINCIPLES**

### **1. Frontend Memory Optimization**
```typescript
// ❌ CURRENT PROBLEM: 21 useState = memory fragmentation
const [designer, setDesigner] = useState()
const [zoomLevel, setZoomLevel] = useState()
// ... 19 more states

// ✅ SOLUTION: Single state object with reducer
const [state, dispatch] = useReducer(studioReducer, {
  designer: null,
  viewport: { zoom: 100, pan: { x: 0, y: 0 } },
  document: { id: null, isDirty: false }
})
```

### **2. Backend Connection Architecture**

#### **A. tRPC Setup (Type-safe API)**
```typescript
// lib/trpc/client.ts
import { createTRPCReact } from '@trpc/react-query'
import { httpBatchLink } from '@trpc/client'
import superjson from 'superjson'

export const trpc = createTRPCReact<AppRouter>()

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      transformer: superjson, // Handles Date/BigInt serialization
    })
  ]
})
```

#### **B. Server Context (Auth + DB)**
```typescript
// lib/trpc/context.ts
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { prisma } from '@/lib/prisma'

export async function createContext(req: NextRequest) {
  const supabase = createServerSupabaseClient({ req })
  const { data: { user } } = await supabase.auth.getUser()
  
  return {
    db: prisma,
    userId: user?.id,
    supabase
  }
}
```

#### **C. API Routes**
```typescript
// lib/trpc/routers/diagram.router.ts
export const diagramRouter = router({
  // List diagrams with pagination (memory efficient)
  list: protectedProcedure
    .input(z.object({
      cursor: z.string().optional(),
      limit: z.number().min(1).max(50).default(20)
    }))
    .query(async ({ ctx, input }) => {
      const diagrams = await ctx.db.diagram.findMany({
        where: { profileId: ctx.userId, deletedAt: null },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          thumbnail: true, // Small base64 preview
          updatedAt: true,
          // DON'T select bpmnXml here (too large)
        }
      })
      
      let nextCursor: string | undefined
      if (diagrams.length > input.limit) {
        const nextItem = diagrams.pop()
        nextCursor = nextItem!.id
      }
      
      return { diagrams, nextCursor }
    }),

  // Get single diagram (load XML only when needed)
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.diagram.findFirst({
        where: { id: input.id, profileId: ctx.userId }
      })
    }),

  // Auto-save with debouncing
  save: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string(),
      bpmnXml: z.string(),
      version: z.number() // Optimistic locking
    }))
    .mutation(async ({ ctx, input }) => {
      // Check version for conflicts
      const current = await ctx.db.diagram.findUnique({
        where: { id: input.id },
        select: { version: true }
      })
      
      if (current?.version !== input.version) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Diagram was modified elsewhere'
        })
      }
      
      // Update with version increment
      const updated = await ctx.db.diagram.update({
        where: { id: input.id },
        data: {
          title: input.title,
          bpmnXml: input.bpmnXml,
          version: { increment: 1 }
        }
      })
      
      // Create version snapshot (async, don't block)
      ctx.db.diagramVersion.create({
        data: {
          diagramId: input.id,
          version: updated.version,
          bpmnXml: input.bpmnXml,
          authorId: ctx.userId
        }
      }).catch(console.error) // Fire and forget
      
      return updated
    })
})
```

### **3. Frontend Integration**

#### **A. Provider Setup**
```typescript
// app/providers.tsx
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { trpc, trpcClient } from '@/lib/trpc/client'
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { useState } from 'react'

// Memory-efficient QueryClient config
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10,   // 10 minutes (was cacheTime)
      refetchOnWindowFocus: false,
    }
  }
})

export function Providers({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createBrowserSupabaseClient())
  
  return (
    <SessionContextProvider supabaseClient={supabase}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </trpc.Provider>
    </SessionContextProvider>
  )
}
```

#### **B. Auto-Save Hook (Memory Efficient)**
```typescript
// hooks/use-autosave.ts
import { useRef, useCallback, useEffect } from 'react'
import { trpc } from '@/lib/trpc/client'

export function useAutosave(
  diagramId: string | null,
  getContent: () => Promise<{ xml: string; title: string }>,
  version: number
) {
  const saveTimer = useRef<NodeJS.Timeout>()
  const lastSaved = useRef<string>()
  
  const mutation = trpc.diagram.save.useMutation({
    onSuccess: (data) => {
      lastSaved.current = data.bpmnXml
    }
  })
  
  const triggerSave = useCallback(async () => {
    if (!diagramId) return
    
    // Clear existing timer
    clearTimeout(saveTimer.current)
    
    // Debounce 1 second
    saveTimer.current = setTimeout(async () => {
      const { xml, title } = await getContent()
      
      // Skip if unchanged
      if (xml === lastSaved.current) return
      
      mutation.mutate({
        id: diagramId,
        title,
        bpmnXml: xml,
        version
      })
    }, 1000)
  }, [diagramId, getContent, version])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimeout(saveTimer.current)
  }, [])
  
  return {
    triggerSave,
    isSaving: mutation.isPending,
    error: mutation.error
  }
}
```

#### **C. Optimized BpmnStudio Component**
```typescript
// components/bpmn/bpmn-studio-optimized.tsx
'use client'
import { useReducer, useCallback, useRef } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useAutosave } from '@/hooks/use-autosave'
import { studioReducer, initialState } from '@/lib/store/studio-store'

export function BpmnStudioOptimized({ diagramId }: { diagramId?: string }) {
  const [state, dispatch] = useReducer(studioReducer, initialState)
  const designerRef = useRef<BpmnDesigner>()
  
  // Load diagram data
  const { data: diagram } = trpc.diagram.get.useQuery(
    { id: diagramId! },
    { enabled: !!diagramId }
  )
  
  // Auto-save setup
  const getContent = useCallback(async () => {
    const xml = await designerRef.current?.getXml() || ''
    return { xml, title: state.title }
  }, [state.title])
  
  const { triggerSave, isSaving } = useAutosave(
    diagramId,
    getContent,
    diagram?.version || 1
  )
  
  // Handle designer ready
  const handleDesignerReady = useCallback((designer: BpmnDesigner) => {
    designerRef.current = designer
    dispatch({ type: 'SET_DESIGNER', payload: designer })
    
    // Setup auto-save on changes
    const commandStack = designer.getCommandStack()
    commandStack.on('changed', () => {
      dispatch({ type: 'MARK_DIRTY' })
      triggerSave()
    })
  }, [triggerSave])
  
  // Memory-efficient event handlers
  const handlers = useRef({
    zoom: (level: number) => dispatch({ type: 'SET_ZOOM', payload: level }),
    undo: () => designerRef.current?.undo(),
    redo: () => designerRef.current?.redo(),
  }).current
  
  return (
    <div className="flex h-screen">
      <BpmnToolbar 
        {...state}
        onZoom={handlers.zoom}
        onUndo={handlers.undo}
        onRedo={handlers.redo}
        isSaving={isSaving}
      />
      <BpmnCanvas
        onDesignerReady={handleDesignerReady}
        initialXml={diagram?.bpmnXml}
      />
    </div>
  )
}
```

### **4. Database Optimization**

#### **A. Efficient Queries**
```sql
-- Add indexes for common queries
CREATE INDEX idx_diagrams_profile_updated ON diagrams(profile_id, updated_at DESC);
CREATE INDEX idx_diagrams_project_updated ON diagrams(project_id, updated_at DESC);
CREATE INDEX idx_diagram_versions_diagram ON diagram_versions(diagram_id, created_at DESC);

-- Partial index for non-deleted diagrams
CREATE INDEX idx_diagrams_active ON diagrams(profile_id, updated_at DESC) 
WHERE deleted_at IS NULL;
```

#### **B. Row Level Security (Supabase)**
```sql
-- Enable RLS
ALTER TABLE diagrams ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own diagrams
CREATE POLICY "Users can view own diagrams" ON diagrams
  FOR SELECT USING (profile_id = auth.uid());

-- Policy: Users can update their own diagrams
CREATE POLICY "Users can update own diagrams" ON diagrams
  FOR UPDATE USING (profile_id = auth.uid());

-- Policy: Users can insert diagrams
CREATE POLICY "Users can insert diagrams" ON diagrams
  FOR INSERT WITH CHECK (profile_id = auth.uid());
```

### **5. Memory Management Best Practices**

#### **Frontend**
1. **Use React.memo()** for heavy components
2. **Virtualize lists** with react-window
3. **Lazy load routes** with dynamic imports
4. **Clear timers/listeners** in useEffect cleanup
5. **Use WeakMap** for object references

#### **Backend**
1. **Paginate queries** (cursor-based)
2. **Select only needed fields**
3. **Use database indexes**
4. **Stream large responses**
5. **Cache with Redis** (optional)

### **6. Testing Strategy**

#### **E2E Test Example**
```typescript
// tests/e2e/diagram.spec.ts
import { test, expect } from '@playwright/test'

test('auto-save works', async ({ page }) => {
  // Login
  await page.goto('/login')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'password')
  await page.click('[type="submit"]')
  
  // Create diagram
  await page.goto('/studio/new')
  await page.fill('[name="title"]', 'Test Diagram')
  
  // Wait for auto-save
  await page.waitForSelector('[data-saving="true"]')
  await page.waitForSelector('[data-saving="false"]')
  
  // Verify saved
  await page.reload()
  await expect(page.locator('[name="title"]')).toHaveValue('Test Diagram')
})
```

## **DEPLOYMENT CHECKLIST**

### **Supabase Setup**
```bash
# 1. Create project at supabase.com
# 2. Get connection strings
# 3. Run migrations
npx prisma migrate deploy

# 4. Set up auth providers
# 5. Configure RLS policies
```

### **Vercel Deployment**
```bash
# 1. Connect GitHub repo
# 2. Set environment variables
# 3. Deploy
vercel --prod

# 4. Set up custom domain
# 5. Configure Stripe webhooks
```

This architecture is **memory-efficient**, **scalable**, and **production-ready**!