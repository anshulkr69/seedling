import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || supabaseUrl === 'https://your-project-ref.supabase.co' || !supabaseAnonKey || supabaseAnonKey === 'your-anon-key-here') {
  console.warn('Missing or default VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY in environment variables. Please configure client/.env.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

export const isMockMode = false

// Type definitions for our tables
export interface Organization {
  id: string
  user_id: string
  name: string
  type: 'NGO' | 'Research Group' | 'Social Startup' | 'Community Org'
  legal_entity_type?: 'Trust' | 'Society' | 'Section 8 Company' | 'Unregistered'
  location?: string
  mission_statement?: string
  schedule_vii_causes?: string[]
  geography_of_impact?: 'Local' | 'State' | 'National' | 'International'
  target_beneficiaries?: string
  team_size?: number
  has_audited_financials?: boolean
  annual_turnover_range?: '<10L' | '10L-50L' | '50L-1Cr' | '>1Cr'
  has_12A_80G?: boolean
  has_fcra?: boolean
  ngo_darpan_id?: string
  csr_1_registration?: string
  funding_range_min?: number
  funding_range_max?: number
  funding_types_needed?: string[]
  application_urgency?: 'Actively looking' | 'Planning ahead'
  onboarding_step: number
  created_at?: string
  updated_at?: string
}

export interface Grant {
  id: string
  title: string
  funder: string
  cause_areas: string[]
  schedule_vii_categories: string[]
  eligible_org_types: string[]
  funding_type_offered: string[]
  geography: string
  budget_min: number
  budget_max: number
  deadline: string
  requires_audited_financials: boolean
  requires_12A_80G: boolean
  requires_fcra: boolean
  requires_ngo_darpan: boolean
  requires_csr_1: boolean
  min_turnover_range?: '<10L' | '10L-50L' | '50L-1Cr' | '>1Cr'
  eligible_legal_entities?: string[]
  description: string
  application_url: string
  required_documents: string[]
  source_portal: string
  is_active: boolean
  last_scraped_at: string
  created_at: string
}

export interface GrantMatch {
  id: string
  org_id: string
  grant_id: string
  fit_score: number
  match_reasons: {
    cause_match: boolean
    budget_match: boolean
    location_match: boolean
    compliance_match: boolean
    reasons: string[]
    advisories?: string[]
  }
  is_dismissed: boolean
  created_at: string
}

export interface Application {
  id: string
  org_id: string
  grant_id: string
  status: 'Exploring' | 'Drafting' | 'Submitted' | 'Won' | 'Rejected'
  draft_content?: string
  compliance_checklist: Record<string, boolean>
  submitted_at?: string
  outcome_notes?: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  org_id: string
  name: string
  start_date?: string
  end_date?: string
  geography?: string
  beneficiaries_count?: number
  beneficiary_type?: string
  target_demographics?: string[]
  activities?: string
  outcomes?: string
  sdg_alignment?: string[]
  budget_used?: number
  funding_source?: string
  utilization_certificate_url?: string
  created_at: string
  updated_at: string
}

// Global list of mock grants for testing
export const MOCK_GRANTS: Grant[] = [
  {
    id: 'g-1',
    title: 'National Science & Technology Fellowship 2026',
    funder: 'Department of Science & Technology (DST)',
    cause_areas: ['Education', 'Rural Development'],
    schedule_vii_categories: ['Education', 'Rural Development'],
    eligible_org_types: ['Research Group', 'NGO'],
    funding_type_offered: ['Research', 'Equipment'],
    geography: 'National',
    budget_min: 500000,
    budget_max: 2500000,
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days
    requires_audited_financials: true,
    requires_12A_80G: true,
    requires_fcra: false,
    requires_ngo_darpan: true,
    requires_csr_1: false,
    min_turnover_range: '10L-50L',
    eligible_legal_entities: ['Trust', 'Society', 'Section 8 Company'],
    description: 'Supports advanced community-led field studies, scientific investigations, and prototyping for grassroots issues in rural India.',
    application_url: 'https://dst.gov.in/grants',
    required_documents: ['Registration certificate', 'Audited financials (last 2 years)', 'NGO Darpan ID', 'Project proposal'],
    source_portal: 'DST India',
    is_active: true,
    last_scraped_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: 'g-2',
    title: 'Socio-Economic Rural Livelihoods Grant',
    funder: 'Tata Trusts',
    cause_areas: ['Rural Development', 'Healthcare'],
    schedule_vii_categories: ['Rural Development', 'Healthcare'],
    eligible_org_types: ['NGO', 'Community Org'],
    funding_type_offered: ['Project', 'Operational'],
    geography: 'State',
    budget_min: 1000000,
    budget_max: 5000000,
    deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days
    requires_audited_financials: true,
    requires_12A_80G: true,
    requires_fcra: false,
    requires_ngo_darpan: true,
    requires_csr_1: false,
    min_turnover_range: '10L-50L',
    eligible_legal_entities: ['Trust', 'Society', 'Section 8 Company'],
    description: 'Focuses on augmenting rural household income through sustainable farming, water storage infrastructure, and local healthcare worker support.',
    application_url: 'https://tatatrusts.org/funding',
    required_documents: ['Registration certificate', 'Audited financials (last 2 years)', 'NGO Darpan ID', '12A/80G Certificate'],
    source_portal: 'Tata Trusts Portal',
    is_active: true,
    last_scraped_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: 'g-3',
    title: 'Corporate Environment & Sustainability Mandate 2026',
    funder: 'Infosys Foundation CSR',
    cause_areas: ['Environment', 'Rural Development'],
    schedule_vii_categories: ['Environment', 'Rural Development'],
    eligible_org_types: ['NGO', 'Social Startup'],
    funding_type_offered: ['Project', 'Equipment'],
    geography: 'State',
    budget_min: 2500000,
    budget_max: 10000000,
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days
    requires_audited_financials: true,
    requires_12A_80G: true,
    requires_fcra: false,
    requires_ngo_darpan: false,
    requires_csr_1: true,
    min_turnover_range: '50L-1Cr',
    eligible_legal_entities: ['Section 8 Company', 'Trust', 'Society'],
    description: 'Corporate social responsibility funds allocated for community forestry, lake rejuvenation, solar micro-grids, and climate action models.',
    application_url: 'https://infosys.com/about/corporate-responsibility',
    required_documents: ['Registration certificate', 'CSR-1 Registration', 'Audited financials (last 2 years)', '12A/80G Certificate'],
    source_portal: 'Infosys CSR Portal',
    is_active: true,
    last_scraped_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: 'g-4',
    title: 'South Asia Women Empowerment Stipend',
    funder: 'UN Women India',
    cause_areas: ['Women Empowerment', 'Education'],
    schedule_vii_categories: ['Women Empowerment', 'Education'],
    eligible_org_types: ['NGO', 'Research Group', 'Community Org'],
    funding_type_offered: ['Project', 'Travel', 'Operational'],
    geography: 'National',
    budget_min: 300000,
    budget_max: 1500000,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    requires_audited_financials: false,
    requires_12A_80G: false,
    requires_fcra: true,
    requires_ngo_darpan: false,
    requires_csr_1: false,
    min_turnover_range: '<10L',
    eligible_legal_entities: ['Trust', 'Society', 'Section 8 Company', 'Unregistered'],
    description: 'Direct global support to enable capacity-building, vocational schooling, and leadership training camps led by grassroots collectives.',
    application_url: 'https://unwomen.org/en/about-us/funding',
    required_documents: ['Project description', 'Budget breakdown', 'FCRA Certificate'],
    source_portal: 'UN Women Gateway',
    is_active: true,
    last_scraped_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: 'g-5',
    title: 'Heritage Preservation & Rural Crafts Fund',
    funder: 'Ministry of Culture, India',
    cause_areas: ['Heritage', 'Rural Development'],
    schedule_vii_categories: ['Heritage', 'Rural Development'],
    eligible_org_types: ['NGO', 'Community Org'],
    funding_type_offered: ['Project', 'Equipment'],
    geography: 'Local',
    budget_min: 200000,
    budget_max: 800000,
    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
    requires_audited_financials: false,
    requires_12A_80G: true,
    requires_fcra: false,
    requires_ngo_darpan: true,
    requires_csr_1: false,
    min_turnover_range: '<10L',
    eligible_legal_entities: ['Trust', 'Society', 'Section 8 Company'],
    description: 'Promotes preservation of historical local handicrafts, weaving clusters, and folklore performance archives.',
    application_url: 'https://indiaculture.gov.in',
    required_documents: ['Registration certificate', 'NGO Darpan ID', '12A/80G Certificate'],
    source_portal: 'Govt Culture Portal',
    is_active: true,
    last_scraped_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  }
]
