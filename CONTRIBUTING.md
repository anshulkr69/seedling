# Contributing to Seedling

## Branch Naming

| Prefix | Use for |
|:-------|:--------|
| `feature/` | New functionality |
| `fix/` | Bug fixes |
| `chore/` | Config, setup, docs |

## Commit Message Format

```
feat(scope): short description
fix(scope): short description
chore(scope): short description
```

**Examples:**
```
feat(scraper): add DST portal scraper
feat(api): add /grants/matches route
fix(engine): handle Groq 429 fallback
chore(db): add RLS policies migration
```

## Daily Workflow

```bash
# Morning — sync with teammates
git checkout develop
git pull origin develop
git checkout feature/your-branch
git merge develop

# Evening — push your work
git add .
git commit -m "feat(scope): what you built"
git push
```

## Opening a Pull Request

- Base branch: `develop`
- Title: same format as commit messages
- Description: what you built + what it unblocks for teammates
