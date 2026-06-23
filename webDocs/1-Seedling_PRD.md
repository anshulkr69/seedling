# Product Requirements Document
**Seedling**

**Tagline:** From scattered grants to funded missions — in one place.

## Problem
Grassroots NGOs, student researchers, and social startups are doing real, impactful work — but the system built to fund them is broken at every step.

* **Discovery Chaos** — There is no central place where grants live. Organizations manually check 15+ government portals, foundation websites, CSR databases, and email newsletters. This alone consumes 2–3 weeks per funding cycle.
* **Eligibility Blindness** — Grant listings are buried inside 12-page documents with no filtering mechanism. Organizations routinely apply to grants they were never eligible for, burning weeks on proposals that get rejected at the first screen.
* **Statutory Eligibility Blindness** — Indian NGOs frequently waste hours applying for grants without realizing they lack mandatory legal prerequisites (e.g., NGO Darpan for Government funds, or CSR-1 registration for Corporate funds).
* **Writing from Zero** — Every application is written from scratch. The same mission statement, the same impact story, the same team credentials — retyped and reformatted for every single funder, every single cycle.
* **Rejected on Technicalities** — Wrong file format, missing annex, wrong word count, one page over the limit. Months of genuine work gets discarded for administrative errors that have nothing to do with the quality of the work.
* **No Institutional Memory** — When a grant coordinator leaves, every funder relationship, every past application, every lesson learned about what worked — walks out the door with them. The next person starts from zero.

The compounded result: organizations spend 3–4 weeks hunting for grants, another 2–3 weeks writing proposals from scratch, and then get rejected for reasons they could have caught on day one. With no record of what happened, the cycle repeats every quarter.

## Target Users

**Primary — Grassroots NGOs in India**
Teams of 3–15 people legally registered as Trusts, Societies, or Section 8 Companies. No dedicated grant writer. One person simultaneously handles program management, accounting, communications, and fundraising. Can't afford consultants. Can't afford to miss grants either.

**Primary — Student & Early-Career Researchers**
Working on theses, field research, and community projects. Need travel grants, research stipends, and equipment funding. Lose grants to process errors, not merit.

**Secondary — Social Startups & Community Organizations**
Doing real impact work but not yet established enough to impress traditional funders or hire grant-writing consultants. Strong mission, weak paper trail. The system favors incumbents.

## Core Features — Must Have

**1. Organizational Profile Layer**
A structured one-time onboarding form that captures everything the system needs to operate: org name, type, legal entity type, registration status, location, cause area (mapped to Schedule VII), geography of impact, target beneficiaries, team size, compliance documents available (Turnover ranges, 12A/80G, CSR-1, NGO Darpan), past projects with outcomes, and funding needs. This profile is the single source of truth for all matching and drafting. It persists and deepens over time as the org logs more work — creating compounding value the longer they use the platform.

**2. Grant Aggregation Engine**
A backend scraping and ingestion system that crawls and structures grant data daily from 20+ live sources: Indian government portals (DST, Ministry of Social Justice, BIRAC), foundation websites (Tata Trusts, Ford Foundation, Wellcome Trust), CSR databases, UN agency portals (UNDP, UNICEF, UN Women), and academic funding bodies. Every grant pulled in is tagged and structured — cause area, eligible org types, geography, funding size, funding type offered (Project, Operational, Equipment), deadline, required documents. The database refreshes on a scheduled cron job so listings are always current.

**3. Statutory Compliance Filter**
The matching engine must treat Indian statutory requirements (Turnover minimums, 12A/80G, CSR-1, NGO Darpan, Schedule VII alignment) as absolute hard-filters before calculating the AI fit score, ensuring users only see grants they are legally capable of accepting.

**4. AI-Powered Matching Engine**
A multi-factor scoring algorithm that runs the org's profile against the structured grant database and produces a ranked list of eligible grants. Scoring factors: cause alignment, eligibility check (registration, geography, size, org type), funding range fit, capacity match (does the grant require audited financials — does this org have them?), and deadline viability. Each grant gets an explainable Fit Score — users see exactly why a grant was matched, not just that it was. This eliminates eligibility blindness entirely and surfaces only grants the org can actually win.

**5. Automated Application Draft Generation**
When a user selects a matched grant and initiates an application, the system pulls two inputs — the grant's stated requirements and priorities, and the org's profile including logged past projects — and generates a structured first draft of the proposal. The draft is tailored to the funder's specific language and priorities, not a generic template. It pre-fills sections including problem statement, organizational background, past work evidence, objectives, methodology, and budget justification. The user refines the draft rather than writing from zero, cutting writing time from 3 weeks to 3 days.

**6. Logged Projects & Institutional Memory Vault**
A structured work history database inside Seedling where orgs document every project they've run — past or present — in a consistent format: project name, duration, geography, beneficiaries served, activities, quantified outcomes, budget used, and funding source. This history feeds the matching engine (demonstrated experience = stronger match signal), auto-populates the evidence sections of proposals, and persists across team changes. When a coordinator leaves, knowledge stays. Over time, the system surfaces patterns — strongest cause areas, most successful funder relationships, recurring weaknesses in past applications.

**7. Compliance Checklist & Deadline Tracker**
Before a grant application can be marked as submitted, the system auto-generates a grant-specific compliance checklist based on that funder's requirements — registration certificate, budget within range, word count, mandatory attachments, correct file format. The user cannot proceed without clearing the checklist. Every tracked grant also lives on a pipeline dashboard (Exploring → Drafting → Submitted → Decision) with deadline countdowns and automated reminders at 30 days, 7 days, and 1 day before deadline.

## Nice to Have

