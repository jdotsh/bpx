import { router, protectedProcedure } from '@/lib/trpc/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { 
  planFromPrompt, 
  cpjFromPlan, 
  validateAndRepair, 
  cpjToBpmnXml,
  PerformanceOptimizer 
} from '../services/nlp2bpmn';
// import { prisma } from '@/lib/prisma'; // Prisma removed

const optimizer = new PerformanceOptimizer();

export const aiRouter = router({
  // AI features disabled for MVP - requires additional Prisma models
  placeholder: protectedProcedure.query(() => ({ message: 'AI features coming soon' })),
  /*
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MAIN GENERATION ENDPOINT - NLP to BPMN
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  generateFromText: protectedProcedure
    .input(z.object({
      prompt: z.string().min(10).max(2000),
      projectId: z.string().optional(),
      temperature: z.number().min(0).max(1).default(0.2),
      useLanes: z.boolean().default(true),
      domain: z.enum(['general', 'finance', 'healthcare', 'manufacturing', 'it']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Rate limiting check - TODO: implement aiGeneration model
      // const recentGenerations = await prisma.aiGeneration.count({
      //   where: {
      //     userId: ctx.userId,
      //     createdAt: { gte: new Date(Date.now() - 60000) } // Last minute
      //   }
      // });
      
      // if (recentGenerations >= 5) {
      //   throw new TRPCError({
      //     code: 'TOO_MANY_REQUESTS',
      //     message: 'Rate limit exceeded. Please wait before generating again.'
      //   });
      // }

      // Track start time for performance monitoring
      const startTime = Date.now();
      const timings: Record<string, number> = {};

      try {
        // Step 1: Planning
        const planStart = Date.now();
        const plan = await planFromPrompt(input.prompt, ctx.userId, {
          domain: input.domain
        });
        timings.planning = Date.now() - planStart;

        // Step 2: CPJ Generation
        const cpjStart = Date.now();
        const cpjDraft = await cpjFromPlan(plan, { 
          temperature: input.temperature 
        });
        timings.generation = Date.now() - cpjStart;

        // Step 3: Validation & Repair
        const validationStart = Date.now();
        const cpj = await validateAndRepair(cpjDraft);
        timings.validation = Date.now() - validationStart;

        // Step 4: XML Mapping
        const mappingStart = Date.now();
        const xml = await cpjToBpmnXml(cpj);
        timings.mapping = Date.now() - mappingStart;

        // Step 5: Auto-layout (would be done here)
        // const layoutedXml = await autoLayout(xml);

        // Step 6: Persist generation - TODO: implement aiGeneration model
        // const generation = await prisma.aiGeneration.create({
        //   data: {
        //     userId: ctx.userId,
        //     projectId: input.projectId,
        //     prompt: input.prompt,
        //     cpj: cpj,
        //     generatedXml: xml,
        //     domain: input.domain,
        //     temperature: input.temperature,
        //     timings,
        //     totalTime: Date.now() - startTime,
        //     modelUsed: 'gpt-4-turbo/claude-3',
        //     tokenCount: estimateTokens(input.prompt, xml)
        //   }
        // });

        // Step 7: Create diagram version
        let diagramId = null;
        if (input.projectId) {
          const diagram = await prisma.diagram.create({
            data: {
              projectId: input.projectId,
              ownerId: ctx.userId,
              title: cpj.name,
              bpmnXml: xml,
              metadata: {
                generatedBy: 'ai',
                // generationId: generation.id,
                cpj
              }
            }
          });
          
          diagramId = diagram.id;

          // Create initial version
          await prisma.diagramVersion.create({
            data: {
              diagramId: diagram.id,
              revNumber: 1,
              bpmnXml: xml,
              metadata: { cpj },
              authorId: ctx.userId,
              changeMessage: 'AI Generated from: ' + input.prompt.slice(0, 100)
            }
          });
        }

        return {
          success: true,
          cpj,
          xml,
          diagramId,
          // generationId: generation.id,
          timings,
          totalTime: Date.now() - startTime
        };
      } catch (error) {
        // Log error for monitoring
        console.error('AI Generation failed:', error);
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate BPMN. Please try again.',
          cause: error
        });
      }
    }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FEEDBACK ENDPOINT - Learn from corrections (disabled for MVP)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // provideFeedback: protectedProcedure
  //   .input(z.object({
  //     generationId: z.string(),
  //     editedXml: z.string(),
  //     editedCpj: z.any().optional(),
  //     rating: z.number().min(1).max(5),
  //     feedback: z.string().max(500).optional(),
  //     issues: z.array(z.object({
  //       type: z.string(),
  //       description: z.string()
  //     })).optional()
  //   }))
  //   .mutation(async ({ ctx, input }) => {
  //     throw new TRPCError({
  //       code: 'NOT_IMPLEMENTED',
  //       message: 'Feature coming soon'
  //     });
  //   }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SUGGESTIONS ENDPOINT - AI-powered improvements
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getSuggestions: protectedProcedure
    .input(z.object({
      xml: z.string(),
      type: z.enum(['optimization', 'completion', 'compliance', 'clarity'])
    }))
    .query(async ({ ctx, input }) => {
      // This would analyze the XML and provide suggestions
      // For now, returning mock suggestions
      
      const suggestions = [
        {
          type: 'optimization',
          priority: 'high',
          description: 'Combine sequential user tasks into one',
          elementIds: ['task1', 'task2'],
          autoFixAvailable: true
        },
        {
          type: 'completion',
          priority: 'medium',
          description: 'Add error boundary event for service task',
          elementIds: ['serviceTask1'],
          autoFixAvailable: true
        },
        {
          type: 'clarity',
          priority: 'low',
          description: 'Add description to gateway decision',
          elementIds: ['gateway1'],
          autoFixAvailable: false
        }
      ];

      return suggestions.filter(s => s.type === input.type || input.type === 'optimization');
    }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // IMPROVE ENDPOINT - Enhance existing diagrams
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  improveDiagram: protectedProcedure
    .input(z.object({
      diagramId: z.string(),
      instructions: z.string().min(10).max(500),
      aspects: z.array(z.enum(['layout', 'naming', 'structure', 'completeness', 'performance']))
    }))
    .mutation(async ({ ctx, input }) => {
      // Load diagram
      const diagram = await prisma.diagram.findFirst({
        where: {
          id: input.diagramId,
          ownerId: ctx.userId
        }
      });

      if (!diagram) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Diagram not found'
        });
      }

      // TODO: Implement improvement logic
      // For now, returning the original with a message
      
      return {
        improved: false,
        message: 'Improvement feature coming soon',
        xml: diagram.bpmnXml
      };
    }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HISTORY ENDPOINT - Get generation history
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getGenerationHistory: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(10),
      cursor: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      const generations = await prisma.aiGeneration.findMany({
        where: { userId: ctx.userId },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          prompt: true,
          domain: true,
          rating: true,
          createdAt: true,
          totalTime: true
        }
      });

      let nextCursor: string | undefined;
      if (generations.length > input.limit) {
        const nextItem = generations.pop();
        nextCursor = nextItem?.id;
      }

      return {
        generations,
        nextCursor
      };
    })
  */
});

// Helper function to estimate token usage
function estimateTokens(prompt: string, xml: string): number {
  // Rough estimation: 1 token ≈ 4 characters
  return Math.ceil((prompt.length + xml.length) / 4);
}