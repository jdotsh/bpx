-- Seed test data for BPMN Studio Web SaaS
-- Release 1 Day 1: Test Data

-- Insert test user profile (using a test UUID)
INSERT INTO profiles (id, email, name, avatar_url, created_at, updated_at) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'test@bpmn-studio.com',
  'Test User',
  'https://avatar.placeholder.com/150',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  updated_at = NOW();

-- Insert test subscription
INSERT INTO subscriptions (
  id,
  profile_id,
  stripe_customer_id,
  stripe_subscription_id,
  plan,
  status,
  current_period_end,
  created_at,
  updated_at
) VALUES (
  'test_sub_123',
  '550e8400-e29b-41d4-a716-446655440000',
  'cus_test123',
  'sub_test123',
  'PRO',
  'ACTIVE',
  NOW() + INTERVAL '30 days',
  NOW(),
  NOW()
) ON CONFLICT (profile_id) DO UPDATE SET
  plan = EXCLUDED.plan,
  status = EXCLUDED.status,
  current_period_end = EXCLUDED.current_period_end,
  updated_at = NOW();

-- Insert test project
INSERT INTO projects (id, name, description, profile_id, created_at, updated_at)
VALUES (
  'test_project_123',
  'Test Project',
  'A sample project for UAT testing',
  '550e8400-e29b-41d4-a716-446655440000',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Insert test diagrams
INSERT INTO diagrams (
  id,
  title,
  bpmn_xml,
  thumbnail,
  metadata,
  project_id,
  profile_id,
  version,
  is_public,
  created_at,
  updated_at
) VALUES 
(
  'test_diagram_001',
  'Simple Process',
  '<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1"/>
    <bpmn:task id="Task_1" name="Process Data"/>
    <bpmn:endEvent id="EndEvent_1"/>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1"/>
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="EndEvent_1"/>
  </bpmn:process>
</bpmn:definitions>',
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCI+PC9zdmc+',
  '{"elementCount": 3, "lastModified": "2024-01-01"}',
  'test_project_123',
  '550e8400-e29b-41d4-a716-446655440000',
  1,
  false,
  NOW(),
  NOW()
),
(
  'test_diagram_002',
  'Complex Workflow',
  '<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" id="Definitions_2" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_2" isExecutable="true">
    <bpmn:startEvent id="StartEvent_2"/>
    <bpmn:exclusiveGateway id="Gateway_1"/>
    <bpmn:task id="Task_2a" name="Option A"/>
    <bpmn:task id="Task_2b" name="Option B"/>
    <bpmn:endEvent id="EndEvent_2"/>
    <bpmn:sequenceFlow id="Flow_3" sourceRef="StartEvent_2" targetRef="Gateway_1"/>
    <bpmn:sequenceFlow id="Flow_4" sourceRef="Gateway_1" targetRef="Task_2a"/>
    <bpmn:sequenceFlow id="Flow_5" sourceRef="Gateway_1" targetRef="Task_2b"/>
    <bpmn:sequenceFlow id="Flow_6" sourceRef="Task_2a" targetRef="EndEvent_2"/>
    <bpmn:sequenceFlow id="Flow_7" sourceRef="Task_2b" targetRef="EndEvent_2"/>
  </bpmn:process>
</bpmn:definitions>',
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjE1MCI+PC9zdmc+',
  '{"elementCount": 7, "lastModified": "2024-01-02"}',
  'test_project_123',
  '550e8400-e29b-41d4-a716-446655440000',
  1,
  true,
  NOW(),
  NOW()
),
(
  'test_diagram_003',
  'Public Demo Process',
  '<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Definitions_3" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_3" isExecutable="true">
    <bpmn:startEvent id="StartEvent_3"/>
    <bpmn:userTask id="UserTask_1" name="Review Document"/>
    <bpmn:serviceTask id="ServiceTask_1" name="Send Notification"/>
    <bpmn:endEvent id="EndEvent_3"/>
    <bpmn:sequenceFlow id="Flow_8" sourceRef="StartEvent_3" targetRef="UserTask_1"/>
    <bpmn:sequenceFlow id="Flow_9" sourceRef="UserTask_1" targetRef="ServiceTask_1"/>
    <bpmn:sequenceFlow id="Flow_10" sourceRef="ServiceTask_1" targetRef="EndEvent_3"/>
  </bpmn:process>
</bpmn:definitions>',
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUwIiBoZWlnaHQ9IjEyMCI+PC9zdmc+',
  '{"elementCount": 4, "lastModified": "2024-01-03"}',
  NULL,
  '550e8400-e29b-41d4-a716-446655440000',
  2,
  true,
  NOW() - INTERVAL '1 day',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Insert version history
INSERT INTO diagram_versions (
  id,
  diagram_id,
  version,
  bpmn_xml,
  metadata,
  author_id,
  message,
  created_at
) VALUES
(
  'version_001_v1',
  'test_diagram_001',
  1,
  '<?xml version="1.0" encoding="UTF-8"?><bpmn:definitions>Initial version</bpmn:definitions>',
  '{"elementCount": 3}',
  '550e8400-e29b-41d4-a716-446655440000',
  'Initial creation',
  NOW() - INTERVAL '2 hours'
),
(
  'version_003_v1',
  'test_diagram_003',
  1,
  '<?xml version="1.0" encoding="UTF-8"?><bpmn:definitions>First version</bpmn:definitions>',
  '{"elementCount": 3}',
  '550e8400-e29b-41d4-a716-446655440000',
  'Initial creation',
  NOW() - INTERVAL '1 day'
),
(
  'version_003_v2',
  'test_diagram_003',
  2,
  '<?xml version="1.0" encoding="UTF-8"?><bpmn:definitions>Updated version</bpmn:definitions>',
  '{"elementCount": 4}',
  '550e8400-e29b-41d4-a716-446655440000',
  'Added service task',
  NOW() - INTERVAL '2 hours'
) ON CONFLICT (diagram_id, version) DO NOTHING;

-- Insert test collaborator
INSERT INTO collaborators (id, project_id, user_id, role, created_at)
VALUES (
  'collab_001',
  'test_project_123',
  '550e8400-e29b-41d4-a716-446655440000',
  'OWNER',
  NOW()
) ON CONFLICT (project_id, user_id) DO UPDATE SET
  role = EXCLUDED.role;