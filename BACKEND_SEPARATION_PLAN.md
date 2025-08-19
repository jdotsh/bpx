# 🔄 BACKEND/FRONTEND SEPARATION PLAN

**CRITICAL**: Keep studio design 100% unchanged. Only separate the data layer.

---

## **CURRENT ARCHITECTURE** 
```
Next.js App (Mixed)
├── Frontend: React components + BPMN.js
├── Backend: API routes + database 
└── Storage: localStorage (❌ needs database)
```

## **TARGET ARCHITECTURE**
```
┌─────────────────────────────────────┐
│           FRONTEND LAYER            │
│   ✅ Keep ALL studio design as-is   │
│   • BPMN Canvas (unchanged)         │
│   • Toolbar (unchanged)             │  
│   • Palette (unchanged)             │
│   • Auto-save UI (unchanged)        │
└─────────────────────────────────────┘
              │ API calls
              ▼
┌─────────────────────────────────────┐
│            API LAYER                │
│   • tRPC routes                     │
│   • Input validation (Zod)          │
│   • Authentication                  │
│   • Rate limiting                   │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│          SERVICE LAYER              │
│   • Business logic                  │
│   • Domain rules                    │
│   • Commands/Queries                │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│         DATA LAYER                  │
│   • Prisma + Supabase              │
│   • Redis cache                     │
│   • File storage                    │
└─────────────────────────────────────┘
```

---

## **IMPLEMENTATION STRATEGY** 

### **Step 1: Create Clean API Layer** 
```typescript
// lib/api/diagram-api.ts
export class DiagramAPI {
  // Replace localStorage with database calls
  static async saveDiagram(data: SaveDiagramRequest): Promise<DiagramResponse> {
    return await trpc.diagram.save.mutate(data)
  }
  
  static async loadDiagram(id: string): Promise<DiagramResponse> {
    return await trpc.diagram.get.query({ id })
  }
  
  static async listDiagrams(): Promise<DiagramSummary[]> {
    return await trpc.diagram.list.query()
  }
}
```

### **Step 2: Backend Services (Independent)**
```typescript
// lib/services/diagram.service.ts
export class DiagramService {
  constructor(
    private repository: DiagramRepository,
    private cache: CacheManager,
    private validator: BpmnValidator
  ) {}

  async createDiagram(command: CreateDiagramCommand): Promise<Result<Diagram>> {
    // Pure backend logic - no UI concerns
    const validation = this.validator.validate(command.bpmnXml)
    if (!validation.isValid) {
      return Result.fail(validation.errors)
    }

    const diagram = await this.repository.save({
      ...command,
      id: generateId(),
      createdAt: new Date(),
      version: 1
    })

    await this.cache.invalidate(`user:${command.userId}:diagrams`)
    return Result.ok(diagram)
  }
}
```

### **Step 3: Data Transfer Objects**
```typescript
// lib/dto/diagram.dto.ts
export interface SaveDiagramRequest {
  id?: string
  title: string
  bpmnXml: string
  thumbnail?: string
  projectId?: string
}

export interface DiagramResponse {
  id: string
  title: string
  bpmnXml: string
  thumbnail?: string
  version: number
  updatedAt: Date
}

export interface DiagramSummary {
  id: string
  title: string
  thumbnail?: string
  updatedAt: Date
  version: number
}
```

---

## **KEEP STUDIO DESIGN UNCHANGED** ✅

### **Current Studio Components (DO NOT TOUCH)**
```
components/bpmn/
├── bpmn-studio.tsx      ✅ Keep as-is
├── bpmn-canvas.tsx      ✅ Keep as-is  
├── bpmn-toolbar.tsx     ✅ Keep as-is
├── bpmn-palette.tsx     ✅ Keep as-is
└── bpmn-palette-popover.tsx ✅ Keep as-is
```

### **Only Change: Data Persistence Layer**
```typescript
// components/bpmn/bpmn-studio.tsx (minimal changes)
export function BpmnStudio() {
  // ✅ Keep all UI logic unchanged
  const [designer, setDesigner] = useState<BpmnDesigner | null>(null)
  const [diagramId, setDiagramId] = useState<string>()
  
  // ❌ OLD: localStorage persistence  
  // const savedData = localStorage.getItem('diagram')
  
  // ✅ NEW: API persistence (only change)
  const { data: diagram, mutate: saveDiagram } = trpc.diagram.get.useQuery(
    { id: diagramId! },
    { enabled: !!diagramId }
  )
  
  // ✅ Keep all existing handlers unchanged
  const handleSave = useCallback(async () => {
    if (!designer) return
    
    const xml = await designer.getXml()
    const thumbnail = await designer.getThumbnail()
    
    // ✅ Same interface, different backend
    await saveDiagram({
      id: diagramId,
      title: 'My Diagram',
      bpmnXml: xml,
      thumbnail
    })
  }, [designer, saveDiagram])
  
  // ✅ Keep all existing UI rendering unchanged
  return (
    <div className="flex h-screen">
      <BpmnToolbar onSave={handleSave} />
      <BpmnCanvas onDesignerReady={setDesigner} />
      <BpmnPalette designer={designer} />
    </div>
  )
}
```

---

## **API ROUTES STRUCTURE**

