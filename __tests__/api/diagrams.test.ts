import { GET, POST } from '@/app/api/diagrams/route'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { DiagramService } from '@/lib/services/diagram'

// Mock dependencies
jest.mock('@/lib/auth/server')
jest.mock('@/lib/services/diagram')

describe('/api/diagrams', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' }
  
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/diagrams', () => {
    it('returns diagrams for authenticated user', async () => {
      ;(getCurrentUser as jest.Mock).mockResolvedValue(mockUser)
      
      const mockDiagrams = [
        { id: 'diagram-1', title: 'Test Diagram 1' },
        { id: 'diagram-2', title: 'Test Diagram 2' },
      ]
      
      ;(DiagramService.getUserDiagrams as jest.Mock).mockResolvedValue(mockDiagrams)

      const request = new NextRequest('http://localhost/api/diagrams?page=1&limit=10')
      const response = await GET(request)
      const data = await response.json()

      expect(getCurrentUser).toHaveBeenCalled()
      expect(DiagramService.getUserDiagrams).toHaveBeenCalledWith(
        mockUser.id,
        undefined,
        1,
        10
      )
      expect(data).toEqual({
        data: mockDiagrams,
        pagination: {
          page: 1,
          limit: 10,
          hasMore: false,
        },
      })
      expect(response.status).toBe(200)
    })

    it('returns 401 for unauthenticated requests', async () => {
      ;(getCurrentUser as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/diagrams')
      const response = await GET(request)
      const data = await response.json()

      expect(data).toEqual({
        error: 'Unauthorized',
        message: 'Authentication required',
      })
      expect(response.status).toBe(401)
    })

    it('handles query parameter validation errors', async () => {
      ;(getCurrentUser as jest.Mock).mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost/api/diagrams?page=invalid&limit=999')
      const response = await GET(request)
      const data = await response.json()

      expect(data.error).toBe('Validation Error')
      expect(response.status).toBe(400)
    })

    it('filters by projectId when provided', async () => {
      ;(getCurrentUser as jest.Mock).mockResolvedValue(mockUser)
      ;(DiagramService.getUserDiagrams as jest.Mock).mockResolvedValue([])

      const projectId = 'project-123'
      const request = new NextRequest(`http://localhost/api/diagrams?projectId=${projectId}`)
      await GET(request)

      expect(DiagramService.getUserDiagrams).toHaveBeenCalledWith(
        mockUser.id,
        projectId,
        1,
        20
      )
    })
  })

  describe('POST /api/diagrams', () => {
    it('creates a new diagram successfully', async () => {
      ;(getCurrentUser as jest.Mock).mockResolvedValue(mockUser)
      
      const newDiagram = {
        id: 'diagram-new',
        title: 'New Diagram',
        projectId: 'project-123',
        bpmnXml: '<xml>content</xml>',
      }
      
      ;(DiagramService.createDiagram as jest.Mock).mockResolvedValue(newDiagram)

      const request = new NextRequest('http://localhost/api/diagrams', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Diagram',
          projectId: 'project-123',
          bpmnXml: '<xml>content</xml>',
        }),
      })
      
      const response = await POST(request)
      const data = await response.json()

      expect(getCurrentUser).toHaveBeenCalled()
      expect(DiagramService.createDiagram).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          title: 'New Diagram',
          projectId: 'project-123',
          bpmnXml: '<xml>content</xml>',
        })
      )
      expect(data).toEqual(newDiagram)
      expect(response.status).toBe(201)
    })

    it('returns 401 for unauthenticated requests', async () => {
      ;(getCurrentUser as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/diagrams', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test' }),
      })
      
      const response = await POST(request)
      const data = await response.json()

      expect(data.error).toBe('Unauthorized')
      expect(response.status).toBe(401)
    })

    it('validates request body', async () => {
      ;(getCurrentUser as jest.Mock).mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost/api/diagrams', {
        method: 'POST',
        body: JSON.stringify({ title: '' }), // Invalid: empty title
      })
      
      const response = await POST(request)
      const data = await response.json()

      expect(data.error).toBe('Validation Error')
      expect(response.status).toBe(400)
    })

    it('handles creation failures', async () => {
      ;(getCurrentUser as jest.Mock).mockResolvedValue(mockUser)
      ;(DiagramService.createDiagram as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/diagrams', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Diagram',
          projectId: 'invalid-project',
        }),
      })
      
      const response = await POST(request)
      const data = await response.json()

      expect(data.error).toBe('Creation Failed')
      expect(response.status).toBe(400)
    })

    it('handles invalid JSON in request body', async () => {
      ;(getCurrentUser as jest.Mock).mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost/api/diagrams', {
        method: 'POST',
        body: 'invalid json',
      })
      
      const response = await POST(request)
      const data = await response.json()

      expect(data.error).toBe('Invalid JSON')
      expect(response.status).toBe(400)
    })
  })
})