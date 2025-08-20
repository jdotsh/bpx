import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { ProjectService } from '@/lib/services/project'
import { ProfileService } from '@/lib/services/profile'
import { createProjectSchema } from '@/lib/validations/project'
import { z } from 'zod'

// Force dynamic rendering for API routes that use authentication
export const dynamic = 'force-dynamic'

const listQuerySchema = z.object({
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

    const projects = await ProjectService.listProjects(user.id)

    return NextResponse.json({
      data: projects,
      pagination: {
        page: query.page,
        limit: query.limit,
        hasMore: projects.length === query.limit
      }
    })
  } catch (error) {
    console.error('GET /api/projects error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation Error', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch projects' },
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

    // Ensure user profile exists
    const profile = await ProfileService.getOrCreateProfile(user.id)
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile Error', message: 'Failed to get or create user profile' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const data = createProjectSchema.parse(body)

    const project = await ProjectService.createProject(user.id, data)
    if (!project) {
      return NextResponse.json(
        { error: 'Creation Failed', message: 'Failed to create project' },
        { status: 500 }
      )
    }

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('POST /api/projects error:', error)
    
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
      { error: 'Internal Server Error', message: 'Failed to create project' },
      { status: 500 }
    )
  }
}