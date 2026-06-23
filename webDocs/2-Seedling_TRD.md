# Technical Requirements Document
**Seedling**

**Version:** 1.2  
**Status:** Updated Draft  
**Prepared by:** Lead Technical Architect  
**Last updated:** May 2026  
**Changelog:** Replaced Anthropic/OpenAI with Groq (primary) + Gemini 2.5 Flash-Lite (fallback). Replaced Railway with Render. Added Indian statutory compliance fields, two-pass matching logic, explicit `is_active` soft-delete flag, composite `UNIQUE` upsert key for grants, and Data Architecture clarification. v1.2 — Synced organizations table: added funding_types_needed, onboarding_step. Synced grant_matches: added is_dismissed.

## Overview
This TRD translates the Seedling PRD into concrete technical decisions, constraints, and specifications. It governs all engineering decisions for V1 of the platform — a web-based SaaS that automates grant discovery, matching, proposal drafting, and pipeline tracking for grassroots NGOs.

The system has two distinct runtime environments: a **React frontend** consumed by end users, and a **dual-backend architecture** where Node.js handles the API and application layer while Python handles the computationally intensive matching and LLM-based draft generation engine.

## Data Architecture Model
Seedling operates on a hybrid data isolation model:
* **Global Shared Data (Read-Only for Users):** The `grants` table is a single, global repository populated exclusively by the Python scraping engine. Grants are scraped once and shared across all users.
* **Tenant-Isolated Data (Strict RLS):** The `organizations`, `projects`, `grant_matches`, and `applications` tables are heavily isolated. Every row belongs to a specific `org_id`. This isolation is enforced at the database level by Supabase Row Level Security (RLS) policies. No org can ever read or write another org's data.

## Tech Stack

| Layer | Choice | Justification |
| :--- | :--- | :--- |
| **Frontend** | React.js (Vite) | Component-based architecture ideal for the dashboard-heavy, data-forward UI. Vite over CRA for significantly faster dev/build cycles. |
| **Backend — API Layer** | Node.js (Express.js) | Handles REST API, authentication middleware, Supabase interactions, cron scheduling, and all application-layer logic. |
| **Backend — Engine Layer** | Python (FastAPI) | Handles the matching algorithm, grant scraping pipeline, and LLM API calls for draft generation. |
| **Database** | PostgreSQL via Supabase | Relational structure fits the tightly linked entities. Supabase gives managed Postgres + built-in Row Level Security. |
| **Auth** | Supabase Auth | JWT-based auth with email/password. Integrates seamlessly with RLS policies. |
| **Hosting — Frontend** | Vercel | Zero-config React/Vite deployment, global CDN. Completely free on hobby tier. |
| **Hosting — Node.js API** | Render | Managed Node.js hosting with environment variable support. Free tier available. |
| **Hosting — Python Engine** | Render (separate service) | Python FastAPI deployed as a separate microservice. Communicates with Node.js API via internal HTTP. |

## Third-Party APIs

| API / Service | Purpose | Notes |
| :--- | :--- | :--- |
| **Groq API — llama-3.1-8b-instant** | Primary LLM for proposal draft generation. | Free. 14,400 requests/day. Fastest free inference available. Text-only calls. |
| **Google AI Studio — gemini-2.5-flash-lite** | Fallback LLM — triggered automatically on Groq 429 errors. | Free. 1,000 requests/day. |
| **Supabase REST & Realtime** | DB reads/writes and live pipeline updates. | Auto-generated from Postgres schema. Realtime powered by replication slots. |
| **Resend API** | Transactional email delivery for deadlines. | Free tier: 3,000 emails/month. |
| **GitHub Actions** | Scheduled cron job to trigger scraping. | Free for public repos. Triggers webhook to Python engine. |

## Key Libraries

* **Frontend:** `@supabase/supabase-js`, `@tanstack/react-query`, `react-router-dom`, `react-hook-form`, `zod`, `tailwindcss`, `@radix-ui/react-*`, `date-fns`, `recharts`, `lucide-react`.
* **Backend (Node.js):** `express`, `jsonwebtoken`, `node-cron`, `nodemailer`, `axios`, `zod`.
* **Engine (Python):** `fastapi`, `httpx`, `playwright`, `beautifulsoup4`, `groq`, `google-generativeai`, `supabase`, `pydantic`, `scikit-learn`, `tenacity` (backoff logic), `cachetools` (LLM caching).

## Database Schema (Core Tables)

