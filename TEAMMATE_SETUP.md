# 🌱 Seedling — Teammate Setup Guide

Hey! Here's everything you need to get started on your part of the project.

---

## Step 1 — Make sure you have these installed

- **Git** → https://git-scm.com/downloads
- **Node.js (v20+)** → https://nodejs.org
- **Python 3.11+** → https://python.org *(only if you're on the engine)*
- A code editor — VS Code recommended

---

## Step 2 — Clone the repo

```bash
git clone https://github.com/anshulkr69/seedling.git
cd seedling
```

---

## Step 3 — Create YOUR branch

Find your name below and run that exact command:

**Friend A — Matching + Drafting Engine**
```bash
git checkout develop
git checkout -b feature/matching-engine
git push -u origin feature/matching-engine
```

**Friend B — Frontend: Auth, Onboarding & Shared UI**
```bash
git checkout develop
git checkout -b feature/frontend-auth
git push -u origin feature/frontend-auth
```

**Friend C — Frontend: Dashboard, Grants, Vault, Applications**
```bash
git checkout develop
git checkout -b feature/frontend-core
git push -u origin feature/frontend-core
```

> ✅ You only do Step 3 once. After this your branch exists on GitHub.

---

## Step 4 — Install dependencies for your service

**If you're working on the Frontend (Friend B or C):**
```bash
cd client
npm install
```

**If you're working on the Engine (Friend A):**
```bash
cd engine
python -m venv .venv
.venv\Scripts\activate       # Windows
# source .venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
```

**Or run everything from root (client + server together):**
```bash
npm install         # from the seedling/ root
npm run dev         # starts both client and server at once
```

---

## Step 5 — Set up your environment variables

Each service has a `.env.example` file. Copy it and fill in the values:

```bash
# For frontend
cp client/.env.example client/.env

# For engine
cp engine/.env.example engine/.env
```

Ask Anshu for the actual Supabase URL and keys.

---

## Step 6 — Start working!

Your files go in these folders:

| Who | Your folder |
|:----|:------------|
| Friend A | `engine/matching/`, `engine/drafting/`, `engine/api/routes/` |
| Friend B | `client/src/components/ui/`, `client/src/components/layout/`, `client/src/components/onboarding/`, `client/src/pages/` (auth + onboarding pages) |
| Friend C | `client/src/components/grants/`, `client/src/components/applications/`, `client/src/components/vault/`, `client/src/components/dashboard/`, `client/src/pages/` (core app pages), `client/src/hooks/` |

---

## Daily workflow — do this every day

### Morning: get everyone's latest work
```bash
git checkout develop
git pull origin develop
git checkout feature/your-branch-name
git merge develop
```

### While working: save your work often
```bash
git add .
git commit -m "feat: describe what you just built"
git push
```

### When a feature is ready: open a Pull Request
1. Go to https://github.com/anshulkr69/seedling
2. Click **"Compare & pull request"** on your branch
3. Set **base branch** to `develop` (NOT main)
4. Write a short description of what you built
5. Submit — Anshu will review and merge

---

## Commit message format

Keep it consistent so everyone understands at a glance:

```
feat(scope): what you built
fix(scope): what you fixed
chore(scope): config or setup change
```

**Examples:**
```
feat(matching): add Pass 1 statutory filter
feat(ui): build Button and Input components
feat(grants): add GrantTable with fit score pills
fix(engine): handle Groq 429 fallback to Gemini
chore(db): add RLS migration for organizations table
```

---

## Branch rules — important

| ✅ Allowed | ❌ Not allowed |
|:-----------|:--------------|
| Push freely to your `feature/` branch | Push directly to `main` |
| Open a PR to merge into `develop` | Push directly to `develop` |
| Pull from `develop` every morning | Skip the morning sync for more than a day |

---

## Stuck or need help?

- API routes list → `docs/Seedling_TRD.md`
- Full UI spec + page flow → `docs/Seedling_AppFlow.md`
- Design colors, fonts, components → `docs/Seedling_DesignUI.md`
- Database schema → `docs/Seedling_BackendSchema.md`

Or just ping Anshu.
