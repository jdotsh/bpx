import { NextResponse } from 'next/server'

/**
 * Health check endpoint for BPMN API
 * GET /api/bpmn/health
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'BPMN Core Routing Backend',
    timestamp: new Date().toISOString(),
    endpoints: {
      diagrams: '/api/bpmn',
      export: '/api/bpmn/export',
      collaborate: '/api/bpmn/collaborate'
    }
  })
}