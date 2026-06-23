Document 03 — App Flow Document
Seedling
Version: 1.2
Prepared by: UX Researcher
Last updated: May 2026
Depends on: Seedling_PRD.md (v1.1), Seedling_TRD.md (v1.2)
Changelog: v1.1 — Added two-pass matching documentation (statutory hard-filter + AI fit score). Added statutory compliance status UI to Grant Detail. Added target_demographics, sdg_alignment, and utilization_certificate_url fields to Memory Vault project form. Updated /grants page load to document that displayed grants have already cleared Pass 1.

1. Pages List
All screens, their URL paths, and access level.

# Screen Name | Path | Access
01 | Landing Page | / | Public
02 | Sign Up | /signup | Public (redirect if logged in)
03 | Log In | /login | Public (redirect if logged in)
04 | Email Verification Pending | /verify-email | Public
05 | Onboarding — Step 1: Org Identity | /onboarding/identity | Auth required, profile incomplete
06 | Onboarding — Step 2: Mission & Cause | /onboarding/mission | Auth required, profile incomplete
07 | Onboarding — Step 3: Capacity & Compliance | /onboarding/capacity | Auth required, profile incomplete
08 | Onboarding — Step 4: Funding Needs | /onboarding/funding | Auth required, profile incomplete
09 | Onboarding — Complete | /onboarding/complete | Auth required, profile incomplete
10 | Dashboard | /dashboard | Auth required, profile complete
11 | Find Grants | /grants | Auth required, profile complete
12 | Grant Detail | /grants/:id | Auth required, profile complete
13 | My Applications (Pipeline) | /applications | Auth required, profile complete
14 | Application Detail & Draft Editor | /applications/:id | Auth required, profile complete
15 | Memory Vault | /vault | Auth required, profile complete
16 | Log New Project | /vault/new | Auth required, profile complete
17 | Project Detail | /vault/:id | Auth required, profile complete
18 | Org Profile & Settings | /settings | Auth required, profile complete
19 | 404 — Not Found | /404 | Public
20 | 500 — Server Error | /error | Public

2. Navigation Type
Primary Navigation — Organic Side Panel
The main navigation is a persistent left side panel rendered inside the authenticated app shell. It is present on all screens from /dashboard onward and is never shown on public or onboarding screens.
Design behaviour:

