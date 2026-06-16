# 🌱 Seedling

> From scattered grants to funded missions — in one place.

Seedling automates grant discovery, statutory eligibility filtering, AI-powered proposal drafting, and pipeline tracking for grassroots NGOs in India.

---

## Architecture

| Service | Stack | Location | Deploys To |
|:--------|:------|:---------|:-----------|
| Frontend | React + Vite + TypeScript | `client/` | Vercel |
| Backend API | Node.js + Express + TypeScript | `server/` | Render |
| Engine | Python + FastAPI | `engine/` | Render |
| Database | PostgreSQL via Supabase | `supabase/` | Supabase |

---

## Team & Branches

| Branch | Owner | Owns |
|:-------|:------|:-----|
| `feature/scraper-api` | Anshu | Scraper + Backend API + DB Migrations |
| `feature/matching-engine` | Friend A | Matching + Drafting Engine |
| `feature/frontend-auth` | Friend B | Auth, Onboarding, Shared UI |
| `feature/frontend-core` | Friend C | Dashboard, Grants, Vault, Applications |

---

## Local Setup

### 1. Clone the repo
```bash
git clone https://github.com/your-team/seedling.git
cd seedling
```

### 2. Frontend
```bash
cd client
cp .env.example .env
npm install
npm run dev        # runs on http://localhost:5173
```

### 3. Backend API
```bash
cd server
cp .env.example .env
npm install
npm run dev        # runs on http://localhost:3001
```

### 4. Python Engine
```bash
cd engine
cp .env.example .env
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload    # runs on http://localhost:8000
```

### 5. Database
- Create a project on [Supabase](https://supabase.com)
- Run migrations in order from `supabase/migrations/`

---

## Branch Workflow

```
feature/your-branch  →  PR  →  develop  →  PR  →  main (submission)
```

- Push freely to your `feature/` branch
- Open a PR to `develop` when a piece is working
- Pull from `develop` every morning to stay in sync
- `main` is only updated at final submission

---

## Docs

All project documentation is in `/Docs`:
- `Seedling_PRD.md` — Product Requirements
- `Seedling_TRD.md` — Technical Requirements
- `Seedling_AppFlow.md` — Full App Flow & UI spec
- `Seedling_BackendSchema.md` — Database schema
- `Seedling_DesignUI.md` — Design system
- `Seedling_ImplementationPlan.md` — Phase-by-phase build plan
