import { z } from 'zod/v4';

/**
 * Org profile creation schema — used during onboarding step 1 (identity).
 * Only name and type are strictly required at creation time.
 */
export const createOrgSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  type: z.enum(['NGO', 'Research Group', 'Social Startup', 'Community Org']),
  legal_entity_type: z.enum(['Trust', 'Society', 'Section 8 Company', 'Unregistered']).optional(),
  location: z.string().optional(),
});

/**
 * Org profile update schema — used during onboarding steps 2-4 and settings page.
 * All fields are optional since it's a partial update.
 */
export const updateOrgSchema = z.object({
  // Step 1: Identity
  name: z.string().min(1).optional(),
  type: z.enum(['NGO', 'Research Group', 'Social Startup', 'Community Org']).optional(),
  legal_entity_type: z.enum(['Trust', 'Society', 'Section 8 Company', 'Unregistered']).optional(),
  location: z.string().optional(),

  // Step 2: Mission & Cause
  mission_statement: z.string().optional(),
  schedule_vii_causes: z.array(z.string()).optional(),
  geography_of_impact: z.string().optional(),
  target_beneficiaries: z.string().optional(),

  // Step 3: Capacity & Compliance
  team_size: z.number().int().positive().optional(),
  has_audited_financials: z.boolean().optional(),
  annual_turnover_range: z.enum(['<10L', '10L-50L', '50L-1Cr', '>1Cr']).optional(),
  has_12a_80g: z.boolean().optional(),
  has_fcra: z.boolean().optional(),
  ngo_darpan_id: z.string().optional(),
  csr_1_registration: z.string().optional(),

  // Step 4: Funding Needs
  funding_range_min: z.number().int().nonnegative().optional(),
  funding_range_max: z.number().int().nonnegative().optional(),
  funding_types_needed: z.array(z.string()).optional(),
  application_urgency: z.string().optional(),

  // Onboarding progression
  onboarding_step: z.number().int().min(1).max(5).optional(),
});

export type CreateOrgInput = z.infer<typeof createOrgSchema>;
export type UpdateOrgInput = z.infer<typeof updateOrgSchema>;