The panel width is fixed at 240px on desktop. On mobile (<768px) it collapses into a bottom navigation bar with icon-only labels.
Active states are indicated by a subtle organic blob shape rendered behind the active nav item — not a hard-edged left border or background rectangle. The blob is an irregular, softly rounded SVG shape drawn in the Accent Tint token (#EAF2E0 in light mode, rgba(74, 124, 37, 0.15) in dark mode), giving the impression that the item is nestled into a natural form rather than highlighted by a UI element.
Inactive items are #888888 at 13px General Sans weight 500. On hover, color shifts to #0A0A0A with a gentle 150ms transition. No blob on hover — only on active.
The panel is divided into three labelled sections with General Sans 10px uppercase spaced labels in #AAAAAA: DISCOVER, MANAGE, ACCOUNT.
Navigation items and their paths:

DISCOVER
  ├── Dashboard          →  /dashboard
  └── Find Grants        →  /grants

MANAGE
  ├── My Applications    →  /applications
  └── Memory Vault       →  /vault

ACCOUNT
  └── Profile & Settings →  /settings

Seedling wordmark sits at the top of the panel in Satoshi 16px weight 700, #0A0A0A. Clicking it navigates to /dashboard.

Floating Action Button — New Application
The "New Application" action is intentionally excluded from the side panel navigation. It is surfaced as a prominent circular floating action button (FAB) anchored to the bottom-right corner of the app interface, 24px from the right edge and 24px from the bottom edge.
Design behaviour:

Shape: a circle with a slight organic irregularity — not a perfect circle but a seed-like rounded shape achieved via border-radius: 60% 40% 55% 45% / 50% 45% 55% 50% giving it a subtle living, organic feel.
Size: 56px × 56px.
Background: #2D5016 (moss green). On hover: #1E3810.
Icon: a + or sprout icon in white, 22px.
Tooltip on hover: "Start New Application" in General Sans 12px, appearing above the button.
The FAB is visible on all authenticated screens except the Application Detail & Draft Editor (/applications/:id) where the action is already contextually available within the page.
On mobile, the FAB shifts to sit above the bottom navigation bar.
Tapping the FAB opens a Grant Picker modal (full-screen overlay on mobile, 600px centered modal on desktop) — user selects the grant they want to apply for, then the system creates a new application record and navigates to /applications/:id.

Secondary Navigation — Onboarding Step Indicator
During onboarding (/onboarding/*), the side panel is hidden entirely. Navigation is replaced by a top-mounted linear step progress indicator showing steps 1–4 with organic connector lines between them. Completed steps are filled moss green. Current step is outlined in moss green. Future steps are #E8E8E8.

3. First Screen
Path: /
Access: Public
The landing page is the first thing any unauthenticated visitor sees. It is a single long-scroll page structured as follows:

Section 1 — Hero (black background #0A0A0A)
Full-width black section, 120px vertical padding. Left-aligned content.
Wordmark "Seedling" top-left, nav links center, "Sign in" + "Get started" top-right.
H1: "From scattered grants to funded missions." (Satoshi 64px weight 700, white)
Subheading: "Seedling finds every grant you qualify for, drafts your proposals, and tracks your pipeline — automatically." (General Sans 17px, #888888)
Two CTAs: "Get started free" (primary moss green button) → navigates to /signup | "See how it works →" (ghost white button) → smooth scrolls to Section 2.

Section 2 — Stats bar (white background)
Three stat callouts in a row:
20+ grant sources aggregated daily
3 weeks → 3 hrs average discovery time
Zero missed deadlines

Section 3 — The Problem (white background)
Eyebrow label: "THE PROBLEM"
Heading: "Grant hunting is broken."
Three cards: Discovery Chaos / Written from Zero / No Memory.

Section 4 — How It Works (light gray #F5F5F5 background)
Step-by-step visual flow of the 8-step workflow (org profile → memory vault).

Section 5 — CTA Banner (black background)
"Ready to stop searching and start winning?"
Single CTA: "Get started free" → /signup
Footer: Logo, nav links, copyright.

4. Auth Flow

/signup
   │
   ├── User enters: name, email, password
   ├── Supabase Auth creates user record
   ├── Supabase sends verification email (via Resend)
   │
   └──→ /verify-email  [Email Verification Pending screen]
              │
              ├── Screen shows: "Check your inbox — we've sent a
              │   verification link to {email}."
              ├── Resend link CTA (rate limited: once per 60s)
              │
              └── User clicks link in email
                       │
                       ├── Supabase verifies token
                       ├── Session created, user marked as verified
                       │
                       └──→ /onboarding/identity  [Step 1 of 4]

Onboarding Flow (4 Steps)
Onboarding is a linear, non-skippable flow. The user cannot access any core app screen until all 4 steps are completed and the org profile is written to Supabase. Each step saves to the database on "Continue" — progress is preserved if the user closes the browser mid-onboarding.

/onboarding/identity  [Step 1 — Org Identity]
   │
   ├── Fields:
   │     Org name (text, required)
   │     Org type (dropdown: NGO / Research Group / Social Startup / Community Org)
   │     Legal Entity Type (dropdown: Trust / Society / Section 8 Company / Unregistered)
   │     Registration Number & State (text, conditional — shown unless Unregistered)
   │     Year founded (number)
   │     Location — City, State (text)
   │
   └──→ /onboarding/mission  [Step 2 — Mission & Cause]
              │
              ├── Fields:
              │     Mission statement (textarea, max 300 chars)
              │     Cause areas (multi-select tag mapped to Schedule VII: Education /
              │       Environment / Healthcare / Women Empowerment /
              │       Rural Development / Heritage / Other)
              │     Geography of impact (radio: Local / State / National / International)
              │     Primary beneficiaries (text: who does your work serve?)
              │
              └──→ /onboarding/capacity  [Step 3 — Capacity & Compliance]
                         │
                         ├── Fields:
                         │     Team size (number stepper)
                         │     Has audited financials (toggle: Yes / No)
                         │     Annual turnover range (dropdown: <10L / 10L-50L / 50L-1Cr / >1Cr)
                         │     Has 12A/80G registration — India (toggle: Yes / No)
                         │     Has FCRA certification (toggle: Yes / No)
                         │     NGO Darpan ID (optional, text: highly recommended for Govt grants)
                         │     CSR-1 Registration Number (optional, text: mandatory for receiving CSR funds)
                         │     Past grants received (optional, text: mention any)
                         │
                         └──→ /onboarding/funding  [Step 4 — Funding Needs]
                                    │
                                    ├── Fields:
                                    │     Typical grant size needed
                                    │       (range slider: ₹1L–₹5L / ₹5L–₹25L /
                                    │        ₹25L–₹1Cr / ₹1Cr+)
                                    │     Funding type needed
                                    │       (multi-select: Project / Operational /
                                    │        Research / Travel / Equipment)
                                    │     Application urgency
                                    │       (radio: Actively looking / Planning ahead)
                                    │
                                    └──→ /onboarding/complete  [Completion screen]
                                               │
                                               ├── Screen shows:
                                               │     Animated sprout illustration
                                               │     "Your Seedling profile is ready."
                                               │     "We've matched {N} grants to get
                                               │      you started."
                                               │
                                               ├── Node.js API triggers Python matching
                                               │   engine in background (async).
                                               │
                                               │   ── TWO-PASS MATCHING SEQUENCE ──────
                                               │   PASS 1 — Statutory Hard Filter:
                                               │     Python engine reads org compliance
                                               │     fields: 12A/80G, NGO Darpan ID,
                                               │     CSR-1, FCRA, annual turnover range,
                                               │     legal entity type, Schedule VII
                                               │     cause alignment.
                                               │     Any grant whose statutory
                                               │     prerequisites the org does NOT
                                               │     meet is EXCLUDED entirely —
                                               │     it never reaches Pass 2 and
                                               │     never appears in the user's list.
                                               │     This gate runs before any AI
                                               │     scoring logic executes.
                                               │
                                               │   PASS 2 — AI Fit Score:
                                               │     Grants that cleared Pass 1 are
                                               │     scored on 5 weighted factors:
                                               │       · Cause alignment (Schedule VII)
                                               │       · Geography fit
                                               │       · Budget range overlap
                                               │       · Capacity match
                                               │         (audited financials, team size)
                                               │       · Deadline viability
                                               │     TF-IDF semantic scoring on cause
                                               │     area text + org mission statement.
                                               │     Output: Fit Score 0-100 +
                                               │     match_reasons JSONB per grant.
                                               │   ────────────────────────────────────
                                               │
                                               └──→ /dashboard

Login Flow
/login
   │
   ├── User enters: email + password
   ├── Supabase Auth validates credentials
   │
   ├── [If unverified] → /verify-email
   ├── [If verified, profile incomplete] → /onboarding/identity
   └── [If verified, profile complete] → /dashboard

Password Reset (from /login)
"Forgot password?" link on /login
   │
   └──→ Modal overlay: enter email
              │
              └── Supabase sends reset link via email
                       │
                       └── User clicks link → password reset form
                                  │
                                  └──→ /login  (with success toast)

5. Core User Journey 1 — Finding and Matching a Grant
Entry points: Side panel "Find Grants" → /grants | Dashboard "Browse Matches" CTA

/grants  [Find Grants page]
   │
   ├── PAGE LOAD:
   │     Node.js API calls GET /grants/matches
   │     Python engine returns pre-computed ranked matches for this org.
   │     (Matching runs on profile save + once daily via GitHub Actions cron)
   │
   │     ── TWO-PASS FILTER ALREADY APPLIED ─────────────────────────
   │     All grants shown here have already passed BOTH:
   │       Pass 1 — Statutory Hard Filter (ran at match-compute time)
   │         Grants requiring statutory credentials the org lacks
   │         (e.g. NGO Darpan for Govt grants, CSR-1 for CSR funds,
   │          12A/80G for tax-exempt donations, FCRA for foreign funds,
   │          Schedule VII cause alignment for CSR eligibility)
   │         are NEVER shown. They do not appear as low-scoring rows.
   │         They are absent entirely.
   │       Pass 2 — AI Fit Score (determines rank order)
   │         Only grants that cleared Pass 1 receive a Fit Score.
   │     ────────────────────────────────────────────────────────────
   │
   │
   ├── DEFAULT VIEW:
   │     Page title: "Find Grants"
   │     Subtitle: "Showing {N} matched grants based on your profile."
   │
   │     Search bar (full width): placeholder "Search by funder, cause, or keyword..."
   │     Filter chips: Cause Area ▾ | Location ▾ | Budget Range ▾ | Deadline ▾
   │
   │     Grant results table:
   │     Columns: Grant Name | Funder | Cause Area | Budget | Fit Score | Deadline | Status
   │
   │     ── AI FIT SCORE (key UI element) ──────────────────────────────
   │     Each row displays a Fit Score pill:
   │       90–100%  →  deep moss green pill  (#2D5016 bg, white text) — "Strong Match"
   │       70–89%   →  lighter moss pill     (#EAF2E0 bg, #2D5016 text) — "Good Match"
   │       50–69%   →  amber pill            (#FEF3E2 bg, #9A5B00 text) — "Partial Match"
   │       <50%     →  not shown by default  (filtered out unless user removes filter)
   │
   │     Hovering a row reveals: "View Details →" and "Apply →" actions
   │     ────────────────────────────────────────────────────────────────
   │
   ├── SEARCH / FILTER:
   │     Typing in search bar filters rows client-side in real time
   │     Filter chips open dropdown panels with checkbox options
   │     Active filters shown as dismissible chips below the search bar
   │     "Clear all filters" link resets to default matched view
   │
   ├── User clicks a grant row
   │
   └──→ /grants/:id  [Grant Detail page]
              │
              ├── LEFT PANEL (42% width) — Grant Detail:
              │     Back link: "← Back to results"
              │     Grant name (Satoshi 28px weight 700)
              │     Funder name (General Sans 14px, muted)
              │
              │     ── STATUTORY COMPLIANCE STATUS ──────────────────────
              │     Shown ABOVE the Fit Score card. Always present.
              │     Since grants displayed here have already passed the
              │     statutory filter, this section confirms which credentials
              │     qualified the org for this grant, and warns about
              │     credentials that are borderline or recommended:
              │
              │     CASE A — Full statutory clearance:
              │       Green banner:
              │       "✓ Your organisation meets all statutory requirements
              │          for this grant."
              │       Credential pills (all green):
              │         ✓ NGO Darpan registered
              │         ✓ 12A/80G certified
              │         ✓ Schedule VII: Education aligned
              │         ✓ Turnover within required range
              │
              │     CASE B — Statutory passed but advisory warnings exist:
              │       Amber advisory banner (not a block — grant still shown):
              │       "⚠ You qualify for this grant, but note:"
              │       Advisory pills:
              │         ⚠ CSR-1 registration recommended for this funder
              │            → tooltip: "Some CSR funders prefer CSR-1 registered
              │               organisations. Not mandatory but improves chances."
              │         ⚠ FCRA not held — this grant has foreign funding
              │            → tooltip: "You can accept this grant only via
              │               an FCRA-registered intermediary."
              │
              │     CASE C — Grant requires a credential the org just added
              │     (profile updated after last match run, match is stale):
              │       Blue info banner:
              │       "ℹ Your profile was updated. Refresh matches to recheck
              │          statutory eligibility for this grant."
              │       [Refresh Eligibility button]
              │     ────────────────────────────────────────────────────────
              │
              │     ── AI FIT SCORE CALLOUT ────────────────────────────
              │     Shown BELOW statutory status. Always present.
              │     Large card displaying:
              │       "{score}% Match"  (Satoshi 36px, moss green)
              │       "Matched on: {reasons}"
              │         e.g. "cause area · org size · location · budget range"
              │       Each matched factor shown as a small green tick pill.
              │       Soft unmatched factors (non-statutory) shown as amber
              │       warning pills with tooltip:
              │         e.g. "⚠ Requires audited financials — update your
              │               profile if you have these."
              │       Note: Hard statutory mismatches are NEVER shown here
              │       as amber pills — they are filtered out in Pass 1 and
              │       the grant is never displayed. Only soft mismatches
              │       (non-blocking, advisory) appear as amber pills.
              │     ────────────────────────────────────────────────────
              │
              │     Detail rows:
              │       Budget: ₹{min} – ₹{max}
              |       Funding Type: {types} (e.g., Project, Operational)
              │       Deadline: {date}  + countdown badge "X days left"
              │       Geography: {scope}
              │       Eligible orgs: {types}
              │       Focus areas: {tags}
              │       Required documents: {checklist preview}
              │
              │     External link: "View original grant listing ↗"
              │
              └── RIGHT PANEL (58% width) — Actions:
                      │
                      ├── "Start Application" button (primary moss green, full width)
                      │     → Creates application record in Supabase
                      │     → Navigates to /applications/:id
                      │
                      ├── "Save for Later" button (ghost)
                      │     → Saves grant to a watchlist in the org's dashboard
                      │
                      └── "Dismiss Match" button (ghost, text-red/muted)
                            → Updates grant_matches.is_dismissed to true
                            → Redirects user back to /grants feed

6. Core User Journey 2 — Generating a Draft
Entry points: /grants/:id "Start Application" button | FAB → Grant Picker modal | /applications "Resume Draft" row action

/applications/:id  [Application Detail & Draft Editor]
   │
   ├── PAGE LAYOUT — Split panel (same as Grant Detail):
   │     Left panel:  Grant summary + Compliance Checklist
   │     Right panel: Draft Proposal editor
   │
   ├── LEFT PANEL — Grant Summary + Compliance:
   │     Grant name, funder, deadline countdown
   │     Application status pill (Exploring / Drafting / Submitted / Won / Rejected)
   │
   │     ── COMPLIANCE CHECKLIST ──────────────────────────────────────
   │     Auto-generated on application creation.
   │     Title: "Submission Checklist"
   │     Each item shows a checkbox + label + optional tooltip:
   │
   │       ☐ Registration certificate
   │       ☐ Audited financials (last 2 years)
   │       ☐ Proposal within word limit ({N} words)
   │       ☐ Budget breakdown included
   │       ☐ Impact metrics section present
   │       ☐ Correct file format ({format} required)
   │       ☐ All mandatory annexures attached
   │
   │     Checked items turn moss green with a filled checkbox.
   │     Unchecked items remain `#888888`.
   │
   │     Completion progress bar below checklist:
   │       "{N}/{total} items complete"
   │     The "Mark as Submitted" button remains DISABLED until
   │     all checklist items are checked — enforced in UI state.
   │     ────────────────────────────────────────────────────────────
   │
   └── RIGHT PANEL — Draft Proposal Editor:
              │
              ├── INITIAL STATE (no draft yet):
              │     Empty textarea with placeholder:
              │       "Your draft will appear here."
              │     "Generate Draft" button (primary, full width, moss green)
              │       Subtext: "Generated from your profile + matched past projects"
              │
              ├── User clicks "Generate Draft"
              │
              ├── LOADING STATE:
              │     Button replaced by loading indicator:
              │       Animated sprout icon + "Planting your draft..."
              │     Panel dims slightly, textarea shows skeleton lines
              │
              ├── ── LLM GENERATION SEQUENCE ────────────────────────────
              │   Node.js API receives POST /engine/draft
              │   Python engine:
              │     1. Checks response cache (org_id + grant_id hash)
              │     2. Cache miss → builds prompt from org profile + grant data
              │     3. Calls Groq API (llama-3.1-8b-instant)
              │     4. [If Groq 429] → exponential backoff → falls back to
              │        Gemini 2.5 Flash-Lite (see Error States section)
              │     5. Returns structured draft sections
              │   Draft stored in Supabase applications.draft_content
              │   ──────────────────────────────────────────────────────
              │
              ├── SUCCESS STATE:
              │     Textarea populates with generated draft
              │     Draft is structured into labelled sections:
              │       ## About Our Organization
              │       ## The Problem We Address
              │       ## Our Proposed Project
              │       ## Past Work & Evidence
              │       ## Budget Justification
              │       ## Expected Outcomes
              │
              │     Subtle banner above textarea:
              │       "✦ Generated using your profile + {N} logged past projects"
              │       "Powered by Groq · llama-3.1-8b-instant"  (or Gemini fallback)
              │
              │     User can freely edit the draft — it's a rich textarea,
              │     not a locked document. Auto-saves every 30 seconds.
              │
              ├── "Regenerate Draft" button (ghost, top-right of panel)
              │     Clears cache for this org+grant pair, calls engine again
              │     Confirmation tooltip: "This will replace your current draft."
              │
              └── BOTTOM ACTION BAR (full width, sticky):
                        │
                        ├── Word count: "{N} words"  (General Sans 12px, muted)
                        ├── "Save Draft" button (ghost)
                        └── "Mark as Submitted" button (primary, moss green)
                              → DISABLED until all checklist items checked
                              → On click: status updates to "Submitted"
                                in Supabase, deadline reminder cleared,
                                pipeline card moves to Submitted column

7. Core User Journey 3 — Logging a Past Project (Memory Vault)
Entry points: Side panel "Memory Vault" → /vault | Dashboard "Log a Project" CTA | Onboarding completion nudge

/vault  [Memory Vault — index]
   │
   ├── PAGE HEADER:
   │     Title: "Memory Vault"
   │     Subtitle: "Your organization's project history — the foundation
   │                of every future proposal."
   │
   ├── LOGGED PROJECTS LIST:
   │     Each project card shows:
   │       Project name (bold)
   │       Duration: {start} – {end}
   │       Beneficiaries: {count} {type}
   │       Key outcome: first outcome line (truncated)
   │       Funding source tag
   │     Cards arranged in a masonry-style grid (2 columns desktop, 1 mobile)
   │
   ├── [If no projects logged yet] → Empty state (see Section 8)
   │
   ├── User clicks a project card
   │     → /vault/:id  [Project Detail — read-only view]
   │     → Edit button navigates to edit mode (same form, pre-populated)
   │
   └── User clicks "Log New Project" button (top-right of page header)
              OR presses the FAB (bottom-right, visible on /vault)
              │
              └──→ /vault/new  [Log New Project — full page form]
                         │
                         ├── FORM SECTIONS (scrollable, single page):
                         │
                         │   Section A — Project Identity
                         │     Project name (text, required)
                         │     Start date / End date (date pickers)
                         │     Status (radio: Completed / Ongoing)
                         │
                         │   Section B — Geography & Beneficiaries
                         │     Geography (text: district, state, region)
                         │     Beneficiary count (number)
                         │     Beneficiary type (text: who was served?)
                         │     Target demographics (multi-select, optional):
                         │       SC/ST | BPL | PwD | Women | Children | Minorities
                         │       → stored in projects.target_demographics text[]
                         │       → used by matching engine to align with grants
                         │         that specify beneficiary requirements
                         │       → helper text: "Select all that apply — this
                         │         significantly improves grant matching accuracy"
                         │
                         │   Section C — Activities
                         │     Activities carried out (textarea)
                         │     Key deliverables (textarea)
                         │
                         │   Section D — Outcomes (most important for matching)
                         │     Quantified outcomes (textarea with prompt:
                         │       "e.g. 340 girls enrolled, 18% dropout
                         │        rate reduction")
                         │     SDG Alignment (multi-select, optional):
                         │       Goal 1: No Poverty | Goal 2: Zero Hunger
                         │       Goal 3: Good Health | Goal 4: Quality Education
                         │       Goal 5: Gender Equality | Goal 6: Clean Water
                         │       Goal 8: Decent Work | Goal 10: Reduced Inequalities
                         │       Goal 13: Climate Action | Goal 17: Partnerships
                         │       → stored in projects.sdg_alignment text[]
                         │       → surfaces in proposal drafts under "Alignment
                         │         with Sustainable Development Goals" section
                         │       → many UN and international funders require
                         │         SDG mapping — this feeds it automatically
                         │     Impact measurement method (text)
                         │
                         │   Section E — Financials
                         │     Budget used (number, in ₹)
                         │     Budget breakdown (optional textarea)
                         │     Funding source (text: which grant/donor funded this)
                         │
                         │   Section F — Documents (optional)
                         │     Upload slots — each stored in Supabase Storage,
                         │     URL saved to projects table:
                         │
                         │     Utilization Certificate (UC)
                         │       → stored in projects.utilization_certificate_url
                         │       → helper text: "A UC from your previous funder
                         │         significantly strengthens new applications.
                         │         Upload if available."
                         │       → Accepted formats: PDF only. Max 5MB.
                         │
                         │     Project Completion Report
                         │       → Accepted formats: PDF, DOCX. Max 10MB.
                         │
                         │     Photographs / Visual Evidence
                         │       → Accepted formats: JPG, PNG. Max 3 files, 5MB each.
                         │
                         │     Audit Certificate
                         │       → Accepted formats: PDF only. Max 5MB.
                         │
                         │     All uploads stored in Supabase Storage,
                         │     bucket: project-assets
                         │     path: /projects/{org_id}/{project_id}/{file_name}
                         │
                         ├── "Save Project" button (primary, full width)
                         │     → Validates required fields (react-hook-form + zod)
                         │     → Writes to Supabase projects table
                         │     → Python matching engine re-runs for this org
                         │       (async, background) to incorporate new project data
                         │     → Navigates to /vault/:id (new project detail)
                         │     → Success toast: "Project logged. Your matches
                         │        have been updated."
                         │
                         └── "Cancel" link → navigates back to /vault

7a. Core User Journey 4 — The Dashboard (/dashboard)
The Dashboard is the default authenticated landing page. It aggregates pipeline data and surfaces the most actionable information.

Entry point: Post-onboarding redirect, post-login redirect, sidebar "Dashboard" nav item.

/dashboard  [Dashboard]
   │
   ├── HEADER:
   │     "Welcome back, {org_name}."
   │     General Sans 17px, #888888, margin-bottom 24px
   │
   ├── METRICS ROW (typography-led, no heavy cards):
   │     Three inline stat callouts separated by thin #E8E8E8 dividers:
   │       Active Applications  →  count of applications with status
   │                               Exploring or Drafting
   │       Upcoming Deadlines   →  count of applications with deadline
   │                               within the next 14 days
   │       Grants Matched       →  total count of non-dismissed grant_matches
   │                               for this org
   │     Each: number in Satoshi 40px weight 700 #0A0A0A,
   │           label in General Sans 12px weight 500 #888888 below.
   │
   ├── SECTION: Pipeline Snapshot
   │     Title: "In Progress" (Satoshi 18px weight 600)
   │     Shows applications with status Exploring or Drafting.
   │     Each row shows:
   │       Grant name (bold) + Funder (muted)
   │       Status pill (Exploring / Drafting)
   │       Checklist progress bar: "{N}/{total} items complete"
   │       Deadline countdown badge: "{N} days left" (amber if <14 days)
   │     CTA per row: "Continue →" → /applications/:id
   │     If no in-progress applications → empty state:
   │       "No active applications. Start one from your matched grants."
   │       [Browse Matches → /grants]
   │
   ├── SECTION: New Matches
   │     Title: "Top Matches for You" (Satoshi 18px weight 600)
   │     Shows top 3 highest fit_score grant_matches added since last login.
   │     Each card shows: Grant name, Funder, Fit Score pill, Deadline.
   │     CTA: "View all {N} matches →" → /grants
   │     If no new matches since last login → show top 3 overall matches instead.
   │
   └── FAB remains anchored bottom-right (as per Section 2 Navigation rules).

7b. Core User Journey 5 — Profile & Settings (/settings)
Allows the org to update their profile data and compliance documents to keep grant matches accurate.

Entry point: Sidebar "Profile & Settings" nav item.

/settings  [Profile & Settings]
   │
   ├── PAGE LAYOUT:
   │     Title: "Settings" (Satoshi 40px weight 700)
   │     Three horizontal tabs below title:
   │       [Organization Profile]  [Compliance Docs]  [Account]
   │
   ├── TAB 1 — Organization Profile:
   │     Re-exposes onboarding Steps 1, 2, and 4 as a single editable form:
   │       Org name, type, legal entity type, location (from Step 1)
   │       Mission statement, cause areas (Schedule VII), geography,
   │         target beneficiaries (from Step 2)
   │       Funding range, funding types needed, urgency (from Step 4)
   │     "Save Changes" button (primary moss green)
   │       → Updates organizations table in Supabase
   │       → Triggers async background re-match (Python engine re-runs
   │           two-pass matching for this org)
   │       → Success toast: "Profile updated. Your matches are refreshing."
   │
   ├── TAB 2 — Compliance Docs:
   │     Re-exposes onboarding Step 3 compliance toggles:
   │       Has audited financials (toggle)
   │       Annual turnover range (dropdown)
   │       Has 12A/80G (toggle)
   │       Has FCRA (toggle)
   │       NGO Darpan ID (text)
   │       CSR-1 Registration Number (text)
   │     File upload slots (stored in compliance-documents bucket):
   │       Path: /compliance/{org_id}/{document_type}_{timestamp}.pdf
   │       12A/80G Certificate → PDF only, max 5MB
   │       FCRA Certificate → PDF only, max 5MB
   │       Audited Financial Statements → PDF only, max 10MB
   │       CSR-1 Certificate → PDF only, max 5MB
   │     Each slot shows current upload status: "Uploaded ✓" or "Not uploaded"
   │     "Save Changes" button → updates organizations table + triggers re-match
   │
   └── TAB 3 — Account:
         Displays: Current authenticated user email (read-only)
         "Change Password" → triggers Supabase password reset email flow
         Destructive action: "Delete Account"
           → Requires typing org name exactly to confirm
           → On confirm: deletes auth.users record, cascades to organizations,
               projects, applications, grant_matches (all ON DELETE CASCADE)
           → Redirects to / (landing page)
           → Warning: "This is permanent and cannot be undone."

8. Empty States & Error States
Empty States
/grants — No grants matched yet
Shown when the matching engine has not run yet (e.g., immediately after onboarding before the async job completes).

[Sprout illustration]
"Your matches are being prepared."
"This usually takes under a minute. Refresh in a moment."
[Refresh button]

/grants — No grants match current filters
Shown when active filters return zero results.

[Empty search illustration]
"No grants match these filters."
"Try widening your cause area or budget range."
[Clear filters button]

/applications — No applications started

[Seed illustration]
"You haven't started any applications yet."
"Find a matched grant and hit 'Start Application' to begin."
[Browse Grants button → /grants]

/vault — No projects logged

[Roots illustration]
"Your Memory Vault is empty."
"Log your past projects to unlock stronger grant matches
and auto-filled proposal sections."
[Log Your First Project button → /vault/new]

/dashboard — New user, profile just completed

"Welcome to Seedling, {org name}."
"We've found {N} grants that match your profile.
Start by exploring your top matches."
[Browse Matches CTA → /grants]
[Log a Past Project CTA → /vault/new]

Error States
Draft generation — Groq primary, successful fallback to Gemini
When Groq returns a 429 rate limit error and the system falls back to Gemini 2.5 Flash-Lite, the draft is still generated successfully. The user sees no error. However, a subtle informational banner appears above the draft textarea:

ℹ  "Draft generated using Gemini 2.5 Flash-Lite (backup engine).
    Quality is consistent — this happens during high-demand periods."
This banner is dismissible and styled in #FEF3E2 (amber tint) with #9A5B00 text — not a red error state, because nothing failed from the user's perspective.

Draft generation — Both Groq and Gemini fail
If both providers fail (network error, both rate limited, or service outage):

[Red-tinted banner inside Draft panel]
"Draft generation is temporarily unavailable."
"Both our generation engines are busy right now.
Your draft has been saved. Try again in a few minutes."

[Retry button]  [Write manually instead →]
The "Write manually instead" action dismisses the banner and focuses the textarea for manual writing. The user's progress is not lost — the form remains open.

Draft generation — Partial failure (LLM returns incomplete output)
If the LLM returns a response that fails the Python engine's output validation (missing required sections, too short, malformed):

[Amber banner]
"We generated a partial draft — some sections may be incomplete."
"Review what's here and fill in the highlighted sections manually."

Affected sections in the textarea are wrapped in a yellow highlight:
  ## Budget Justification
  ⚠ [This section needs your input — we couldn't generate it automatically.]

/grants/:id — Grant no longer available
If a user navigates to a grant that has been soft-deleted (deadline passed > 30 days):

[Full panel message]
"This grant has closed."
"The deadline for this grant has passed. We've moved it to your archive."
[Browse current grants → /grants]

Network error — API unreachable
If the Node.js API is unreachable (e.g., Render cold start timeout):

[Top-of-page banner, full width, black background]
"Having trouble connecting. Retrying..."
[Spinner]
After 3 failed retries:

"We're having trouble reaching our servers.
Your data is safe. Please try refreshing the page."
[Refresh button]

Supabase Realtime disconnected
If the Realtime WebSocket drops, pipeline updates stop being live. A subtle indicator appears in the pipeline view:

[Small pill, top-right of /applications page]
"● Live updates paused — [Reconnect]"
Clicking reconnect re-initialises the Supabase Realtime subscription.

Form validation errors (all forms)
Inline, field-level error messages using react-hook-form + zod. Errors appear below the relevant field in General Sans 12px #D32F2F (red) on blur or on submit attempt. The form does not navigate away on validation failure.

/404 — Page not found

[Full page, centered]
"404"  (Satoshi 96px, muted)
"This page doesn't exist."
[Back to Dashboard → /dashboard]

/error — Server error

[Full page, centered]
"Something went wrong on our end."
"We've logged the error. Please try again."
[Back to Dashboard → /dashboard]  [Retry]

9. Redirect Logic
All redirects are enforced at the React Router level using a <ProtectedRoute> wrapper component that checks Supabase Auth session state and org profile completion status on every route render.

Condition                                    →  Redirect to
─────────────────────────────────────────────────────────────────────
Not authenticated + visits /dashboard        →  /login
Not authenticated + visits /grants           →  /login
Not authenticated + visits /vault            →  /login
Not authenticated + visits /applications     →  /login
Not authenticated + visits /settings         →  /login
Not authenticated + visits /onboarding/* →  /login

Authenticated + email not verified
  + visits any /onboarding or app route      →  /verify-email

Authenticated + verified + profile incomplete
  + visits /dashboard                        →  /onboarding/identity
Authenticated + verified + profile incomplete
  + visits /grants                           →  /onboarding/identity
Authenticated + verified + profile incomplete
  + visits any core app route                →  /onboarding/identity

Authenticated + profile complete
  + visits /login                            →  /dashboard
Authenticated + profile complete
  + visits /signup                           →  /dashboard
Authenticated + profile complete
  + visits /onboarding/* →  /dashboard

Authenticated + profile complete
  + visits /                                 →  /dashboard

Authenticated + profile incomplete
  + visits /onboarding/mission (step 2)
  + step 1 not yet saved                     →  /onboarding/identity
  (Each onboarding step validates that the
   previous step's data exists in Supabase
   before rendering. Guards cascade.)

Unauthenticated + visits /verify-email
  + no pending verification session          →  /signup

/grants/:id where grant does not exist       →  /404
/applications/:id where application
  does not belong to current org             →  /404  (RLS blocks DB read,
                                                        frontend catches null)
/vault/:id where project does not exist
  or does not belong to current org          →  /404

Any unmatched route                          →  /404

Onboarding Step Guard
Each onboarding route checks the onboarding_step integer in the Supabase organizations table before rendering. If a user tries to deep-link to /onboarding/capacity (Step 3) while their database record shows onboarding_step: 1, they are redirected back to /onboarding/identity.

/onboarding/mission   → requires: organizations.name exists
/onboarding/capacity  → requires: organizations.cause_areas set
/onboarding/funding   → requires: organizations.team_size set
/onboarding/complete  → requires: all four steps saved

Post-Action Redirects
Action                                       →  Redirect to
─────────────────────────────────────────────────────────────────────
Signup successful                            →  /verify-email
Email verified                               →  /onboarding/identity
Onboarding complete                          →  /dashboard
"Start Application" on /grants/:id           →  /applications/:id  (new)
FAB → Grant Picker → grant selected          →  /applications/:id  (new)
"Save Project" on /vault/new                 →  /vault/:id  (new)
"Mark as Submitted" on /applications/:id     →  /applications  (pipeline)
                                                (with success toast)
Logout                                       →  /