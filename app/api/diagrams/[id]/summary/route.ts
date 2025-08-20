// Diagram Summary API - Lightweight endpoint for dashboard
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/auth/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get diagram summary
    const { data: diagram, error } = await supabase
      .from('diagrams')
      .select(`
        id,
        name,
        description,
        updated_at,
        project_id,
        thumbnail_url,
        version,
        metadata
      `)
      .eq('id', params.id)
      .eq('profile_id', user.id)
      .single()
    
    if (error || !diagram) {
      return NextResponse.json({ error: 'Diagram not found' }, { status: 404 })
    }
    
    // Return summary data
    return NextResponse.json({
      id: diagram.id,
      name: diagram.name,
      description: diagram.description,
      updatedAt: diagram.updated_at,
      projectId: diagram.project_id,
      thumbnailUrl: diagram.thumbnail_url,
      version: diagram.version || 1,
      elementCount: diagram.metadata?.elementCount || 0
    })
    
  } catch (error) {
    console.error('Error fetching diagram summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch diagram summary' },
      { status: 500 }
    )
  }
}