-- Database Architecture Review and Optimization
-- Query optimization, indexing strategy, and data integrity

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Diagrams table indexes
CREATE INDEX IF NOT EXISTS idx_diagrams_owner_updated 
  ON diagrams(owner_id, updated_at DESC) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_diagrams_project_updated 
  ON diagrams(project_id, updated_at DESC) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_diagrams_public 
  ON diagrams(is_public, updated_at DESC) 
  WHERE deleted_at IS NULL AND is_public = true;

-- Projects table indexes
CREATE INDEX IF NOT EXISTS idx_projects_owner_updated 
  ON projects(owner_id, updated_at DESC) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_projects_name_search 
  ON projects USING gin(name gin_trgm_ops);

-- Diagram versions table indexes
CREATE INDEX IF NOT EXISTS idx_versions_diagram_rev 
  ON diagram_versions(diagram_id, rev_number DESC);

-- Collaborators table indexes
CREATE INDEX IF NOT EXISTS idx_collaborators_user 
  ON collaborators(user_id, role);

CREATE INDEX IF NOT EXISTS idx_collaborators_project 
  ON collaborators(project_id, role);

-- Subscriptions table indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_status 
  ON subscriptions(status, plan) 
  WHERE status IN ('ACTIVE', 'PAST_DUE');

-- =====================================================
-- QUERY OPTIMIZATION VIEWS
-- =====================================================

-- Recent diagrams view for dashboard
CREATE OR REPLACE VIEW v_recent_diagrams AS
SELECT 
  d.id,
  d.title,
  d.thumbnail_url,
  d.updated_at,
  d.owner_id,
  p.name as project_name,
  p.id as project_id
FROM diagrams d
INNER JOIN projects p ON d.project_id = p.id
WHERE d.deleted_at IS NULL 
  AND p.deleted_at IS NULL
ORDER BY d.updated_at DESC;

-- User activity summary
CREATE OR REPLACE VIEW v_user_activity AS
SELECT 
  u.id as user_id,
  u.email,
  COUNT(DISTINCT p.id) as project_count,
  COUNT(DISTINCT d.id) as diagram_count,
  MAX(d.updated_at) as last_activity,
  s.plan as subscription_plan,
  s.status as subscription_status
FROM profiles u
LEFT JOIN projects p ON u.id = p.owner_id AND p.deleted_at IS NULL
LEFT JOIN diagrams d ON u.id = d.owner_id AND d.deleted_at IS NULL
LEFT JOIN subscriptions s ON u.id = s.profile_id
GROUP BY u.id, u.email, s.plan, s.status;

-- =====================================================
-- PARTITIONING FOR LARGE TABLES
-- =====================================================

-- Partition diagram_versions by year for better performance
-- (Run only if table becomes very large)
/*
CREATE TABLE diagram_versions_2024 PARTITION OF diagram_versions
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE diagram_versions_2025 PARTITION OF diagram_versions
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
*/

-- =====================================================
-- DATA INTEGRITY CONSTRAINTS
-- =====================================================

-- Ensure version numbers are sequential
ALTER TABLE diagram_versions 
  ADD CONSTRAINT check_rev_number_positive 
  CHECK (rev_number > 0);

-- Ensure proper date ordering
ALTER TABLE projects 
  ADD CONSTRAINT check_dates_order 
  CHECK (created_at <= updated_at);

ALTER TABLE diagrams 
  ADD CONSTRAINT check_dates_order 
  CHECK (created_at <= updated_at);

-- Ensure valid subscription states
ALTER TABLE subscriptions 
  ADD CONSTRAINT check_valid_transition 
  CHECK (
    (status = 'CANCELED' AND plan = 'FREE') OR
    (status != 'CANCELED')
  );

-- =====================================================
-- PERFORMANCE FUNCTIONS
-- =====================================================

-- Function to clean up old soft-deleted records
CREATE OR REPLACE FUNCTION cleanup_soft_deleted()
RETURNS void AS $$
BEGIN
  -- Delete records soft-deleted more than 90 days ago
  DELETE FROM diagrams 
  WHERE deleted_at IS NOT NULL 
    AND deleted_at < NOW() - INTERVAL '90 days';
  
  DELETE FROM projects 
  WHERE deleted_at IS NOT NULL 
    AND deleted_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Function to archive old diagram versions
CREATE OR REPLACE FUNCTION archive_old_versions()
RETURNS void AS $$
BEGIN
  -- Keep only last 10 versions per diagram
  DELETE FROM diagram_versions v1
  WHERE v1.rev_number < (
    SELECT MAX(v2.rev_number) - 10
    FROM diagram_versions v2
    WHERE v2.diagram_id = v1.diagram_id
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MAINTENANCE PROCEDURES
-- =====================================================

-- Update table statistics for query planner
ANALYZE diagrams;
ANALYZE projects;
ANALYZE diagram_versions;
ANALYZE collaborators;
ANALYZE subscriptions;
ANALYZE profiles;

-- Vacuum to reclaim space
VACUUM (ANALYZE) diagrams;
VACUUM (ANALYZE) projects;
VACUUM (ANALYZE) diagram_versions;

-- =====================================================
-- MONITORING QUERIES
-- =====================================================

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Check slow queries
SELECT 
  query,
  calls,
  mean_exec_time,
  total_exec_time,
  rows
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 20;