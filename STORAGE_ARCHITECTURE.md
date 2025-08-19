# 💾 Client Project Storage Architecture

## **1. DATABASE STORAGE (PostgreSQL via Supabase)**

### **Primary Tables**
```sql
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PROJECTS TABLE - Container for client work
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  description   TEXT,
  settings      JSONB DEFAULT '{}',  -- Project-specific settings
  metadata      JSONB DEFAULT '{}',  -- Custom fields
  is_public     BOOLEAN DEFAULT false,
  deleted_at    TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- DIAGRAMS TABLE - Actual BPMN content
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE diagrams (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID REFERENCES projects(id) ON DELETE CASCADE,
  profile_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title         VARCHAR(255) DEFAULT 'Untitled Diagram',
  bpmn_xml      TEXT NOT NULL,        -- The actual BPMN XML content
  thumbnail     TEXT,                 -- Base64 preview image
  metadata      JSONB DEFAULT '{}',   -- Diagram metadata
  version       INTEGER DEFAULT 1,
  is_public     BOOLEAN DEFAULT false,
  deleted_at    TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- DIAGRAM_VERSIONS TABLE - Version history
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE diagram_versions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagram_id    UUID REFERENCES diagrams(id) ON DELETE CASCADE,
  version       INTEGER NOT NULL,
  bpmn_xml      TEXT NOT NULL,        -- Full XML snapshot
  metadata      JSONB DEFAULT '{}',
  author_id     UUID REFERENCES profiles(id),
  message       TEXT,                 -- Commit message
  created_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(diagram_id, version)
);
```

## **2. OBJECT STORAGE (Supabase Storage)**

### **Bucket Structure**
```typescript
// Storage buckets organization
const STORAGE_BUCKETS = {
  // Public bucket - CDN cached
  'public': {
    'exports/{userId}/{projectId}/{diagramId}/': {
      '{timestamp}.pdf': 'Exported PDFs',
      '{timestamp}.png': 'Exported images',
      '{timestamp}.svg': 'Vector exports'
    },
    'thumbnails/{diagramId}/': {
      'preview.png': 'Diagram preview'
    }
  },
  
  // Private bucket - authenticated access
  'private': {
    'projects/{userId}/{projectId}/': {
      'attachments/': 'Project files',
      'backups/': 'Automated backups',
      'imports/': 'Uploaded BPMN files'
    }
  }
}

// Implementation
class StorageService {
  async saveExport(
    userId: string,
    projectId: string,
    diagramId: string,
    file: Buffer,
    format: 'pdf' | 'png' | 'svg'
  ): Promise<string> {
    const path = `exports/${userId}/${projectId}/${diagramId}/${Date.now()}.${format}`
    
    const { data, error } = await supabase.storage
      .from('public')
      .upload(path, file, {
        contentType: `image/${format}`,
        cacheControl: '3600', // 1 hour cache
        upsert: false
      })
    
    if (error) throw error
    
    // Return public URL
    const { data: { publicUrl } } = supabase.storage
      .from('public')
      .getPublicUrl(path)
    
    return publicUrl
  }
  
  async generateThumbnail(diagramId: string, xml: string): Promise<string> {
    // Generate preview using headless browser
    const thumbnail = await this.renderDiagram(xml, {
      width: 400,
      height: 300,
      format: 'png'
    })
    
    const path = `thumbnails/${diagramId}/preview.png`
    
    await supabase.storage
      .from('public')
      .upload(path, thumbnail, {
        contentType: 'image/png',
        cacheControl: '86400', // 24 hour cache
        upsert: true // Replace existing
      })
    
    return this.getPublicUrl('public', path)
  }
}
```

## **3. DATA ORGANIZATION STRATEGY**

### **Hierarchical Structure**
```
User Account
├── Projects (Containers)
│   ├── Project A
│   │   ├── Diagram 1
│   │   │   ├── Current Version (DB)
│   │   │   ├── Version History (DB)
│   │   │   └── Exports (Storage)
│   │   ├── Diagram 2
│   │   └── Project Files (Storage)
│   └── Project B
│       └── ...
└── Personal Space
    └── Quick Diagrams (No project)
```

### **Storage Distribution**
```typescript
interface StorageStrategy {
  // What goes where
  PostgreSQL: {
    purpose: "Structured data, queries, relationships",
    stores: [
      "Project metadata",
      "BPMN XML content",
      "Version history",
      "User settings",
      "Permissions"
    ],
    maxSize: "10KB - 5MB per diagram"
  },
  
  ObjectStorage: {
    purpose: "Binary files, exports, backups",
    stores: [
      "PDF/PNG/SVG exports",
      "File attachments",
      "Automated backups",
      "Large imports"
    ],
    maxSize: "Up to 50MB per file"
  },
  
  Cache: {
    purpose: "Performance optimization",
    stores: [
      "Active editing sessions",
      "Recent diagrams",
      "Computed thumbnails"
    ],
    TTL: "5-60 minutes"
  }
}
```

## **4. BACKUP & RECOVERY**

