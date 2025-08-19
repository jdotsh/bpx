-- Enable Row Level Security for BPMN Studio Web SaaS
-- Release 1 Day 1: RLS Setup

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagrams ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagram_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can see their own profile + profiles in their projects
CREATE POLICY "Users can manage own profile" ON profiles
  FOR ALL USING (auth.uid()::text = id);

-- Subscriptions: Users can only see their own subscription
CREATE POLICY "Users can see own subscription" ON subscriptions
  FOR ALL USING (
    profile_id IN (
      SELECT id FROM profiles WHERE auth.uid()::text = id
    )
  );

-- Projects: Users can see own projects + projects they collaborate on
CREATE POLICY "Users can manage own projects" ON projects
  FOR ALL USING (
    profile_id IN (
      SELECT id FROM profiles WHERE auth.uid()::text = id
    ) OR
    id IN (
      SELECT project_id FROM collaborators 
      WHERE user_id IN (
        SELECT id FROM profiles WHERE auth.uid()::text = id
      )
    )
  );

-- Diagrams: Users can see own diagrams + public diagrams + collaborated diagrams
CREATE POLICY "Users can access allowed diagrams" ON diagrams
  FOR ALL USING (
    is_public = true OR
    profile_id IN (
      SELECT id FROM profiles WHERE auth.uid()::text = id
    ) OR
    project_id IN (
      SELECT project_id FROM collaborators 
      WHERE user_id IN (
        SELECT id FROM profiles WHERE auth.uid()::text = id
      )
    )
  );

-- Diagram versions: Follow diagram access rules
CREATE POLICY "Users can access diagram versions" ON diagram_versions
  FOR ALL USING (
    diagram_id IN (
      SELECT id FROM diagrams -- RLS will filter based on diagram access
    )
  );

-- Collaborators: Users can see collaborations they're part of
CREATE POLICY "Users can see relevant collaborations" ON collaborators
  FOR ALL USING (
    user_id IN (
      SELECT id FROM profiles WHERE auth.uid()::text = id
    ) OR
    project_id IN (
      SELECT id FROM projects WHERE profile_id IN (
        SELECT id FROM profiles WHERE auth.uid()::text = id
      )
    )
  );

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_auth_uid ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_diagrams_public ON diagrams(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_collaborators_user ON collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_project ON collaborators(project_id);