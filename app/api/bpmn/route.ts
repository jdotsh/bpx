import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/auth/server'

// Core BPMN API Routes - Solid backend infrastructure
// Maintains exact frontend compatibility

/**
 * GET /api/bpmn - List all diagrams for user
 * GET /api/bpmn?id={id} - Get specific diagram
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const diagramId = searchParams.get('id')
    
    if (diagramId) {
      // Get specific diagram
      const { data, error } = await supabase
        .from('diagrams')
        .select('*')
        .eq('id', diagramId)
        .eq('profile_id', user.id)
        .single()
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      
      return NextResponse.json(data)
    } else {
      // List all diagrams for user
      const { data, error } = await supabase
        .from('diagrams')
        .select('*')
        .eq('profile_id', user.id)
        .order('updated_at', { ascending: false })
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      return NextResponse.json(data || [])
    }
  } catch (error) {
    console.error('GET /api/bpmn error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/bpmn - Create new diagram
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, bpmn_xml, project_id } = body
    
    if (!name || !bpmn_xml) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from('diagrams')
      .insert({
        name,
        bpmn_xml,
        project_id: project_id || null,
        profile_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('POST /api/bpmn error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/bpmn - Update existing diagram
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, bpmn_xml } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Missing diagram ID' }, { status: 400 })
    }
    
    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    if (name !== undefined) updateData.name = name
    if (bpmn_xml !== undefined) updateData.bpmn_xml = bpmn_xml
    
    const { data, error } = await supabase
      .from('diagrams')
      .update(updateData)
      .eq('id', id)
      .eq('profile_id', user.id)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Diagram not found' }, { status: 404 })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('PUT /api/bpmn error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/bpmn?id={id} - Delete diagram
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const diagramId = searchParams.get('id')
    
    if (!diagramId) {
      return NextResponse.json({ error: 'Missing diagram ID' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('diagrams')
      .delete()
      .eq('id', diagramId)
      .eq('profile_id', user.id)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/bpmn error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}