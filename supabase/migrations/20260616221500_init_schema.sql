-- Seedling Init Migration
-- Target Environment: Supabase (PostgreSQL)

-- ────────────────────────────────────────────────────────
-- 1. Custom Types / Enums
-- ────────────────────────────────────────────────────────
CREATE TYPE legal_entity_enum AS ENUM (
  'Trust',
  'Society',
  'Section 8 Company',
  'Unregistered'
);

CREATE TYPE turnover_bracket_enum AS ENUM (
  '<10L',
  '10L-50L',
  '50L-1Cr',
  '>1Cr'
);

CREATE TYPE application_status_enum AS ENUM (
  'Exploring',
  'Drafting',
  'Submitted',
  'Won',
  'Rejected'
);

CREATE TYPE org_type_enum AS ENUM (
  'NGO',
  'Research Group',
  'Social Startup',
  'Community Org'
);

-- ────────────────────────────────────────────────────────
-- 2. Tables Definitions
-- ────────────────────────────────────────────────────────

-- Table 1: organizations (Tenant Profile)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type org_type_enum NOT NULL,
  legal_entity_type legal_entity_enum,
  location TEXT,
  mission_statement TEXT,
  schedule_vii_causes TEXT[] DEFAULT '{}',
  geography_of_impact TEXT,
  target_beneficiaries TEXT,
  team_size INTEGER,
  has_audited_financials BOOLEAN DEFAULT false,
  annual_turnover_range turnover_bracket_enum,
  has_12A_80G BOOLEAN DEFAULT false,
  has_fcra BOOLEAN DEFAULT false,
  ngo_darpan_id TEXT,
  csr_1_registration TEXT,
  funding_range_min INTEGER,
  funding_range_max INTEGER,
  funding_types_needed TEXT[] DEFAULT '{}',
  application_urgency TEXT,
  onboarding_step INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table 2: projects (Memory Vault)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  geography TEXT,
  beneficiaries_count INTEGER,
  beneficiary_type TEXT,
  target_demographics TEXT[] DEFAULT '{}',
  activities TEXT,
  outcomes TEXT,
  sdg_alignment TEXT[] DEFAULT '{}',
  budget_used NUMERIC,
  funding_source TEXT,
  utilization_certificate_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table 3: grants (Global Aggregation - Scraped Data)
CREATE TABLE grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  funder TEXT NOT NULL,
  cause_areas TEXT[] DEFAULT '{}',
  schedule_vii_categories TEXT[] DEFAULT '{}',
  eligible_org_types TEXT[] DEFAULT '{}',
  funding_type_offered TEXT[] DEFAULT '{}',
  geography TEXT,
  budget_min NUMERIC,
  budget_max NUMERIC,
  deadline TIMESTAMPTZ,
  requires_audited_financials BOOLEAN DEFAULT false,
  requires_12A_80G BOOLEAN DEFAULT false,
  requires_fcra BOOLEAN DEFAULT false,
  requires_ngo_darpan BOOLEAN DEFAULT false,
  requires_csr_1 BOOLEAN DEFAULT false,
  min_turnover_range turnover_bracket_enum,
  eligible_legal_entities TEXT[] DEFAULT '{}',
  description TEXT,
  application_url TEXT,
  required_documents TEXT[] DEFAULT '{}',
  source_portal TEXT,
  is_active BOOLEAN DEFAULT true,
  last_scraped_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_funder_title_deadline UNIQUE(funder, title, deadline)
);

-- Table 4: grant_matches (Matching Engine Output)
CREATE TABLE grant_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  grant_id UUID NOT NULL REFERENCES grants(id) ON DELETE CASCADE,
  fit_score INTEGER CHECK (fit_score >= 0 AND fit_score <= 100),
  match_reasons JSONB DEFAULT '{}'::jsonb,
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_org_grant UNIQUE(org_id, grant_id)
);

-- Table 5: applications (Pipeline & Drafts)
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  grant_id UUID NOT NULL REFERENCES grants(id) ON DELETE CASCADE,
  status application_status_enum DEFAULT 'Exploring',
  draft_content TEXT,
  compliance_checklist JSONB DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ,
  outcome_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────
-- 3. Indexes for Performance
-- ────────────────────────────────────────────────────────
CREATE INDEX idx_grants_deadline ON grants(deadline) WHERE is_active = true;
CREATE INDEX idx_projects_org_id ON projects(org_id);
CREATE INDEX idx_matches_org_id ON grant_matches(org_id) WHERE is_dismissed = false;
CREATE INDEX idx_applications_org_id ON applications(org_id);
CREATE INDEX idx_applications_status ON applications(status);

-- ────────────────────────────────────────────────────────
-- 4. Row Level Security (RLS) policies
-- ────────────────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- A. Policies for "organizations"
CREATE POLICY "Users can manage their own organization profile" 
ON organizations 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- B. Policies for "projects"
CREATE POLICY "Users can manage projects belonging to their organization" 
ON projects 
FOR ALL 
USING (
  auth.uid() IN (
    SELECT user_id FROM organizations WHERE id = projects.org_id
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM organizations WHERE id = projects.org_id
  )
);

-- C. Policies for "grant_matches"
CREATE POLICY "Users can manage grant matches belonging to their organization" 
ON grant_matches 
FOR ALL 
USING (
  auth.uid() IN (
    SELECT user_id FROM organizations WHERE id = grant_matches.org_id
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM organizations WHERE id = grant_matches.org_id
  )
);

-- D. Policies for "applications"
CREATE POLICY "Users can manage applications belonging to their organization" 
ON applications 
FOR ALL 
USING (
  auth.uid() IN (
    SELECT user_id FROM organizations WHERE id = applications.org_id
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM organizations WHERE id = applications.org_id
  )
);

-- E. Policies for "grants" (Publicly active ones viewable, write-restricted to service_role)
CREATE POLICY "Authenticated users can view active grants" 
ON grants 
FOR SELECT 
USING (auth.role() = 'authenticated' AND is_active = true);
