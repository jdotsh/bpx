import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth/server'
import { DiagramService } from '@/lib/services/diagram'
import { updateDiagramSchema, diagramIdSchema, saveDiagramSchema } from '@/lib/validations/diagram'
import { z } from 'zod'

// Force dynamic rendering for API routes that use authentication
export const dynamic = 'force-dynamic'

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
    const diagram = await DiagramService.getDiagram(user.id, id)

    if (!diagram) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Diagram not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json(diagram)
  } catch (error) {
    console.error('GET /api/diagrams/[id] error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation Error', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch diagram' },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    const body = await request.json()
    
    // Check if this is a save operation (has bpmnXml) or regular update
    const isSaveOperation = 'bpmnXml' in body && body.bpmnXml
    
    let diagram
    if (isSaveOperation) {
      const data = saveDiagramSchema.parse(body)
      diagram = await DiagramService.saveDiagram(user.id, id, data)
    } else {
      const data = updateDiagramSchema.parse(body)
      diagram = await DiagramService.updateDiagram(user.id, id, data)
    }

    if (!diagram) {
      return NextResponse.json(
        { error: 'Update Failed', message: 'Diagram not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json(diagram)
  } catch (error) {
    console.error('PUT /api/diagrams/[id] error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation Error', details: error.issues },
        { status: 400 }
      )
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON', message: 'Request body must be valid JSON' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to update diagram' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    const success = await DiagramService.deleteDiagram(user.id, id)

    if (!success) {
      return NextResponse.json(
        { error: 'Delete Failed', message: 'Diagram not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Diagram deleted successfully'
    })
  } catch (error) {
    console.error('DELETE /api/diagrams/[id] error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation Error', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to delete diagram' },
      { status: 500 }
    )
  }
}