### **Automated Backup Strategy**
```typescript
class BackupService {
  // Daily automated backups
  async performDailyBackup(userId: string) {
    const projects = await this.getProjects(userId)
    
    for (const project of projects) {
      // 1. Export all diagrams
      const diagrams = await this.getDiagrams(project.id)
      const backup = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        project,
        diagrams: diagrams.map(d => ({
          ...d,
          versions: await this.getVersions(d.id)
        }))
      }
      
      // 2. Save to storage
      const json = JSON.stringify(backup, null, 2)
      const path = `projects/${userId}/${project.id}/backups/${Date.now()}.json`
      
      await supabase.storage
        .from('private')
        .upload(path, json, {
          contentType: 'application/json'
        })
      
      // 3. Clean old backups (keep last 30)
      await this.cleanOldBackups(userId, project.id, 30)
    }
  }
  
  // Point-in-time recovery
  async restoreFromBackup(userId: string, backupId: string) {
    const backup = await this.getBackup(backupId)
    
    // Restore in transaction
    await db.$transaction(async (tx) => {
      // 1. Restore project
      const project = await tx.project.create({
        data: backup.project
      })
      
      // 2. Restore diagrams
      for (const diagram of backup.diagrams) {
        const created = await tx.diagram.create({
          data: {
            ...diagram,
            projectId: project.id
          }
        })
        
        // 3. Restore versions
        for (const version of diagram.versions) {
          await tx.diagramVersion.create({
            data: {
              ...version,
              diagramId: created.id
            }
          })
        }
      }
    })
  }
}
```

## **5. SCALABILITY CONSIDERATIONS**

### **Storage Limits by Plan**
```typescript
const STORAGE_LIMITS = {
  FREE: {
    projects: 2,
    diagramsPerProject: 5,
    totalStorage: '100MB',
    versionHistory: 5,
    exportFormats: ['xml'],
    backup: 'manual'
  },
  
  PRO: {
    projects: 'unlimited',
    diagramsPerProject: 'unlimited',
    totalStorage: '10GB',
    versionHistory: 'unlimited',
    exportFormats: ['xml', 'pdf', 'png', 'svg'],
    backup: 'daily'
  },
  
  ENTERPRISE: {
    projects: 'unlimited',
    diagramsPerProject: 'unlimited',
    totalStorage: '100GB+',
    versionHistory: 'unlimited',
    exportFormats: 'all',
    backup: 'continuous',
    features: [
      'Custom S3 bucket',
      'On-premise option',
      'Compliance exports'
    ]
  }
}
```

### **Performance Optimization**
```typescript
// 1. Lazy Loading
async function loadDiagram(id: string) {
  // Load metadata first (small)
  const metadata = await db.diagram.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      thumbnail: true,
      updatedAt: true
    }
  })
  
  // Load full XML only when needed
  const fullDiagram = await db.diagram.findUnique({
    where: { id },
    include: { bpmnXml: true }
  })
  
  return fullDiagram
}

// 2. Pagination
async function listProjects(userId: string, cursor?: string) {
  return db.project.findMany({
    where: { profileId: userId },
    take: 20,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { updatedAt: 'desc' }
  })
}

// 3. Compression
async function saveDiagram(data: DiagramData) {
  // Compress large XML before storing
  const compressed = await gzip(data.bpmnXml)
  
  return db.diagram.create({
    data: {
      ...data,
      bpmnXml: compressed.toString('base64'),
      isCompressed: true
    }
  })
}
```

## **6. SECURITY & ACCESS CONTROL**

### **Row Level Security (RLS)**
```sql
-- Users can only access their own projects
CREATE POLICY "Users access own projects" ON projects
  FOR ALL USING (profile_id = auth.uid());

-- Collaborators can access shared projects
CREATE POLICY "Collaborators access projects" ON projects
  FOR SELECT USING (
    profile_id = auth.uid() OR
    id IN (
      SELECT project_id FROM collaborators 
      WHERE user_id = auth.uid()
    )
  );

-- Public diagrams are viewable by all
CREATE POLICY "Public diagrams viewable" ON diagrams
  FOR SELECT USING (is_public = true);
```

### **Storage Security**
```typescript
// Signed URLs for private content
async function getPrivateFileUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('private')
    .createSignedUrl(path, 3600) // 1 hour expiry
  
  if (error) throw error
  return data.signedUrl
}

// Direct public URLs for cached content
function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)
  
  return data.publicUrl
}
```

## **SUMMARY**

**Client projects are stored in:**
1. **PostgreSQL** (Supabase) - All structured data, BPMN XML, metadata
2. **Object Storage** (Supabase Storage) - Files, exports, backups
3. **Cache** (Redis/Memory) - Active sessions, frequent access

This architecture provides:
- ✅ **Scalability** to millions of diagrams
- ✅ **Performance** with caching and CDN
- ✅ **Security** with RLS and signed URLs
- ✅ **Reliability** with automated backups
- ✅ **Cost efficiency** with tiered storage