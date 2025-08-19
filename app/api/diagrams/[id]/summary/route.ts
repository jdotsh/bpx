// Diagram Summary API - Optimized for Dashboard Performance
// R2: API Foundations - ETag-enabled lightweight endpoint

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUserId, requireResourceAccess } from '@/src/server/auth/getUser'
import { withErrorHandler, NotFoundError } from '@/src/server/web/error'
import { applyRateLimit, addRateLimitHeaders } from '@/src/server/web/ratelimit'
import { makeVersionETag, isNotModified, createNotModifiedResponse, createETagResponse } from '@/src/server/web/etag'
import type { DiagramSummary } from '@/src/server/schemas/diagram.dto'

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const userId = await requireUserId()
  await requireResourceAccess(params.id, 'diagram', 'read')
  
  const canProceed = await applyRateLimit(request, userId, 'read')
  if (!canProceed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }
  
  // Ultra-efficient query - only summary data, no BPMN XML
  const summary = await prisma.diagram.findFirst({
    where: { 
      id: params.id,
      deletedAt: null,
      OR: [
        { ownerId: userId },
        { 
          project: {
            OR: [
              { ownerId: userId },
              { collaborators: { some: { userId } } }
            ]
          }
        }
      ]
    },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      version: true,
      projectId: true,
      thumbnailUrl: true,
      metadata: true,
      owner: {
        select: {
          name: true,
          email: true
        }
      },
      project: {
        select: {
          name: true
        }
      }
    }
  })
  
  if (!summary) {
    throw new NotFoundError('Diagram')
  }
  
  // Create optimized summary response
  const diagramSummary: DiagramSummary = {
    id: summary.id,
    title: summary.title,
    updatedAt: summary.updatedAt.toISOString(),
    version: summary.version,
    projectId: summary.projectId,
    thumbnailUrl: summary.thumbnailUrl || undefined,
    lastEditor: summary.owner.name || summary.owner.email,
    elementCount: (summary.metadata as any)?.elementCount as number || undefined
  }
  
  // Version-based ETag for efficient caching
  const etag = makeVersionETag(summary.version)
  
  // Check if client has current version
  if (isNotModified(request, etag)) {
    const response = createNotModifiedResponse()
    addRateLimitHeaders(response.headers)
    return response
  }
  
  // Return fresh data with aggressive caching
  const response = createETagResponse(diagramSummary, etag)
  
  addRateLimitHeaders(response.headers)
  return response
})