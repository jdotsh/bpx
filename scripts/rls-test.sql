-- RLS Cross-Tenant Access Tests
-- R2: Production Tightening

-- Test Setup: Create test users and data
-- Run as superuser/service_role

-- 1. Create test users (simulate different auth.uid() values)
BEGIN;

-- Simulate User A creates project and diagram
SET LOCAL "request.jwt.claims" TO '{"sub": "user-a-uuid", "role": "authenticated"}';

INSERT INTO public.profiles (id, email, name) VALUES 
  ('user-a-uuid', 'user-a@test.com', 'User A')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, name, description, owner_id) VALUES 
  ('project-a', 'Project A', 'Test project for User A', 'user-a-uuid')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.diagrams (id, title, bpmn_xml, project_id, owner_id) VALUES 
  ('diagram-a', 'Diagram A', '<bpmn:definitions>...</bpmn:definitions>', 'project-a', 'user-a-uuid')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- 2. Switch to User B and try to access User A's data
BEGIN;

SET LOCAL "request.jwt.claims" TO '{"sub": "user-b-uuid", "role": "authenticated"}';

INSERT INTO public.profiles (id, email, name) VALUES 
  ('user-b-uuid', 'user-b@test.com', 'User B')
ON CONFLICT (id) DO NOTHING;

-- TEST 1: User B should NOT see User A's projects
SELECT 'TEST 1: Cross-tenant project access' as test_name,
       CASE 
         WHEN COUNT(*) = 0 THEN 'PASS - No access to other user projects' 
         ELSE 'FAIL - Can see other user projects' 
       END as result
FROM public.projects 
WHERE id = 'project-a';

-- TEST 2: User B should NOT see User A's diagrams  
SELECT 'TEST 2: Cross-tenant diagram access' as test_name,
       CASE 
         WHEN COUNT(*) = 0 THEN 'PASS - No access to other user diagrams' 
         ELSE 'FAIL - Can see other user diagrams' 
       END as result
FROM public.diagrams 
WHERE id = 'diagram-a';

-- TEST 3: User B should NOT be able to update User A's project
UPDATE public.projects 
SET name = 'Hacked by User B' 
WHERE id = 'project-a';

SELECT 'TEST 3: Cross-tenant project update' as test_name,
       CASE 
         WHEN (SELECT name FROM public.projects WHERE id = 'project-a') = 'Project A' 
         THEN 'PASS - Cannot update other user projects' 
         ELSE 'FAIL - Can update other user projects' 
       END as result;

COMMIT;

-- 3. Test collaboration access
BEGIN;

-- User A adds User B as collaborator
SET LOCAL "request.jwt.claims" TO '{"sub": "user-a-uuid", "role": "authenticated"}';

INSERT INTO public.collaborators (project_id, user_id, role, invited_by) VALUES 
  ('project-a', 'user-b-uuid', 'EDITOR', 'user-a-uuid')
ON CONFLICT (project_id, user_id) DO NOTHING;

COMMIT;

-- 4. Test User B can now access as collaborator
BEGIN;

SET LOCAL "request.jwt.claims" TO '{"sub": "user-b-uuid", "role": "authenticated"}';

-- TEST 4: User B should now see User A's project (as collaborator)
SELECT 'TEST 4: Collaborator project access' as test_name,
       CASE 
         WHEN COUNT(*) = 1 THEN 'PASS - Can access as collaborator' 
         ELSE 'FAIL - Cannot access as collaborator' 
       END as result
FROM public.projects 
WHERE id = 'project-a';

-- TEST 5: User B should now see User A's diagrams (as collaborator)
SELECT 'TEST 5: Collaborator diagram access' as test_name,
       CASE 
         WHEN COUNT(*) = 1 THEN 'PASS - Can access diagrams as collaborator' 
         ELSE 'FAIL - Cannot access diagrams as collaborator' 
       END as result
FROM public.diagrams 
WHERE id = 'diagram-a';

-- TEST 6: User B (EDITOR) should be able to update diagrams
UPDATE public.diagrams 
SET title = 'Updated by Collaborator' 
WHERE id = 'diagram-a';

SELECT 'TEST 6: Collaborator diagram update' as test_name,
       CASE 
         WHEN (SELECT title FROM public.diagrams WHERE id = 'diagram-a') = 'Updated by Collaborator' 
         THEN 'PASS - Can update as EDITOR collaborator' 
         ELSE 'FAIL - Cannot update as EDITOR collaborator' 
       END as result;

-- TEST 7: User B should NOT be able to delete project (only OWNER can)
DELETE FROM public.projects WHERE id = 'project-a';

SELECT 'TEST 7: Collaborator project delete restriction' as test_name,
       CASE 
         WHEN EXISTS(SELECT 1 FROM public.projects WHERE id = 'project-a') 
         THEN 'PASS - Cannot delete project as collaborator' 
         ELSE 'FAIL - Can delete project as collaborator' 
       END as result;

COMMIT;

-- 5. Cleanup (run as superuser)
BEGIN;

-- Remove test data
DELETE FROM public.diagram_versions WHERE diagram_id = 'diagram-a';
DELETE FROM public.diagrams WHERE id = 'diagram-a';
DELETE FROM public.collaborators WHERE project_id = 'project-a';
DELETE FROM public.projects WHERE id = 'project-a';
DELETE FROM public.profiles WHERE id IN ('user-a-uuid', 'user-b-uuid');

COMMIT;

-- Summary
SELECT '=== RLS TEST SUMMARY ===' as summary;
SELECT 'All tests should show PASS for proper RLS isolation' as note;