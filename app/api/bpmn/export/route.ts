import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/auth/server'

/**
 * Export BPMN diagram in different formats
 * GET /api/bpmn/export?id={id}&format={xml|svg|png|pdf}
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
    const format = searchParams.get('format') || 'xml'
    
    if (!diagramId) {
      return NextResponse.json({ error: 'Missing diagram ID' }, { status: 400 })
    }
    
    // Get diagram
    const { data: diagram, error } = await supabase
      .from('diagrams')
      .select('*')
      .eq('id', diagramId)
      .eq('profile_id', user.id)
      .single()
    
    if (error || !diagram) {
      return NextResponse.json({ error: 'Diagram not found' }, { status: 404 })
    }
    
    // Handle different export formats
    switch (format) {
      case 'xml':
        return new NextResponse(diagram.bpmn_xml, {
          headers: {
            'Content-Type': 'application/xml',
            'Content-Disposition': `attachment; filename="${diagram.name}.bpmn"`
          }
        })
      
      case 'json':
        // Convert XML to JSON representation
        return NextResponse.json({
          id: diagram.id,
          name: diagram.name,
          xml: diagram.bpmn_xml,
          metadata: {
            created_at: diagram.created_at,
            updated_at: diagram.updated_at,
            project_id: diagram.project_id
          }
        })
      
      case 'svg':
        // TODO: Implement SVG generation from BPMN XML
        return NextResponse.json({ 
          error: 'SVG export coming soon',
          xml: diagram.bpmn_xml 
        }, { status: 501 })
      
      default:
        return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
    }
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}