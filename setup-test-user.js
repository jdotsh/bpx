#!/usr/bin/env node

/**
 * Setup Test User Script
 * Creates a test user in Supabase for authentication
 */

const { createClient } = require('@supabase/supabase-js');

// Load Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables!');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  console.log('🔧 Setting up test user...\n');

  // Test user credentials
  const email = 'test@example.com';
  const password = 'password123';

  try {
    // First, try to sign up the user
    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        full_name: 'Test User',
        role: 'user'
      }
    });

    if (signUpError) {
      // If user already exists, that's okay
      if (signUpError.message.includes('already exists')) {
        console.log('ℹ️  User already exists, updating password...');
        
        // Update the existing user's password
        const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
          signUpData?.id || '', 
          { password: password }
        );

        if (updateError && !updateError.message.includes('not found')) {
          console.error('Error updating user:', updateError.message);
        }
      } else {
        console.error('Error creating user:', signUpError.message);
      }
    } else {
      console.log('✅ Test user created successfully!');
      console.log('   User ID:', signUpData.user.id);
    }

    // Verify the user can sign in
    console.log('\n🔐 Verifying login...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (signInError) {
      console.error('❌ Login verification failed:', signInError.message);
      console.log('\n🔄 Alternative: Use Demo Mode');
      console.log('   Click "Continue without signing in (Demo Mode)" on the sign-in page');
    } else {
      console.log('✅ Login verification successful!');
      console.log('\n📝 Test User Credentials:');
      console.log('   Email: test@example.com');
      console.log('   Password: password123');
      console.log('\n🚀 You can now login at http://localhost:3002/signin');
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }

  // Create a demo project and diagram for the user
  try {
    console.log('\n📊 Setting up demo data...');
    
    // Get the user first
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    const testUser = users?.find(u => u.email === email);
    
    if (testUser) {
      // Create a demo project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: testUser.id,
          name: 'Demo Project',
          description: 'Sample BPMN project for testing'
        })
        .select()
        .single();

      if (!projectError && project) {
        // Create a demo diagram
        const { data: diagram, error: diagramError } = await supabase
          .from('diagrams')
          .insert({
            project_id: project.id,
            user_id: testUser.id,
            name: 'Sample Process',
            bpmn_xml: `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" name="Start">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_1" name="Sample Task">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_1" name="End">
      <bpmn:incoming>Flow_2</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="173" y="102" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1">
        <dc:Bounds x="260" y="80" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="412" y="102" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="209" y="120" />
        <di:waypoint x="260" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="360" y="120" />
        <di:waypoint x="412" y="120" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`
          })
          .select()
          .single();

        if (!diagramError) {
          console.log('✅ Demo project and diagram created');
        }
      }
    }
  } catch (error) {
    // Demo data is optional, so we don't fail if it doesn't work
    console.log('ℹ️  Demo data setup skipped');
  }

  console.log('\n✨ Setup complete!');
  console.log('\n🎯 Next Steps:');
  console.log('1. Go to http://localhost:3002');
  console.log('2. Click "Sign In"');
  console.log('3. Use credentials: test@example.com / password123');
  console.log('4. Or click "Continue without signing in (Demo Mode)"');
}

createTestUser().catch(console.error);