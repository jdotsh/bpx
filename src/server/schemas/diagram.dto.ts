// BPMN Studio API DTOs - Enterprise Grade
// R2: API Foundations

import { z } from 'zod'

// Core BPMN diagram validation
const BpmnXmlSchema = z.string().min(50).refine(
  (xml) => xml.includes('<bpmn') || xml.includes('<?xml'),
  'Invalid BPMN XML format'
)

// Project operations
export const ProjectCreateDto = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.any()).default({}),
})

export const ProjectUpdateDto = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional(),
  version: z.number().int().nonnegative(), // Optimistic concurrency
})

// Diagram operations
export const DiagramCreateDto = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(200),
  bpmnXml: BpmnXmlSchema,
  metadata: z.record(z.string(), z.any()).default({}),
})

export const DiagramUpdateDto = z.object({
  title: z.string().min(1).max(200).optional(),
  bpmnXml: BpmnXmlSchema.optional(),
  xmlUrl: z.string().url().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  version: z.number().int().nonnegative(), // Critical: optimistic concurrency
})

// Query parameters
export const DiagramListQuery = z.object({
  projectId: z.string().uuid().optional(),
  q: z.string().max(100).optional(), // Search query
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export const ProjectListQuery = z.object({
  q: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

// Response types for performance (summary views)
export type DiagramSummary = {
  id: string
  title: string
  updatedAt: string
  version: number
  elementCount?: number
  thumbnailUrl?: string
  lastEditor?: string
  projectId: string
}

export type ProjectSummary = {
  id: string
  name: string
  description?: string | null
  updatedAt: string
  version: number
  diagramCount: number
  lastActivity?: string
}

// Type exports for client usage
export type DiagramCreate = z.infer<typeof DiagramCreateDto>
export type DiagramUpdate = z.infer<typeof DiagramUpdateDto>
export type ProjectCreate = z.infer<typeof ProjectCreateDto>
export type ProjectUpdate = z.infer<typeof ProjectUpdateDto>