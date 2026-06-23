# Document 05 — Backend Schema
**Seedling**

**Version:** 1.1  
**Prepared by:** Database Administrator / Lead Architect  
**Target Environment:** Supabase (PostgreSQL)  
**Depends on:** Seedling_PRD.md, Seedling_TRD.md, Seedling_AppFlow.md
**Changelog:** v1.1 — Added min_turnover_range and eligible_legal_entities to grants table (Issue 7).

## 1. Custom Enums (Types)
Create these PostgreSQL custom types before generating tables to ensure data integrity and prevent string-matching bugs.

* `legal_entity_enum`: 'Trust', 'Society', 'Section 8 Company', 'Unregistered'
* `turnover_bracket_enum`: '<10L', '10L-50L', '50L-1Cr', '>1Cr'
* `application_status_enum`: 'Exploring', 'Drafting', 'Submitted', 'Won', 'Rejected'
* `org_type_enum`: 'NGO', 'Research Group', 'Social Startup', 'Community Org'

## 2. Table Definitions

### Table 1: `organizations` (Tenant Profile)
The central profile for the user. Acts as the primary foreign key target for all isolated data.
* `id` (UUID, Primary Key, Default: `gen_random_uuid()`)
* `user_id` (UUID, Foreign Key → `auth.users.id`, Unique)
* `name` (Text, Not Null)
* `type` (`org_type_enum`, Not Null)
* `legal_entity_type` (`legal_entity_enum`)
* `location` (Text) — City, State
* `mission_statement` (Text) 
* `schedule_vii_causes` (Text Array) — e.g., ['Education', 'Healthcare']
* `geography_of_impact` (Text) — Local, State, National, International
* `target_beneficiaries` (Text)
* `team_size` (Integer)
* `has_audited_financials` (Boolean, Default: false)
* `annual_turnover_range` (`turnover_bracket_enum`)
* `has_12A_80G` (Boolean, Default: false)
* `has_fcra` (Boolean, Default: false)
* `ngo_darpan_id` (Text, Nullable)
* `csr_1_registration` (Text, Nullable)
* `funding_range_min` (Integer)
* `funding_range_max` (Integer)
* `funding_types_needed` (Text Array)
* `application_urgency` (Text) 
* `onboarding_step` (Integer, Default: 1) — Used to guard the linear onboarding flow
* `created_at` (Timestamptz, Default: `now()`)
* `updated_at` (Timestamptz, Default: `now()`)

### Table 2: `projects` (Memory Vault)
The historical work records used to feed the LLM draft generator.
* `id` (UUID, Primary Key, Default: `gen_random_uuid()`)
* `org_id` (UUID, Foreign Key → `organizations.id`, On Delete Cascade)
* `name` (Text, Not Null)
* `start_date` (Date)
* `end_date` (Date)
* `geography` (Text)
* `beneficiaries_count` (Integer)
* `beneficiary_type` (Text)
* `target_demographics` (Text Array) — e.g., ['SC/ST', 'BPL', 'Women']
* `activities` (Text)
* `outcomes` (Text)
* `sdg_alignment` (Text Array)
* `budget_used` (Numeric)
* `funding_source` (Text)
* `utilization_certificate_url` (Text, Nullable) — File path in Supabase Storage
* `created_at` (Timestamptz, Default: `now()`)
* `updated_at` (Timestamptz, Default: `now()`)

### Table 3: `grants` (Global Aggregation)
Shared global table populated exclusively by the Python scraping engine.
* `id` (UUID, Primary Key, Default: `gen_random_uuid()`)
* `title` (Text, Not Null)
* `funder` (Text, Not Null)
* `cause_areas` (Text Array)
* `schedule_vii_categories` (Text Array)
* `eligible_org_types` (Text Array)
* `funding_type_offered` (Text Array)
* `geography` (Text)
* `budget_min` (Numeric)
* `budget_max` (Numeric)
* `deadline` (Timestamptz)
* `requires_audited_financials` (Boolean, Default: false)
* `requires_12A_80G` (Boolean, Default: false)
* `requires_fcra` (Boolean, Default: false)
* `requires_ngo_darpan` (Boolean, Default: false)
* `requires_csr_1` (Boolean, Default: false)
* `min_turnover_range` (`turnover_bracket_enum`, Nullable) — Minimum turnover required; used in Pass 1 statutory filter
* `eligible_legal_entities` (Text Array) — e.g., ['Trust', 'Society']; used in Pass 1 statutory filter
* `description` (Text)
* `application_url` (Text)
* `required_documents` (Text Array)
* `source_portal` (Text)
* `is_active` (Boolean, Default: true) — Soft delete for stale grants
* `last_scraped_at` (Timestamptz, Default: `now()`)
* `created_at` (Timestamptz, Default: `now()`)
* **Constraint:** `UNIQUE(funder, title, deadline)` — Prevents scraper duplication.

