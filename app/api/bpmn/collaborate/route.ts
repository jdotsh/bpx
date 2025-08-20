import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/auth/server'

// Collaboration session storage (in production, use Redis/database)
const collaborationSessions = new Map<string, {
  diagramId: string
  participants: Set<string>
  lastActivity: Date
}>()

/**
 * Real-time collaboration endpoints
 * GET /api/bpmn/collaborate?diagramId={id} - Join collaboration session
 * POST /api/bpmn/collaborate - Broadcast changes
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const diagramId = searchParams.get('diagramId')
    
    if (!diagramId) {
      return NextResponse.json({ error: 'Missing diagram ID' }, { status: 400 })
    }
    
    // Get or create collaboration session
    let session = collaborationSessions.get(diagramId)
    if (!session) {
      session = {
        diagramId,
        participants: new Set(),
        lastActivity: new Date()
      }
      collaborationSessions.set(diagramId, session)
    }
    
    // Add user to session
    session.participants.add(user.id)
    session.lastActivity = new Date()
    
    return NextResponse.json({
      sessionId: diagramId,
      participants: Array.from(session.participants),
      status: 'connected'
    })
  } catch (error) {
    console.error('Collaboration error:', error)
    return NextResponse.json({ error: 'Failed to join session' }, { status: 500 })
  }
}

/**
 * Broadcast changes to collaboration session
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { diagramId, changes, type } = body
    
    if (!diagramId || !changes) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    const session = collaborationSessions.get(diagramId)
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    
    // Update activity
    session.lastActivity = new Date()
    
    // In production, broadcast to WebSocket connections
    // For now, just log the change
    console.log('Collaboration change:', {
      diagramId,
      userId: user.id,
      type,
      timestamp: new Date()
    })
    
    return NextResponse.json({
      success: true,
      participants: Array.from(session.participants)
    })
  } catch (error) {
    console.error('Broadcast error:', error)
    return NextResponse.json({ error: 'Failed to broadcast' }, { status: 500 })
  }
}

// Clean up old sessions periodically
setInterval(() => {
  const now = new Date()
  const timeout = 30 * 60 * 1000 // 30 minutes
  
  // Convert to array to avoid iteration issues
  Array.from(collaborationSessions.entries()).forEach(([id, session]) => {
    if (now.getTime() - session.lastActivity.getTime() > timeout) {
      collaborationSessions.delete(id)
    }
  })
}, 5 * 60 * 1000) // Check every 5 minutes