-- RLS Policies for BPMN Studio - Production Grade
-- R2: Production Tightening

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagrams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagram_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only access their own profile
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid()::text = id);

-- Projects: Owners & collaborators access
CREATE POLICY "projects_select" ON public.projects
  FOR SELECT USING (
    auth.uid()::text = owner_id OR 
    EXISTS(
      SELECT 1 FROM public.collaborators c 
      WHERE c.project_id = id AND c.user_id = auth.uid()::text
    )
  );

CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT WITH CHECK (auth.uid()::text = owner_id);

CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE USING (
    auth.uid()::text = owner_id OR 
    EXISTS(
      SELECT 1 FROM public.collaborators c 
      WHERE c.project_id = id AND c.user_id = auth.uid()::text 
      AND c.role IN ('OWNER', 'EDITOR')
    )
  );

CREATE POLICY "projects_delete" ON public.projects
  FOR DELETE USING (auth.uid()::text = owner_id);

-- Diagrams: Based on project access + soft delete awareness
CREATE POLICY "diagrams_select" ON public.diagrams
  FOR SELECT USING (
    deleted_at IS NULL AND (
      auth.uid()::text = owner_id OR 
      EXISTS(
        SELECT 1 FROM public.projects p
        LEFT JOIN public.collaborators c ON c.project_id = p.id AND c.user_id = auth.uid()::text
        WHERE p.id = project_id AND (p.owner_id = auth.uid()::text OR c.user_id IS NOT NULL)
      )
    )
  );

CREATE POLICY "diagrams_insert" ON public.diagrams
  FOR INSERT WITH CHECK (
    auth.uid()::text = owner_id AND
    EXISTS(
      SELECT 1 FROM public.projects p
      LEFT JOIN public.collaborators c ON c.project_id = p.id AND c.user_id = auth.uid()::text
      WHERE p.id = project_id AND (p.owner_id = auth.uid()::text OR c.role IN ('OWNER', 'EDITOR'))
    )
  );

CREATE POLICY "diagrams_update" ON public.diagrams
  FOR UPDATE USING (
    deleted_at IS NULL AND (
      auth.uid()::text = owner_id OR 
      EXISTS(
        SELECT 1 FROM public.projects p
        LEFT JOIN public.collaborators c ON c.project_id = p.id AND c.user_id = auth.uid()::text
        WHERE p.id = project_id AND (p.owner_id = auth.uid()::text OR c.role IN ('OWNER', 'EDITOR'))
      )
    )
  );

CREATE POLICY "diagrams_delete" ON public.diagrams
  FOR DELETE USING (
    auth.uid()::text = owner_id OR 
    EXISTS(
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.owner_id = auth.uid()::text
    )
  );

-- Diagram Versions: Read access based on diagram access
CREATE POLICY "diagram_versions_select" ON public.diagram_versions
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM public.diagrams d
      WHERE d.id = diagram_id AND d.deleted_at IS NULL AND (
        auth.uid()::text = d.owner_id OR 
        EXISTS(
          SELECT 1 FROM public.projects p
          LEFT JOIN public.collaborators c ON c.project_id = p.id AND c.user_id = auth.uid()::text
          WHERE p.id = d.project_id AND (p.owner_id = auth.uid()::text OR c.user_id IS NOT NULL)
        )
      )
    )
  );

CREATE POLICY "diagram_versions_insert" ON public.diagram_versions
  FOR INSERT WITH CHECK (auth.uid()::text = author_id);

-- Collaborators: Project owners can manage, collaborators can read
CREATE POLICY "collaborators_select" ON public.collaborators
  FOR SELECT USING (
    auth.uid()::text = user_id OR 
    EXISTS(
      SELECT 1 FROM public.projects p 
      WHERE p.id = project_id AND p.owner_id = auth.uid()::text
    )
  );

CREATE POLICY "collaborators_insert" ON public.collaborators
  FOR INSERT WITH CHECK (
    EXISTS(
      SELECT 1 FROM public.projects p 
      WHERE p.id = project_id AND p.owner_id = auth.uid()::text
    )
  );

CREATE POLICY "collaborators_update" ON public.collaborators
  FOR UPDATE USING (
    EXISTS(
      SELECT 1 FROM public.projects p 
      WHERE p.id = project_id AND p.owner_id = auth.uid()::text
    )
  );

CREATE POLICY "collaborators_delete" ON public.collaborators
  FOR DELETE USING (
    auth.uid()::text = user_id OR 
    EXISTS(
      SELECT 1 FROM public.projects p 
      WHERE p.id = project_id AND p.owner_id = auth.uid()::text
    )
  );