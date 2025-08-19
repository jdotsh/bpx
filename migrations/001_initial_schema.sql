-- BPMN Studio Web SaaS - Initial Schema
-- Release 1 Day 1: Database Setup

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Organizations table (multi-tenant root)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  
  -- Limits by plan
  max_diagrams INTEGER DEFAULT 5,
  max_collaborators INTEGER DEFAULT 3,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  
  -- Role within organization
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  
  -- Preferences
  preferences JSONB DEFAULT '{}',
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id, email)
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  
  -- Access control
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'team', 'public')),
  
  -- Audit
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(org_id, name) WHERE deleted_at IS NULL
);

-- Diagrams table (optimized for 1K concurrent users)
CREATE TABLE diagrams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Content
  title TEXT NOT NULL,
  description TEXT,
  
  -- BPMN storage (performance optimized)
  bpmn_xml TEXT, -- For small diagrams (<2MB)
  xml_url TEXT,  -- For large diagrams (Supabase Storage)
  xml_size INTEGER DEFAULT 0,
  
  -- Metadata for fast queries
  metadata JSONB DEFAULT '{}',
  element_count INTEGER DEFAULT 0,
  complexity_score INTEGER DEFAULT 0,
  
  -- Visual
  thumbnail_url TEXT,
  thumbnail_generated_at TIMESTAMPTZ,
  
  -- Versioning (optimistic concurrency)
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Access control
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'team', 'public')),
  
  -- Audit
  created_by UUID NOT NULL REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT version_positive CHECK (version > 0),
  CONSTRAINT xml_storage_check CHECK (
    (bpmn_xml IS NOT NULL AND xml_url IS NULL) OR
    (bpmn_xml IS NULL AND xml_url IS NOT NULL)
  )
);

-- Diagram versions (for audit and undo)
CREATE TABLE diagram_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagram_id UUID NOT NULL REFERENCES diagrams(id) ON DELETE CASCADE,
  
  -- Version info
  rev_number INTEGER NOT NULL,
  message TEXT DEFAULT 'Auto-saved',
  
  -- Content snapshot
  bpmn_xml TEXT,
  xml_url TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Changes summary
  changes_summary JSONB DEFAULT '{}',
  element_count INTEGER DEFAULT 0,
  
  -- Audit
  author_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(diagram_id, rev_number)
);

-- Collaborators (who can access what)
CREATE TABLE collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What they're collaborating on
  resource_type TEXT NOT NULL CHECK (resource_type IN ('project', 'diagram')),
  resource_id UUID NOT NULL,
  
  -- Who has access
  profile_id UUID NOT NULL REFERENCES profiles(id),
  
  -- What level of access
  permission TEXT NOT NULL CHECK (permission IN ('view', 'comment', 'edit', 'admin')),
  
  -- Audit
  invited_by UUID NOT NULL REFERENCES profiles(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  
  UNIQUE(resource_type, resource_id, profile_id)
);

-- Activity log (for audit and analytics)
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who
  user_id UUID REFERENCES profiles(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  
  -- What
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  
  -- Details
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  
  -- When
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outbox for async processing
CREATE TABLE outbox_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event details
  event_type TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  aggregate_id UUID NOT NULL,
  
  -- Payload
  payload JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  
  -- Processing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Partitioning ready
  partition_key DATE GENERATED ALWAYS AS (DATE(created_at)) STORED
);

