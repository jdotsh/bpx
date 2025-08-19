import { z } from 'zod';

export const Lane = z.object({ 
  id: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]*$/), // Valid ID format
  name: z.string().min(1).max(100),
  participants: z.array(z.string()).optional() 
});

export const Element = z.discriminatedUnion('type', [
  z.object({ 
    type: z.literal('startEvent'), 
    id: z.string().regex(/^startEvent\d+$/),
    name: z.string().optional() 
  }),
  z.object({ 
    type: z.literal('endEvent'), 
    id: z.string().regex(/^endEvent\d+$/),
    name: z.string().optional() 
  }),
  z.object({ 
    type: z.literal('task'), 
    id: z.string().regex(/^task\d+$/),
    name: z.string().min(1).max(200),
    kind: z.enum(['user','service','script']).optional().default('user'),
    laneId: z.string().optional(),
    assignee: z.string().optional() 
  }),
  z.object({ 
    type: z.literal('gateway'), 
    id: z.string().regex(/^gateway\d+$/),
    name: z.string().optional(),
    gatewayType: z.enum(['exclusive','parallel','inclusive']) 
  }),
  z.object({ 
    type: z.literal('subProcess'), 
    id: z.string().regex(/^subProcess\d+$/),
    name: z.string().min(1).max(200),
    collapsed: z.boolean().optional().default(false) 
  }),
  z.object({ 
    type: z.literal('intermediateEvent'), 
    id: z.string().regex(/^event\d+$/),
    name: z.string().optional(),
    eventKind: z.enum(['message','timer','signal','error']) 
  }),
]);

export const Flow = z.object({
  id: z.string().regex(/^flow\d+$/),
  sourceId: z.string(),
  targetId: z.string(),
  condition: z.string().max(500).optional(),
  isDefault: z.boolean().optional().default(false),
});

export const CpjProcessSchema = z.object({
  id: z.string().regex(/^process\d+$/),
  name: z.string().min(1).max(200),
  lanes: z.array(Lane).optional(),
  elements: z.array(Element).min(2), // At least start and end
  flows: z.array(Flow).min(1),
}).refine(
  (data) => {
    // Must have exactly one startEvent
    const startEvents = data.elements.filter(e => e.type === 'startEvent');
    return startEvents.length === 1;
  },
  { message: "Process must have exactly one start event" }
).refine(
  (data) => {
    // Must have at least one endEvent
    const endEvents = data.elements.filter(e => e.type === 'endEvent');
    return endEvents.length >= 1;
  },
  { message: "Process must have at least one end event" }
);

export type CpjProcess = z.infer<typeof CpjProcessSchema>;