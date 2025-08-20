import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth/server'
import { DiagramService } from '@/lib/services/diagram'
import { createDiagramSchema } from '@/lib/validations/diagram'
import { z } from 'zod'

// Force dynamic rendering for API routes that use authentication
export const dynamic = 'force-dynamic'

const listQuerySchema = z.object({
  projectId: z.string().cuid().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20)
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = listQuerySchema.parse(Object.fromEntries(searchParams))

    const diagrams = await DiagramService.listDiagrams(
      user.id,
      query.projectId
    )

    return NextResponse.json({
      data: diagrams,
      pagination: {
        page: query.page,
        limit: query.limit,
        hasMore: diagrams.length === query.limit
      }
    })
  } catch (error) {
    console.error('GET /api/diagrams error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation Error', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch diagrams' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const data = createDiagramSchema.parse(body)

    const diagram = await DiagramService.createDiagram(user.id, data)
    if (!diagram) {
      return NextResponse.json(
        { error: 'Creation Failed', message: 'Failed to create diagram or project not found' },
        { status: 400 }
      )
    }

    return NextResponse.json(diagram, { status: 201 })
  } catch (error) {
    console.error('POST /api/diagrams error:', error)
    
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
      { error: 'Internal Server Error', message: 'Failed to create diagram' },
      { status: 500 }
    )
  }
}

