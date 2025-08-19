import { prisma } from '@/lib/prisma'
import type { Diagram, DiagramVersion } from '@prisma/client'
import type { CreateDiagramInput, UpdateDiagramInput, SaveDiagramInput } from '@/lib/validations/diagram'
import { toPrismaJson } from '@/lib/core/types/prisma-helpers'

export interface DiagramWithProject extends Diagram {
  project: {
    id: string
    name: string
  }
}

export interface DiagramWithVersions extends Diagram {
  versions: DiagramVersion[]
  project: {
    id: string
    name: string
    ownerId: string
  }
}

export class DiagramService {
  
  static async createDiagram(
    userId: string, 
    data: CreateDiagramInput
  ): Promise<Diagram | null> {
    try {
      // Verify user has access to the project
      const project = await prisma.project.findFirst({
        where: {
          id: data.projectId,
          ownerId: userId,
          deletedAt: null
        }
      })

      if (!project) {
        return null
      }

      const diagram = await prisma.diagram.create({
        data: {
          ...data,
          ownerId: userId,
          version: 1
        }
      })
      return diagram
    } catch (error) {
      console.error('Error creating diagram:', error)
      return null
    }
  }

  static async getDiagramById(
    diagramId: string, 
    userId: string
  ): Promise<DiagramWithVersions | null> {
    try {
      const diagram = await prisma.diagram.findFirst({
        where: {
          id: diagramId,
          ownerId: userId,
          deletedAt: null
        },
        include: {
          versions: {
            orderBy: { revNumber: 'desc' },
            take: 10 // Only get last 10 versions for performance
          },
          project: {
            select: {
              id: true,
              name: true,
              ownerId: true
            }
          }
        }
      })
      return diagram
    } catch (error) {
      console.error('Error getting diagram by ID:', error)
      return null
    }
  }

  static async getUserDiagrams(
    userId: string,
    projectId?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<DiagramWithProject[]> {
    try {
      const diagrams = await prisma.diagram.findMany({
        where: {
          ownerId: userId,
          deletedAt: null,
          ...(projectId && { projectId })
        },
        include: {
          project: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      })
      return diagrams as DiagramWithProject[]
    } catch (error) {
      console.error('Error getting user diagrams:', error)
      return []
    }
  }

  static async updateDiagram(
    diagramId: string,
    userId: string,
    data: UpdateDiagramInput
  ): Promise<Diagram | null> {
    try {
      const diagram = await prisma.diagram.update({
        where: {
          id: diagramId,
          ownerId: userId,
          deletedAt: null
        },
        data: {
          ...data,
          version: { increment: 1 }
        }
      })
      return diagram
    } catch (error) {
      console.error('Error updating diagram:', error)
      return null
    }
  }

  static async saveDiagramContent(
    diagramId: string,
    userId: string,
    data: SaveDiagramInput,
    createVersion: boolean = false
  ): Promise<Diagram | null> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Update the main diagram
        const diagram = await tx.diagram.update({
          where: {
            id: diagramId,
            ownerId: userId,
            deletedAt: null
          },
          data: {
            bpmnXml: data.bpmnXml,
            ...(data.title && { title: data.title }),
            ...(data.metadata && { metadata: data.metadata }),
            version: { increment: 1 }
          }
        })

        // Create version if requested
        if (createVersion) {
          const latestVersion = await tx.diagramVersion.findFirst({
            where: { diagramId },
            orderBy: { revNumber: 'desc' },
            select: { revNumber: true }
          })

          await tx.diagramVersion.create({
            data: {
              diagramId,
              revNumber: (latestVersion?.revNumber || 0) + 1,
              bpmnXml: data.bpmnXml,
              metadata: data.metadata as any || {},
              authorId: userId,
              changeMessage: 'Auto-saved version'
            }
          })
        }

        return diagram
      })

      return result
    } catch (error) {
      console.error('Error saving diagram content:', error)
      return null
    }
  }

  static async deleteDiagram(
    diagramId: string,
    userId: string
  ): Promise<boolean> {
    try {
      await prisma.diagram.update({
        where: {
          id: diagramId,
          ownerId: userId,
          deletedAt: null
        },
        data: {
          deletedAt: new Date()
        }
      })
      return true
    } catch (error) {
      console.error('Error deleting diagram:', error)
      return false
    }
  }

  static async getDiagramXml(
    diagramId: string,
    userId: string
  ): Promise<string | null> {
    try {
      const diagram = await prisma.diagram.findFirst({
        where: {
          id: diagramId,
          ownerId: userId,
          deletedAt: null
        },
        select: {
          bpmnXml: true
        }
      })
      
      return diagram?.bpmnXml || null
    } catch (error) {
      console.error('Error getting diagram XML:', error)
      return null
    }
  }

  static async getRecentDiagrams(
    userId: string,
    limit: number = 5
  ): Promise<DiagramWithProject[]> {
    try {
      const diagrams = await prisma.diagram.findMany({
        where: {
          ownerId: userId,
          deletedAt: null
        },
        include: {
          project: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: limit
      })
      return diagrams as DiagramWithProject[]
    } catch (error) {
      console.error('Error getting recent diagrams:', error)
      return []
    }
  }

  static async duplicateDiagram(
    diagramId: string,
    userId: string,
    newTitle?: string
  ): Promise<Diagram | null> {
    try {
      const originalDiagram = await prisma.diagram.findFirst({
        where: {
          id: diagramId,
          ownerId: userId,
          deletedAt: null
        }
      })

      if (!originalDiagram) {
        return null
      }

      const duplicatedDiagram = await prisma.diagram.create({
        data: {
          title: newTitle || `${originalDiagram.title} (Copy)`,
          bpmnXml: originalDiagram.bpmnXml,
          thumbnailUrl: originalDiagram.thumbnailUrl,
          metadata: toPrismaJson(originalDiagram.metadata || {}),
          projectId: originalDiagram.projectId,
          ownerId: userId,
          version: 1,
          isPublic: false
        }
      })

      return duplicatedDiagram
    } catch (error) {
      console.error('Error duplicating diagram:', error)
      return null
    }
  }

  static async generateThumbnail(
    diagramId: string,
    userId: string,
    thumbnailUrl: string
  ): Promise<boolean> {
    try {
      await prisma.diagram.update({
        where: {
          id: diagramId,
          ownerId: userId
        },
        data: {
          thumbnailUrl
        }
      })
      return true
    } catch (error) {
      console.error('Error updating diagram thumbnail:', error)
      return false
    }
  }
}