-- Create diagrams table for BPMN diagrams
CREATE TABLE IF NOT EXISTS public.diagrams (
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_diagrams_profile ON public.diagrams(profile_id);
CREATE INDEX IF NOT EXISTS idx_diagrams_project ON public.diagrams(project_id);
CREATE INDEX IF NOT EXISTS idx_diagrams_updated ON public.diagrams(updated_at DESC);

-- Enable RLS
ALTER TABLE public.diagrams ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own diagrams" ON public.diagrams
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can create own diagrams" ON public.diagrams
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own diagrams" ON public.diagrams
  FOR UPDATE USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can delete own diagrams" ON public.diagrams
  FOR DELETE USING (auth.uid() = profile_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_diagrams_updated_at
  BEFORE UPDATE ON public.diagrams
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();