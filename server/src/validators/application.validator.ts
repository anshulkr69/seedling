import { z } from 'zod/v4';

export const createApplicationSchema = z.object({
  grant_id: z.string().uuid('Invalid grant ID'),
});

export const updateApplicationSchema = z.object({
  status: z.enum(['exploring', 'drafting', 'submitted', 'won', 'rejected']).optional(),
  draft_content: z.string().optional(),
  compliance_checklist: z.record(z.string(), z.unknown()).optional(),
  submitted_at: z.string().datetime().nullable().optional(),
  outcome_notes: z.string().optional(),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