### Table 4: `grant_matches` (Matching Engine Output)
Junction table populated by the Python matching engine.
* `id` (UUID, Primary Key, Default: `gen_random_uuid()`)
* `org_id` (UUID, Foreign Key → `organizations.id`, On Delete Cascade)
* `grant_id` (UUID, Foreign Key → `grants.id`, On Delete Cascade)
* `fit_score` (Integer) — 0 to 100
* `match_reasons` (JSONB) — E.g., `{"cause_match": true, "budget_match": false}`
* `is_dismissed` (Boolean, Default: false) — Hides the match from the UI without deleting the DB record
* `created_at` (Timestamptz, Default: `now()`)
* **Constraint:** `UNIQUE(org_id, grant_id)`

### Table 5: `applications` (Pipeline & Drafts)
The user's active grant applications and LLM-generated drafts.
* `id` (UUID, Primary Key, Default: `gen_random_uuid()`)
* `org_id` (UUID, Foreign Key → `organizations.id`, On Delete Cascade)
* `grant_id` (UUID, Foreign Key → `grants.id`, On Delete Cascade)
* `status` (`application_status_enum`, Default: 'Exploring')
* `draft_content` (Text)
* `compliance_checklist` (JSONB) — E.g., `{"has_audit": true, "word_count_met": false}`
* `submitted_at` (Timestamptz, Nullable)
* `outcome_notes` (Text, Nullable)
* `created_at` (Timestamptz, Default: `now()`)
* `updated_at` (Timestamptz, Default: `now()`)

## 3. Indexes for Performance
To ensure queries remain fast as the grants database and tenant data grows, create these B-Tree indexes:
* `CREATE INDEX idx_grants_deadline ON grants(deadline) WHERE is_active = true;`
* `CREATE INDEX idx_projects_org_id ON projects(org_id);`
* `CREATE INDEX idx_matches_org_id ON grant_matches(org_id) WHERE is_dismissed = false;`
* `CREATE INDEX idx_applications_org_id ON applications(org_id);`
* `CREATE INDEX idx_applications_status ON applications(status);`

## 4. Row Level Security (RLS) Rules (CRITICAL)
Supabase RLS must be enabled on all tables. These policies enforce strict tenant isolation.

* **`organizations` table:**
    * *Select/Update/Insert:* `auth.uid() = user_id`
* **`projects`, `grant_matches`, `applications` tables:**
    * *Select/Update/Insert/Delete:* Allow only where the `org_id` maps to the `organizations.id` owned by the currently authenticated user.
    * *SQL Policy Logic:* `auth.uid() IN (SELECT user_id FROM organizations WHERE id = org_id)`
* **`grants` table:**
    * *Select:* Authenticated users can view all `is_active = true` grants.
    * *Insert/Update/Delete:* Only allowed by the Service Role Key (used by the Python scraper backend).

## 5. Supabase Storage Buckets
* **Bucket Name:** `compliance-documents`
* **Access:** Private
* **RLS Policy:** Users can only upload, read, and delete files inside a folder matching their `org_id` (e.g., `compliance-documents/{org_id}/audit-2025.pdf`).
## 6. Entity Relationships (Cardinality)
Explicit mapping of how the tables connect to ensure the AI writes correct JOIN queries and Prisma/Supabase relations.

* **One-to-One (1:1)**
  * `auth.users.id` → `organizations.user_id` (One user account owns exactly one NGO profile)

* **One-to-Many (1:N)**
  * `organizations.id` → `projects.org_id` (One org can have many logged projects)
  * `organizations.id` → `applications.org_id` (One org can have many applications)
  * `grants.id` → `applications.grant_id` (One grant can have many applications from different orgs)

* **Many-to-Many (N:M) via Junction Table**
  * `organizations.id` ↔ `grant_matches` ↔ `grants.id` (Orgs match with many grants; Grants match with many orgs)

## 7. File Storage (Supabase Storage)
Defines where user-uploaded compliance and project files are kept, outside of the Postgres database.

* **Bucket:** `compliance-documents` (Private)
  * **Path Structure:** `/compliance/{org_id}/{document_type}_{timestamp}.pdf`
  * **Purpose:** Stores sensitive legal files (12A, 80G, CSR-1 certificates, Audited Financials).
  * **Access:** RLS restricted so an org can only read/write to their own `{org_id}` folder.

* **Bucket:** `project-assets` (Private)
  * **Path Structure:** `/projects/{org_id}/{project_id}/{file_name}`
  * **Purpose:** Stores project utilization certificates (UCs) and impact reports logged in the Memory Vault.
  * **Access:** RLS restricted to the owning `{org_id}`.