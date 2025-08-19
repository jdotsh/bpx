import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { DiagramService } from '@/lib/services/diagram'
import { diagramIdSchema } from '@/lib/validations/diagram'
import { z } from 'zod'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = diagramIdSchema.parse(params)
    const xmlContent = await DiagramService.getDiagramXml(id, user.id)

    if (!xmlContent) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Diagram XML not found or access denied' },
        { status: 404 }
      )
    }

    // Get diagram title for filename
    const diagram = await DiagramService.getDiagramById(id, user.id)
    const filename = sanitizeFilename(diagram?.title || 'diagram')

    return new NextResponse(xmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}.bpmn"`,
        'Cache-Control': 'private, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'Content-Disposition'
      }
    })
  } catch (error) {
    console.error('GET /api/diagrams/[id]/xml error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation Error', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch diagram XML' },
      { status: 500 }
    )
  }
}

/**
 * Sanitize filename for safe downloads
 */
function sanitizeFilename(title: string): string {
  return title
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '_')     // Replace spaces with underscores
    .slice(0, 50)             // Limit length
    .toLowerCase()
}