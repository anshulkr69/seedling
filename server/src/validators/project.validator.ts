import { z } from 'zod/v4';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  start_date: z.string().date().nullable().optional(),
  end_date: z.string().date().nullable().optional(),
  geography: z.string().nullable().optional(),
  beneficiaries_count: z.number().int().nonnegative().nullable().optional(),
  beneficiary_type: z.string().nullable().optional(),
  target_demographics: z.array(z.string()).nullable().optional(),
  activities: z.string().nullable().optional(),
  outcomes: z.string().nullable().optional(),
  sdg_alignment: z.array(z.string()).nullable().optional(),
  budget_used: z.number().nonnegative().nullable().optional(),
  funding_source: z.string().nullable().optional(),
  utilization_certificate_url: z.string().nullable().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
