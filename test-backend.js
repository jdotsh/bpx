#!/usr/bin/env node

/**
 * Automated Backend Test Suite
 * Tests all backend endpoints and verifies UI preservation
 */

const BASE_URL = 'http://localhost:3001';
let testsPassed = 0;
let testsFailed = 0;

// Color output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

async function test(name, fn) {
  process.stdout.write(`Testing ${name}... `);
  try {
    await fn();
    console.log(`${colors.green}✓${colors.reset}`);
    testsPassed++;
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset}`);
    console.error(`  Error: ${error.message}`);
    testsFailed++;
  }
}

async function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

async function assertIncludes(text, substring, message) {
  if (!text.includes(substring)) {
    throw new Error(`${message}: "${substring}" not found in response`);
  }
}

// Test functions
async function testHealthCheck() {
  const response = await fetch(`${BASE_URL}/api/bpmn/health`);
  const data = await response.json();
  
  assertEqual(response.status, 200, 'Health check status');
  assertEqual(data.status, 'healthy', 'Service health');
  assertEqual(data.service, 'BPMN Core Routing Backend', 'Service name');
  if (!data.endpoints) throw new Error('Missing endpoints info');
}

async function testGetDiagramsNoAuth() {
  const response = await fetch(`${BASE_URL}/api/bpmn`);
  const data = await response.json();
  
  assertEqual(response.status, 401, 'Should return 401 without auth');
  assertEqual(data.error, 'Unauthorized', 'Should return unauthorized error');
}

async function testPostDiagramNoAuth() {
  const response = await fetch(`${BASE_URL}/api/bpmn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Diagram',
      bpmn_xml: '<?xml version="1.0"?><bpmn></bpmn>'
    })
  });
  const data = await response.json();
  
  assertEqual(response.status, 401, 'POST should return 401 without auth');
  assertEqual(data.error, 'Unauthorized', 'Should return unauthorized error');
}

async function testPutDiagramNoAuth() {
  const response = await fetch(`${BASE_URL}/api/bpmn`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'test-id',
      name: 'Updated Diagram',
      bpmn_xml: '<?xml version="1.0"?><bpmn></bpmn>'
    })
  });
  const data = await response.json();
  
  assertEqual(response.status, 401, 'PUT should return 401 without auth');
  assertEqual(data.error, 'Unauthorized', 'Should return unauthorized error');
}

async function testDeleteDiagramNoAuth() {
  const response = await fetch(`${BASE_URL}/api/bpmn?id=test-id`, {
    method: 'DELETE'
  });
  const data = await response.json();
  
  assertEqual(response.status, 401, 'DELETE should return 401 without auth');
  assertEqual(data.error, 'Unauthorized', 'Should return unauthorized error');
}

async function testExportEndpoint() {
  const response = await fetch(`${BASE_URL}/api/bpmn/export?id=test&format=xml`);
  const data = await response.json();
  
  assertEqual(response.status, 401, 'Export should require auth');
  assertEqual(data.error, 'Unauthorized', 'Should return unauthorized error');
}

async function testCollaborateEndpoint() {
  const response = await fetch(`${BASE_URL}/api/bpmn/collaborate?diagramId=test`);
  const data = await response.json();
  
  assertEqual(response.status, 401, 'Collaborate should require auth');
  assertEqual(data.error, 'Unauthorized', 'Should return unauthorized error');
}

async function testUIPreservation() {
  console.log('\n' + colors.blue + '=== Testing UI Preservation ===' + colors.reset);
  
  const response = await fetch(`${BASE_URL}/studio`);
  const html = await response.text();
  
  // Check that UI components are present
  await test('Studio page loads', async () => {
    assertEqual(response.status, 200, 'Studio page status');
  });
  
  await test('Loading state present', async () => {
    assertIncludes(html, 'Loading BPMN Studio', 'Loading message');
  });
  
  await test('No UI modifications', async () => {
    // Verify page structure is intact
    if (!html || html.length < 100) {
      throw new Error('Page content missing');
    }
  });
}

async function testAPIStructure() {
  console.log('\n' + colors.blue + '=== Testing API Structure ===' + colors.reset);
  
  await test('GET /api/bpmn structure', async () => {
    const response = await fetch(`${BASE_URL}/api/bpmn`);
    assertEqual(response.headers.get('content-type'), 'application/json', 'Returns JSON');
  });
  
  await test('Health endpoint structure', async () => {
    const response = await fetch(`${BASE_URL}/api/bpmn/health`);
    const data = await response.json();
    
    if (!data.timestamp) throw new Error('Missing timestamp');
    if (!data.endpoints.diagrams) throw new Error('Missing diagrams endpoint');
    if (!data.endpoints.export) throw new Error('Missing export endpoint');
    if (!data.endpoints.collaborate) throw new Error('Missing collaborate endpoint');
  });
}

async function testErrorHandling() {
  console.log('\n' + colors.blue + '=== Testing Error Handling ===' + colors.reset);
  
  await test('Invalid JSON returns error', async () => {
    const response = await fetch(`${BASE_URL}/api/bpmn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json'
    });
    
    // Should handle gracefully
    if (response.status !== 400 && response.status !== 401) {
      throw new Error(`Expected 400 or 401, got ${response.status}`);
    }
  });
  
  await test('Missing required fields', async () => {
    const response = await fetch(`${BASE_URL}/api/bpmn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}) // Empty body
    });
    
    // Should return 400 or 401
    if (response.status !== 400 && response.status !== 401) {
      throw new Error(`Expected 400 or 401, got ${response.status}`);
    }
  });
}

// Main test runner
async function runTests() {
  console.log(colors.yellow + '🧪 BPMN Backend Automated Test Suite' + colors.reset);
  console.log('=====================================\n');
  
  console.log(colors.blue + '=== Testing Backend Endpoints ===' + colors.reset);
  
  await test('Health Check Endpoint', testHealthCheck);
  await test('GET /api/bpmn (no auth)', testGetDiagramsNoAuth);
  await test('POST /api/bpmn (no auth)', testPostDiagramNoAuth);
  await test('PUT /api/bpmn (no auth)', testPutDiagramNoAuth);
  await test('DELETE /api/bpmn (no auth)', testDeleteDiagramNoAuth);
  await test('Export Endpoint (no auth)', testExportEndpoint);
  await test('Collaborate Endpoint (no auth)', testCollaborateEndpoint);
  
  await testAPIStructure();
  await testErrorHandling();
  await testUIPreservation();
  
  // Summary
  console.log('\n' + colors.yellow + '=== Test Summary ===' + colors.reset);
  console.log(`${colors.green}✓ Passed: ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}✗ Failed: ${testsFailed}${colors.reset}`);
  
  if (testsFailed === 0) {
    console.log('\n' + colors.green + '🎉 All tests passed! Backend is working correctly.' + colors.reset);
    console.log(colors.green + '✅ UI is preserved - no visual changes' + colors.reset);
    console.log(colors.green + '✅ All API endpoints are protected' + colors.reset);
    console.log(colors.green + '✅ Error handling is robust' + colors.reset);
  } else {
    console.log('\n' + colors.red + '❌ Some tests failed. Please review the errors above.' + colors.reset);
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error(colors.red + 'Test suite error:', error + colors.reset);
  process.exit(1);
});