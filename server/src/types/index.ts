import type { Request } from 'express';

// ── Database Row Types ──────────────────────────────────

export interface Organization {
  id: string;
  user_id: string;
  name: string;
  type: string | null;
  legal_entity_type: string | null;
  location: string | null;
  mission_statement: string | null;
  schedule_vii_causes: string[] | null;
  geography_of_impact: string | null;
  target_beneficiaries: string | null;
  team_size: number | null;
  has_audited_financials: boolean;
  annual_turnover_range: string | null;
  has_12a_80g: boolean;
  has_fcra: boolean;
  ngo_darpan_id: string | null;
  csr_1_registration: string | null;
  funding_range_min: number | null;
  funding_range_max: number | null;
  funding_types_needed: string[] | null;
  application_urgency: string | null;
  onboarding_step: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  org_id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  geography: string | null;
  beneficiaries_count: number | null;
  beneficiary_type: string | null;
  target_demographics: string[] | null;
  activities: string | null;
  outcomes: string | null;
  sdg_alignment: string[] | null;
  budget_used: number | null;
  funding_source: string | null;
  utilization_certificate_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Grant {
  id: string;
  title: string;
  funder: string;
  cause_areas: string[] | null;
  schedule_vii_categories: string[] | null;
  eligible_org_types: string[] | null;
  funding_type_offered: string[] | null;
  geography: string | null;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  requires_audited_financials: boolean;
  requires_12a_80g: boolean;
  requires_fcra: boolean;
  requires_ngo_darpan: boolean;
  requires_csr_1: boolean;
  min_turnover_range: string | null;
  eligible_legal_entities: string[] | null;
  description: string | null;
  application_url: string | null;
  required_documents: string[] | null;
  source_portal: string | null;
  is_active: boolean;
  last_scraped_at: string;
  created_at: string;
}

export interface GrantMatch {
  id: string;
  org_id: string;
  grant_id: string;
  fit_score: number;
  match_reasons: Record<string, unknown> | null;
  is_dismissed: boolean;
  created_at: string;
}

export interface Application {
  id: string;
  org_id: string;
  grant_id: string;
  status: 'exploring' | 'drafting' | 'submitted' | 'won' | 'rejected';
  draft_content: string | null;
  compliance_checklist: Record<string, unknown> | null;
  submitted_at: string | null;
  outcome_notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Extended Express Request ────────────────────────────

export interface AuthUser {
  userId: string;
  orgId: string | null;
  accessToken: string;
}

// Augment the core Express Request type so `req.user` is available on all
// route handlers after auth middleware runs.
declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

/**
 * Type alias for routes where auth middleware has already run.
 * Controllers use this to assert that req.user is definitely set.
 */
export type AuthenticatedRequest = import('express').Request & {
  user: AuthUser;
};