* **Funder Relationship Tracking:** A lightweight CRM layer inside the platform where orgs can log notes about funder relationships — past interactions, feedback received, contacts made, relationship warmth — so organizational knowledge about funders accumulates over time.
* **Rejection Analysis:** When a grant is marked as rejected, a structured debriefing flow prompts the user to log what feedback was received, which sections felt weak, and what they'd do differently. The system surfaces these insights before the next application cycle to the same funder.
* **Team Collaboration:** Multi-user access within one org account — so the program head, grant writer, and finance lead can all work on the same application simultaneously without emailing drafts back and forth.
* **Application Templates Library:** A library of reusable section templates — budget justification formats, M&E plan structures, theory of change frameworks — that orgs can pull from and adapt rather than building from scratch.
* **Funder Calendar:** A consolidated calendar view showing all upcoming grant deadlines across the org's tracked grants and any new matches, filterable by month and cause area.
* **Export to PDF/Word:** One-click export of a finalized draft proposal into a submission-ready PDF or Word document, correctly formatted to the funder's specified format.
* **Mobile-Responsive Dashboard:** A simplified mobile view of the pipeline tracker and deadline reminders so coordinators can monitor their funding pipeline on the go without needing a laptop.

## Out of Scope — Version 1 Will NOT Include

* **Direct submission to grant portals** — Seedling drafts and tracks applications but does not integrate with government or foundation submission portals to file applications on the user's behalf. Users submit manually.
* **Financial management or accounting features** — Seedling is not a budgeting tool. It captures budget ranges for matching purposes but does not manage org finances, generate financial reports, or integrate with accounting software.
* **Donor/crowdfunding management** — Seedling is specifically for institutional grants (government, foundation, CSR, UN). Individual donor management, crowdfunding campaigns, and peer-to-peer fundraising are out of scope.
* **Grant reporting and post-award compliance** — Once a grant is won, Seedling's job ends. Impact reporting, fund utilization tracking, and post-award compliance documentation are not in scope for V1.
* **Legal or financial advice** — The platform provides information to aid decision-making but does not provide legal eligibility determinations or financial compliance advice.
* **Native mobile apps** — V1 is a responsive web application only. iOS and Android apps are a future consideration.
* **International grant sources outside India** — V1 focuses on Indian government portals, Indian foundations, CSR mandates, and select international bodies (UN, Ford Foundation) with India programs. Full global grant coverage is a later expansion.
* **Payment processing or grant disbursement** — Seedling has no role in money movement between funders and organizations.

## User Stories

**Discovery**
* As a grassroots NGO coordinator, I want to see all grants I'm eligible for in one ranked list so that I stop wasting weeks searching 15 different portals manually.
* As a student researcher, I want to filter grants by my cause area, geography, and budget range so that I only see opportunities that are actually relevant to my project.
* As a social startup founder, I want to understand exactly why a grant was matched to my profile so that I can make an informed decision about whether to apply.

**Application**
* As an NGO grant writer, I want a first draft of my proposal auto-generated from my org profile and past projects so that I spend my time refining rather than writing from zero.
* As a program coordinator, I want a compliance checklist generated before I submit so that my application is never rejected for a missing document or wrong file format.
* As a researcher, I want my organizational background and past work pulled automatically into the proposal so that I don't have to rewrite it for every application.

**Pipeline & Tracking**
* As an NGO director, I want to see all our active grant applications in one pipeline view so that I always know what stage each one is at and what's due next.
* As a team lead, I want automated deadline reminders at 30, 7, and 1 day before submission so that we never miss a closing date.
* As a grant coordinator, I want to log the outcome of every application we submit so that we build a searchable history of what we've tried and what worked.

**Institutional Memory**
* As a new grant coordinator joining an org, I want to see the full history of every grant the organization has ever applied for so that I don't start from zero when my predecessor left.
* As an NGO founder, I want the system to surface patterns in our grant history so that I understand which cause areas and funders we have the strongest track record with.
* As a program manager, I want to log every project we run with its outcomes and budget so that future proposals can pull from real, quantified evidence automatically.

**Profile & Onboarding**
* As a first-time user, I want a structured onboarding flow that captures everything about my organization once so that I never have to re-enter the same information for different applications.
* As an org admin, I want to update our profile when our team size, compliance documents, or focus areas change so that our grant matches stay accurate over time.

## Success Metrics

**Efficiency Metrics**
* Grant discovery time reduced from 2–3 weeks to under 3 hours for active users
* Proposal writing time reduced from 2–3 weeks to under 3 days for active users
* Eligibility error rate (applications to grants the org doesn't qualify for) reduced to under 5%
* Zero missed deadlines for grants tracked in the pipeline

**Engagement Metrics**
* Org profile completion rate above 80% within 48 hours of signup
* At least 3 logged projects per active organization within the first month
* Average of 5+ grants tracked in the pipeline per active org per quarter
* Draft generation used in at least 70% of applications initiated on the platform

**Outcome Metrics**
* Grant win rate for Seedling users measurably higher than the sector average (baseline: most small NGOs report under 20% success rate on applications)
* User-reported time saved per application cycle: target 15+ hours saved
* Retention: 70% of orgs active at month 1 still active at month 3

**Business Metrics**
* Free to Pro conversion rate: 15% within 90 days of signup
* Monthly recurring revenue target: ₹5L MRR within 12 months of launch
* Institutional licensing: 2 signed university or NGO network deals within 18 months

**Trust Metrics**
* Net Promoter Score above 45 within 6 months
* Support ticket volume below 5% of monthly active users (indicator of product clarity)
* Profile data completeness score averaging above 75% across all active orgs