-- Performance indexes for 1K concurrent users
CREATE INDEX idx_profiles_org ON profiles(org_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_profiles_email ON profiles(email);

CREATE INDEX idx_projects_org_updated ON projects(org_id, updated_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_created_by ON projects(created_by) WHERE deleted_at IS NULL;

CREATE INDEX idx_diagrams_org_updated ON diagrams(org_id, updated_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_diagrams_project ON diagrams(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_diagrams_created_by ON diagrams(created_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_diagrams_element_count ON diagrams(element_count) WHERE deleted_at IS NULL;

-- Full-text search
CREATE INDEX idx_diagrams_search ON diagrams USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX idx_projects_search ON projects USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Version history performance
CREATE INDEX idx_diagram_versions_diagram_rev ON diagram_versions(diagram_id, rev_number DESC);
CREATE INDEX idx_diagram_versions_author ON diagram_versions(author_id, created_at DESC);

-- Collaborators lookup
CREATE INDEX idx_collaborators_resource ON collaborators(resource_type, resource_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_collaborators_profile ON collaborators(profile_id) WHERE revoked_at IS NULL;

-- Activity and outbox
CREATE INDEX idx_activity_logs_user_time ON activity_logs(user_id, occurred_at DESC);
CREATE INDEX idx_activity_logs_org_time ON activity_logs(org_id, occurred_at DESC);
CREATE INDEX idx_outbox_unprocessed ON outbox_events(created_at) WHERE processed_at IS NULL AND failed_at IS NULL;
CREATE INDEX idx_outbox_partition ON outbox_events(partition_key, created_at);

-- Row Level Security (RLS) Policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagrams ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagram_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Organization access (user must be member)
CREATE POLICY "org_member_access" ON organizations
  FOR ALL USING (
    id IN (
      SELECT org_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Profile access (own profile + org members)
CREATE POLICY "profile_access" ON profiles
  FOR ALL USING (
    id = auth.uid() OR 
    org_id IN (
      SELECT org_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Project access (org members + collaborators)
CREATE POLICY "project_access" ON projects
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM profiles WHERE id = auth.uid()
    ) OR
    id IN (
      SELECT resource_id FROM collaborators 
      WHERE resource_type = 'project' 
      AND profile_id = auth.uid() 
      AND revoked_at IS NULL
    )
  );

-- Diagram access (org members + collaborators + public)
CREATE POLICY "diagram_access" ON diagrams
  FOR ALL USING (
    visibility = 'public' OR
    org_id IN (
      SELECT org_id FROM profiles WHERE id = auth.uid()
    ) OR
    id IN (
      SELECT resource_id FROM collaborators 
      WHERE resource_type = 'diagram' 
      AND profile_id = auth.uid() 
      AND revoked_at IS NULL
    )
  );

-- Version access (follows diagram access)
CREATE POLICY "version_access" ON diagram_versions
  FOR ALL USING (
    diagram_id IN (
      SELECT id FROM diagrams -- RLS will filter diagrams user can access
    )
  );

-- Collaborator access (own invitations + org admins)
CREATE POLICY "collaborator_access" ON collaborators
  FOR ALL USING (
    profile_id = auth.uid() OR
    invited_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Activity log access (own activities + org members)
CREATE POLICY "activity_access" ON activity_logs
  FOR ALL USING (
    user_id = auth.uid() OR
    org_id IN (
      SELECT org_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Functions for common operations
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_diagrams_updated_at
  BEFORE UPDATE ON diagrams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to log activities
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_logs (
    user_id,
    org_id,
    action,
    resource_type,
    resource_id,
    metadata
  ) VALUES (
    auth.uid(),
    COALESCE(NEW.org_id, OLD.org_id),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' THEN 'updated'
      WHEN TG_OP = 'DELETE' THEN 'deleted'
    END,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Activity logging triggers
CREATE TRIGGER log_project_activity
  AFTER INSERT OR UPDATE OR DELETE ON projects
  FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER log_diagram_activity
  AFTER INSERT OR UPDATE OR DELETE ON diagrams
  FOR EACH ROW EXECUTE FUNCTION log_activity();

-- Comments for documentation
COMMENT ON TABLE organizations IS 'Multi-tenant root - each org is isolated';
COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth.users';
COMMENT ON TABLE projects IS 'Project containers for organizing diagrams';
COMMENT ON TABLE diagrams IS 'BPMN diagrams with version control and collaboration';
COMMENT ON TABLE diagram_versions IS 'Version history for audit and undo functionality';
COMMENT ON TABLE collaborators IS 'Fine-grained access control for projects and diagrams';
COMMENT ON TABLE activity_logs IS 'Audit trail for all user actions';
COMMENT ON TABLE outbox_events IS 'Event sourcing for async processing (thumbnails, notifications, etc)';

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;