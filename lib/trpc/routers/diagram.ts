import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'

export const diagramRouter = router({
  // List user's diagrams
  list: protectedProcedure
    .input(z.object({
      projectId: z.string().optional(),
      limit: z.number().min(1).max(100).default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const diagrams = await ctx.db.diagram.findMany({
        where: {
          ownerId: ctx.userId!,
          projectId: input.projectId!,
          deletedAt: null,
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          thumbnailUrl: true,
          updatedAt: true,
          version: true,
        },
      })

      let nextCursor: string | undefined
      if (diagrams.length > input.limit) {
        const nextItem = diagrams.pop()
        nextCursor = nextItem!.id
      }

      return {
        diagrams,
        nextCursor,
      }
    }),

  // Get single diagram
  get: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const diagram = await ctx.db.diagram.findFirst({
        where: {
          id: input.id,
          ownerId: ctx.userId!,
          deletedAt: null,
        },
      })

      if (!diagram) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Diagram not found',
        })
      }

      return diagram
    }),

  // Create new diagram
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(200),
      bpmnXml: z.string(),
      projectId: z.string().optional(),
      thumbnailUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check diagram limit for free users
      // TODO: Check subscription status
      const count = await ctx.db.diagram.count({
        where: {
          ownerId: ctx.userId!,
          deletedAt: null,
        },
      })

      if (count >= 3) {
        // TODO: Check if user is on paid plan
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Free plan limited to 3 diagrams. Please upgrade to Pro.',
        })
      }

      const diagram = await ctx.db.diagram.create({
        data: {
          title: input.title,
          bpmnXml: input.bpmnXml,
          thumbnailUrl: input.thumbnailUrl,
          ownerId: ctx.userId!,
          projectId: input.projectId!,
          version: 1,
        },
      })

      // Create initial version
      await ctx.db.diagramVersion.create({
        data: {
          diagramId: diagram.id,
          revNumber: 1,
          bpmnXml: input.bpmnXml,
          authorId: ctx.userId!,
          changeMessage: 'Initial version',
        },
      })

      return diagram
    }),

  // Update diagram (with auto-save)
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1).max(200).optional(),
      bpmnXml: z.string().optional(),
      thumbnailUrl: z.string().optional(),
      version: z.number(), // For optimistic locking
    }))
    .mutation(async ({ ctx, input }) => {
      // Check ownership and version
      const existing = await ctx.db.diagram.findFirst({
        where: {
          id: input.id,
          ownerId: ctx.userId!,
          deletedAt: null,
        },
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Diagram not found',
        })
      }

      if (existing.version !== input.version) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Diagram was modified elsewhere. Please refresh.',
        })
      }

      // Update diagram
      const updated = await ctx.db.diagram.update({
        where: { id: input.id },
        data: {
          title: input.title,
          bpmnXml: input.bpmnXml,
          thumbnailUrl: input.thumbnailUrl,
          version: { increment: 1 },
        },
      })

      // Create version snapshot if XML changed
      if (input.bpmnXml && input.bpmnXml !== existing.bpmnXml) {
        await ctx.db.diagramVersion.create({
          data: {
            diagramId: updated.id,
            revNumber: updated.version,
            bpmnXml: input.bpmnXml,
            authorId: ctx.userId!,
            changeMessage: 'Auto-saved',
          },
        })
      }

      return updated
    }),

  // Delete diagram (soft delete)
  delete: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const diagram = await ctx.db.diagram.findFirst({
        where: {
          id: input.id,
          ownerId: ctx.userId!,
          deletedAt: null,
        },
      })

      if (!diagram) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Diagram not found',
        })
      }

      await ctx.db.diagram.update({
        where: { id: input.id },
        data: { deletedAt: new Date() },
      })

      return { success: true }
    }),
})