### **tRPC Router Setup**
```typescript
// lib/trpc/routers/_app.ts
export const appRouter = router({
  diagram: diagramRouter,
  auth: authRouter,
  billing: billingRouter,
})

// lib/trpc/routers/diagram.ts  
export const diagramRouter = router({
  // List user's diagrams (summary only)
  list: protectedProcedure
    .query(async ({ ctx }) => {
      return DiagramService.getUserDiagrams(ctx.userId)
    }),

  // Get single diagram (full content)
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return DiagramService.getDiagram(input.id, ctx.userId)
    }),

  // Save diagram (create or update)
  save: protectedProcedure
    .input(SaveDiagramSchema)
    .mutation(async ({ ctx, input }) => {
      return DiagramService.saveDiagram(input, ctx.userId)
    }),

  // Delete diagram (soft delete)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return DiagramService.deleteDiagram(input.id, ctx.userId)
    }),
})
```

### **Service Layer (Backend Logic)**
```typescript
// lib/services/diagram.service.ts
export class DiagramService {
  static async getUserDiagrams(userId: string): Promise<DiagramSummary[]> {
    const cacheKey = `user:${userId}:diagrams`
    
    return CacheManager.getOrSet(cacheKey, async () => {
      return prisma.diagram.findMany({
        where: { 
          profileId: userId, 
          deletedAt: null 
        },
        select: {
          id: true,
          title: true,
          thumbnail: true,
          updatedAt: true,
          version: true
          // No bpmnXml - keep summaries fast
        },
        orderBy: { updatedAt: 'desc' },
        take: 50
      })
    }, 300) // 5 min cache
  }

  static async getDiagram(id: string, userId: string): Promise<DiagramResponse> {
    const diagram = await prisma.diagram.findFirst({
      where: { 
        id, 
        profileId: userId, 
        deletedAt: null 
      }
    })

    if (!diagram) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Diagram not found'
      })
    }

    return {
      id: diagram.id,
      title: diagram.title,
      bpmnXml: diagram.bpmnXml,
      thumbnail: diagram.thumbnail,
      version: diagram.version,
      updatedAt: diagram.updatedAt
    }
  }

  static async saveDiagram(
    data: SaveDiagramRequest, 
    userId: string
  ): Promise<DiagramResponse> {
    // Validate BPMN XML
    const validation = BpmnValidator.validate(data.bpmnXml)
    if (!validation.isValid) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid BPMN XML',
        cause: validation.errors
      })
    }

    // Create or update
    const diagram = await prisma.diagram.upsert({
      where: { id: data.id || 'new' },
      create: {
        id: data.id || generateId(),
        title: data.title,
        bpmnXml: data.bpmnXml,
        thumbnail: data.thumbnail,
        profileId: userId,
        version: 1
      },
      update: {
        title: data.title,
        bpmnXml: data.bpmnXml,
        thumbnail: data.thumbnail,
        version: { increment: 1 },
        updatedAt: new Date()
      }
    })

    // Invalidate cache
    await CacheManager.invalidate(`user:${userId}:diagrams`)
    
    return diagram
  }
}
```

---

## **IMPLEMENTATION STEPS**

### **Phase 1: API Layer (2 hours)**
```bash
# 1. Create tRPC routers
touch lib/trpc/routers/diagram.ts
touch lib/trpc/routers/auth.ts

# 2. Set up DTOs
touch lib/dto/diagram.dto.ts
touch lib/dto/auth.dto.ts

# 3. Create service layer
touch lib/services/diagram.service.ts
touch lib/services/auth.service.ts
```

### **Phase 2: Replace localStorage (1 hour)**
```typescript
// Only change data persistence, keep UI identical

// ❌ OLD
localStorage.setItem('diagram', JSON.stringify(data))
const data = JSON.parse(localStorage.getItem('diagram') || '{}')

// ✅ NEW  
const { mutate: saveDiagram } = trpc.diagram.save.useMutation()
const { data } = trpc.diagram.get.useQuery({ id })
```

### **Phase 3: Add Caching (1 hour)**
```typescript
// Add Redis caching layer
// Add React Query for frontend caching
// Add ETags for HTTP caching
```

### **Phase 4: Test Integration (1 hour)**
```bash
# Test that studio works identically
npm run dev
# Open /studio
# Create diagram -> should save to database
# Reload page -> should load from database
# Auto-save -> should work seamlessly
```

---

## **BENEFITS OF SEPARATION**

### **Backend Benefits**
- ✅ Independent scaling
- ✅ API-first design
- ✅ Clear business logic separation
- ✅ Better testing (unit tests for services)
- ✅ Multiple frontend support (web, mobile, API)

### **Frontend Benefits**  
- ✅ Studio design stays identical
- ✅ Better performance (React Query caching)
- ✅ Real-time updates possible
- ✅ Offline support with sync
- ✅ Better error handling

### **Developer Benefits**
- ✅ Clear separation of concerns
- ✅ Backend can be developed independently  
- ✅ Frontend can be deployed separately
- ✅ API can be versioned
- ✅ Better debugging and monitoring

---

## **SUCCESS CRITERIA** ✅

### **Functional Requirements**
- [ ] Studio UI works identically to current design
- [ ] All BPMN functionality preserved (create, edit, save)
- [ ] Auto-save works seamlessly
- [ ] Data persists in database (not localStorage)
- [ ] Multiple users can have separate diagrams

### **Non-Functional Requirements**
- [ ] API response time <200ms
- [ ] Frontend feels as fast as localStorage
- [ ] Clean separation between layers
- [ ] Backend services are testable
- [ ] Frontend can work offline (future)

**Bottom Line**: Users see zero difference in studio experience, but data now lives in the database with proper backend architecture.