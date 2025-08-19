import { ProjectService } from '@/lib/services/project'
import { prisma } from '@/lib/prisma'
import type { CreateProjectInput, UpdateProjectInput } from '@/lib/validations/project'

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    diagram: {
      createMany: jest.fn(),
    },
  },
}))

describe('ProjectService', () => {
  const mockUserId = 'user-123'
  const mockProjectId = 'project-456'
  
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createProject', () => {
    it('creates a new project successfully', async () => {
      const input: CreateProjectInput = {
        name: 'Test Project',
        description: 'Test Description',
        metadata: { key: 'value' },
      }

      const mockProject = {
        id: mockProjectId,
        ...input,
        ownerId: mockUserId,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }

      ;(prisma.project.create as jest.Mock).mockResolvedValue(mockProject)

      const result = await ProjectService.createProject(mockUserId, input)

      expect(prisma.project.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: input.name,
          description: input.description,
          ownerId: mockUserId,
          version: 1,
        }),
      })
      expect(result).toEqual(mockProject)
    })

    it('handles creation errors gracefully', async () => {
      const input: CreateProjectInput = {
        name: 'Test Project',
        metadata: {},
      }

      ;(prisma.project.create as jest.Mock).mockRejectedValue(new Error('Database error'))

      const result = await ProjectService.createProject(mockUserId, input)

      expect(result).toBeNull()
    })
  })

  describe('getProjectById', () => {
    it('retrieves project with diagrams', async () => {
      const mockProject = {
        id: mockProjectId,
        name: 'Test Project',
        ownerId: mockUserId,
        diagrams: [
          { id: 'diagram-1', title: 'Diagram 1', updatedAt: new Date() },
        ],
        _count: { diagrams: 1 },
      }

      ;(prisma.project.findFirst as jest.Mock).mockResolvedValue(mockProject)

      const result = await ProjectService.getProjectById(mockProjectId, mockUserId)

      expect(prisma.project.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockProjectId,
          ownerId: mockUserId,
          deletedAt: null,
        },
        include: expect.objectContaining({
          diagrams: expect.any(Object),
          _count: expect.any(Object),
        }),
      })
      expect(result).toEqual(mockProject)
    })

    it('returns null for non-existent project', async () => {
      ;(prisma.project.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await ProjectService.getProjectById(mockProjectId, mockUserId)

      expect(result).toBeNull()
    })
  })

  describe('updateProject', () => {
    it('updates project successfully', async () => {
      const input: UpdateProjectInput = {
        name: 'Updated Name',
        description: 'Updated Description',
      }

      const mockUpdatedProject = {
        id: mockProjectId,
        ...input,
        ownerId: mockUserId,
        version: 2,
      }

      ;(prisma.project.update as jest.Mock).mockResolvedValue(mockUpdatedProject)

      const result = await ProjectService.updateProject(mockProjectId, mockUserId, input)

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: {
          id: mockProjectId,
          ownerId: mockUserId,
          deletedAt: null,
        },
        data: expect.objectContaining({
          version: { increment: 1 },
        }),
      })
      expect(result).toEqual(mockUpdatedProject)
    })

    it('handles update errors gracefully', async () => {
      ;(prisma.project.update as jest.Mock).mockRejectedValue(new Error('Update failed'))

      const result = await ProjectService.updateProject(
        mockProjectId,
        mockUserId,
        { name: 'New Name' }
      )

      expect(result).toBeNull()
    })
  })

  describe('deleteProject', () => {
    it('soft deletes project successfully', async () => {
      ;(prisma.project.update as jest.Mock).mockResolvedValue({})

      const result = await ProjectService.deleteProject(mockProjectId, mockUserId)

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: {
          id: mockProjectId,
          ownerId: mockUserId,
          deletedAt: null,
        },
        data: {
          deletedAt: expect.any(Date),
        },
      })
      expect(result).toBe(true)
    })

    it('returns false on deletion error', async () => {
      ;(prisma.project.update as jest.Mock).mockRejectedValue(new Error('Delete failed'))

      const result = await ProjectService.deleteProject(mockProjectId, mockUserId)

      expect(result).toBe(false)
    })
  })

  describe('getUserProjects', () => {
    it('retrieves paginated user projects', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          name: 'Project 1',
          diagrams: [],
          _count: { diagrams: 0 },
        },
        {
          id: 'project-2',
          name: 'Project 2',
          diagrams: [],
          _count: { diagrams: 2 },
        },
      ]

      ;(prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects)

      const result = await ProjectService.getUserProjects(mockUserId, 1, 10)

      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: {
          ownerId: mockUserId,
          deletedAt: null,
        },
        include: expect.any(Object),
        orderBy: { updatedAt: 'desc' },
        skip: 0,
        take: 10,
      })
      expect(result).toEqual(mockProjects)
    })

    it('handles pagination correctly', async () => {
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      await ProjectService.getUserProjects(mockUserId, 3, 20)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 40, // (3-1) * 20
          take: 20,
        })
      )
    })
  })
})