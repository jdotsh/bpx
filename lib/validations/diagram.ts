import { z } from 'zod'

// Strict metadata schema to prevent injection attacks
const metadataSchema = z.object({
  description: z.string().max(500).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  category: z.enum(['business', 'technical', 'process', 'other']).optional(),
  createdWith: z.string().max(100).optional(),
  format: z.string().max(50).optional(),
  elementCount: z.number().int().min(0).max(10000).optional(),
  lastModified: z.string().datetime().optional(),
  lastSaved: z.string().datetime().optional(),
  customFields: z.record(
    z.string().max(50), // key length limit
    z.union([
      z.string().max(200),
      z.number(),
      z.boolean()
    ])
  ).optional()
}).strict()

export const createDiagramSchema = z.object({
  title: z.string()
    .min(1, 'Diagram title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  bpmnXml: z.string()
    .optional()
    .nullable(),
  projectId: z.string()
    .cuid('Invalid project ID'),
  metadata: metadataSchema.optional().default({}),
  isPublic: z.boolean().optional().default(false)
})

export const updateDiagramSchema = z.object({
  title: z.string()
    .min(1, 'Diagram title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim()
    .optional(),
  bpmnXml: z.string()
    .optional()
    .nullable(),
  metadata: metadataSchema.optional(),
  isPublic: z.boolean().optional()
})

export const diagramIdSchema = z.object({
  id: z.string().cuid('Invalid diagram ID')
})

export const saveDiagramSchema = z.object({
  bpmnXml: z.string().min(1, 'BPMN XML is required'),
  title: z.string()
    .min(1, 'Diagram title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim()
    .optional(),
  metadata: metadataSchema.optional()
})

export type CreateDiagramInput = z.infer<typeof createDiagramSchema>
export type UpdateDiagramInput = z.infer<typeof updateDiagramSchema>
export type DiagramIdInput = z.infer<typeof diagramIdSchema>
export type SaveDiagramInput = z.infer<typeof saveDiagramSchema>