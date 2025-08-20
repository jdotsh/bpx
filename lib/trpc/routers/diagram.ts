import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'

export const diagramRouter = router({
  // List user's diagrams - Temporarily stubbed (Prisma removed)
  list: protectedProcedure
    .input(z.object({
      projectId: z.string().optional(),
      limit: z.number().min(1).max(100).default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // TODO: Implement with Supabase
      return {
        diagrams: [],
        nextCursor: undefined,
      }
    }),

  // Get single diagram - Temporarily stubbed
  get: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // TODO: Implement with Supabase
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Diagram not found (stub)',
      })
    }),

  // Create diagram - Temporarily stubbed
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(255),
      projectId: z.string(),
      content: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Implement with Supabase
      return {
        id: 'stub-id',
        title: input.title,
        projectId: input.projectId,
        content: input.content || '',
        ownerId: ctx.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }),

  // Update diagram - Temporarily stubbed
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1).max(255).optional(),
      content: z.string().optional(),
      thumbnailUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Implement with Supabase
      return {
        id: input.id,
        updatedAt: new Date(),
      }
    }),

  // Delete diagram - Temporarily stubbed
  delete: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Implement with Supabase
      return { success: true }
    }),
})