```sql
-- Organizations (Tenant Profile)
organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  type text,                        
  legal_entity_type text,           
  location text,
  mission_statement text,           -- FIXED: Added for Onboarding Step 2
  schedule_vii_causes text[],       
  geography_of_impact text,
  target_beneficiaries text,
  team_size int,
  has_audited_financials boolean,
  annual_turnover_range text,       
  has_12A_80G boolean,
  has_fcra boolean,
  ngo_darpan_id text,               
  csr_1_registration text,          
  funding_range_min int,
  funding_range_max int,
  funding_types_needed text[],
  application_urgency text,         -- FIXED: Added for Onboarding Step 4
  onboarding_step int DEFAULT 1,   
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)

-- Logged Projects (Institutional Memory)
projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date,
  end_date date,
  geography text,
  beneficiaries_count int,
  beneficiary_type text,
  target_demographics text[],       -- SC/ST | BPL | PwD | Women/Children
  activities text,
  outcomes text,
  sdg_alignment text[],
  budget_used int,
  funding_source text,
  utilization_certificate_url text, 
  created_at timestamptz DEFAULT now()
)

-- Grant Listings (Aggregated by scraper — SHARED GLOBALLY)
grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  funder text,
  cause_areas text[],
  schedule_vii_categories text[],   -- Target Schedule VII causes
  eligible_org_types text[],
  funding_type_offered text[], -- Matches against org funding needs
  geography text,
  budget_min int,
  budget_max int,
  deadline date,
  
  -- Statutory requirements to enable Pass 1 Filtering
  requires_audited_financials boolean DEFAULT false,
  requires_12A_80G boolean DEFAULT false,
  requires_fcra boolean DEFAULT false,
  requires_ngo_darpan boolean DEFAULT false,
  requires_csr_1 boolean DEFAULT false,
  min_turnover_range text,         -- FIXED: Added back to TRD
  eligible_legal_entities text[],  -- FIXED: Added back to TRD
  
  description text,
  application_url text,
  required_documents text[],
  source_portal text,
  is_active boolean DEFAULT true,   -- Enables soft deletes for stale grants
  last_scraped_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  
  -- Upsert Key to prevent scraper duplication
  UNIQUE(funder, title, deadline)   
)

-- Grant Matches (Output of matching engine)
grant_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  grant_id uuid REFERENCES grants(id) ON DELETE CASCADE,
  fit_score int,                        -- 0–100
  match_reasons jsonb,    
  is_dismissed boolean DEFAULT false,   -- Soft deletes match from user dashboard          
  created_at timestamptz DEFAULT now(),
  UNIQUE(org_id, grant_id)
)

-- Applications (Pipeline tracker & drafts)
applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  grant_id uuid REFERENCES grants(id) ON DELETE CASCADE,
  status text DEFAULT 'exploring',  -- exploring | drafting | submitted | won | rejected
  draft_content text,
  compliance_checklist jsonb,       
  submitted_at timestamptz,
  outcome_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)



## System Architecture


┌─────────────────────────────────────────────────────────┐
│                    USER BROWSER                         │
│              React.js + Vite (Vercel)                   │
│         Supabase-js · React Query · Tailwind            │
└──────────────┬──────────────────────┬───────────────────┘
               │ REST API calls       │ Supabase Realtime
               ▼                      ▼
┌──────────────────────┐    ┌─────────────────────────────┐
│   NODE.JS API        │    │      SUPABASE               │
│   Express.js         │◄──►│   PostgreSQL + Auth         │
│   (Railway/Render)   │    │   Row Level Security        │
│                      │    │   Realtime subscriptions    │
│ - Auth middleware    │    └─────────────────────────────┘
│ - Org/profile CRUD   │        ▲
│ - Application CRUD   │        │ upsert scraped grants
│ - Pipeline tracking  │        │ read org profiles
│ - Cron: email alerts │        │
└──────────┬───────────┘        │
           │ internal HTTP      │
           ▼                    │
┌──────────────────────────────────────────────────────────┐
│              PYTHON ENGINE (FastAPI)                     │
│                  (Railway/Render)                        │
│                                                          │
│  ┌─────────────────┐   ┌──────────────────────────────┐  │
│  │ SCRAPING        │   │ MATCHING ENGINE              │  │
│  │ PIPELINE        │   │                              │  │
│  │                 │   │ - Weighted scoring           │  │
│  │ httpx +         │   │ - TF-IDF cause alignment     │  │
│  │ BeautifulSoup   │   │ - Statutory rule checks      │  │
│  │ Playwright      │   │ - Fit Score generation       │  │
│  │ GitHub Actions  │   │ - Match reason tagging       │  │
│  │ (daily cron)    │   └──────────────┬───────────────┘  │
│  └─────────────────┘                  │                  │
│                          ┌────────────▼───────────────┐  │
│                          │ DRAFT GENERATION ENGINE    │  │
│                          │                            │  │
│                          │ - Pulls org profile        │  │
│                          │ - Pulls grant requirements │  │
│                          │ - Constructs LLM prompt    │  │
│                          │ - Calls Groq (primary)     │  │
│                          │   → 429? fallback to       │  │
│                          │     Gemini Flash-Lite      │  │
│                          │ - Returns structured draft │  │
│                          └────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘



## API Routes (Node.js)

**Auth:** `POST /auth/signup`, `POST /auth/login`, `POST /auth/logout`

**Organization:** `POST /org/profile`, `GET /org/profile`, `PATCH /org/profile`

**Projects:** `POST /org/projects`, `GET /org/projects`, `PATCH /org/projects/:id`, `DELETE /org/projects/:id`

**Grants:** `GET /grants`, `GET /grants/:id`, `GET /grants/matches`

**Applications:** `POST /applications`, `GET /applications`, `GET /applications/:id`, `PATCH /applications/:id`

**Engine (Proxy):** `POST /engine/match`, `POST /engine/draft`

## Backend & AI Matching Engine Rules

* **Python Matching Logic:** The matching algorithm must use a two-pass system:
1. **Pass 1 (Hard Statutory Filter):** Filter out any grants where the org lacks the mandatory statutory compliance (e.g., if the `grants` record requires `requires_csr_1: true`, and the org profile has `csr_1_registration: null` -> Drop grant entirely).
2. **Pass 2 (Semantic Scoring):** Run the TF-IDF/LLM semantic match on the remaining *legally eligible* grants based on Mission, Schedule VII causes, and SDG alignment.



## Environment Variables

**React Frontend (.env):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL`

