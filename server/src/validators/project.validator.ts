import { z } from 'zod/v4';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  start_date: z.string().date().optional(),
  end_date: z.string().date().optional(),
  geography: z.string().optional(),
  beneficiaries_count: z.number().int().nonnegative().optional(),
  beneficiary_type: z.string().optional(),
  target_demographics: z.array(z.string()).optional(),
  activities: z.string().optional(),
  outcomes: z.string().optional(),
  sdg_alignment: z.array(z.string()).optional(),
  budget_used: z.number().nonnegative().optional(),
  funding_source: z.string().optional(),
  utilization_certificate_url: z.string().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