**Node.js API (.env):** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `JWT_SECRET`, `PYTHON_ENGINE_URL`, `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`, `CRON_SCHEDULE_REMINDERS`, `NODE_ENV`, `PORT`

**Python Engine (.env):** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`, `GOOGLE_AI_STUDIO_API_KEY`, `NODE_API_URL`, `GITHUB_ACTIONS_WEBHOOK_SECRET`, `PLAYWRIGHT_HEADLESS`, `LLM_CACHE_TTL_SECONDS`, `PORT`

## Hard Technical Constraints

1. **Org-level data isolation is non-negotiable.** Every database table that stores org-specific data must have Row Level Security (RLS) enabled in Supabase with policies restricting reads and writes to the authenticated org's own records only.
2. **The Python engine is internal-only.** The FastAPI Python service must not be publicly accessible. It communicates exclusively with the Node.js API via internal HTTP on a private network or with a shared secret header (`X-Internal-Key`).
3. **LLM calls use a two-tier fallback chain with caching and rate limiting.** Draft generation uses Groq (`llama-3.1-8b-instant`). If Groq returns a 429, the system falls back to Google AI Studio (`gemini-2.5-flash-lite`). Unique requests are cached via `cachetools`. Rate-limited per org at max 10 drafts/hour.
4. **Scraping must be non-destructive.** The grant aggregation engine must upsert grant records using the `UNIQUE(funder, title, deadline)` constraint. Stale grants are soft-deleted by updating `is_active = false`.
5. **No sensitive data in environment variables on the frontend.** The React app has access only to `VITE_SUPABASE_ANON_KEY` and `VITE_SUPABASE_URL`.
6. **All API routes are authenticated.** Every Node.js API route (except `/auth/signup` and `/auth/login`) must validate the Supabase JWT.
7. **Python dependencies must be pinned. Scraping is triggered by GitHub Actions.** The scraping pipeline is triggered daily by a GitHub Actions cron job sending an authenticated POST request to `/scrape/trigger` on the Python engine.
8. **The frontend must be fully functional without the Python engine.** If the Python engine is unavailable, the React frontend and Node.js API must degrade gracefully.
9. **All timestamps are stored in UTC.** Timezone conversion to the user's local time happens exclusively on the frontend using `date-fns`.
10. **V1 targets India-based grant sources only.** The scraping pipeline covers DST, Ministry of Social Justice, BIRAC, Tata Trusts, Ford Foundation, Infosys Foundation CSR, UN Women India, UNDP India. Global grant coverage is out of scope for V1.

## LLM Strategy & Free Tier Management

**Provider Chain**

1. User clicks "Generate Draft" -> Python engine builds prompt.
2. Check response cache (`cachetools`, keyed by hash of org_id + grant_id).
3. Cache miss → Call Groq API (`llama-3.1-8b-instant`).
4. 429 Rate Limited (tenacity backoff) → Call Gemini API (`gemini-2.5-flash-lite`).
5. Store in cache → Return structured draft to Node.js → Frontend.

**Quota Protection Rules**

* **Cache first** — Every draft is cached by `(org_id + grant_id)` hash.
* **Per-org rate limit** — Maximum 10 draft generation calls per org per hour enforced at the Node.js API layer.
* **Request queuing** — The Python engine processes draft requests sequentially.
* **Exponential backoff** — Handled by `tenacity` (1s, 2s, 4s, 8s).
* **Logging** — Every LLM call logs: timestamp, org_id, grant_id, provider used, tokens consumed, latency.

*Note on Gemini Free Tier Data Policy: Google's free tier (AI Studio) may use prompt data to improve their models. Since Seedling's draft generation prompts contain org profile details, this should be disclosed to users on the draft generation UI. Post-hackathon, switching to Gemini's paid tier ($0.075/1M tokens for Flash-Lite) eliminates data sharing entirely.*