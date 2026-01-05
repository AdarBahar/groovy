# CodeAgent Prompts Index

Location: `/.codeagent/prompts/`

This folder contains ready-made prompts you can activate for common workflows.

## How to use
1) Pick the prompt that matches the action you want.
2) Paste the full prompt into CodeAgent.
3) Provide the required inputs listed under “Inputs I will provide”.
4) If the agent produces code changes, run `cleanup-and-order.md` before merging.
5) Always run `document-changes.md` after work is done.

---

## 1) Document changes

### Prompt: `document-changes.md`
Use when:
- A feature/bugfix/refactor is complete and you want to update the project docs.

Inputs I will provide:
- Branch name + commit hash(es)
- PR link (optional)
- Diff summary or `git diff main...HEAD`
- Notes about behavior changes, endpoints, migrations, env vars (if any)

Output:
- Updated contents for only the docs that are relevant to the changes.

---

## 2) Plan a new feature or bugfix

### Prompt: `plan-feature.md`
Use when:
- You want a detailed technical plan before writing code.

Inputs I will provide:
- Goal / problem statement
- Constraints (optional): timeline, tech limits, rollout requirements
- Relevant links/files (optional)

Output:
- A scoped, step-by-step implementation plan (no code).

---

## 3) Implement a planned feature

### Prompt: `implement-feature.md`
Use when:
- The plan is approved and you want CodeAgent to implement it.

Inputs I will provide:
- Approved plan (paste the full plan)
- Branch name and target base (usually main)
- Constraints (optional)

Output:
- Code changes + a brief high-level summary of what changed and key risks.

---

## 4) Cleanup, order, and remove AI slop

### Prompt: `cleanup-and-order.md`
Use when:
- You want to clean the branch before merging.
- You want to remove “AI code slop” introduced by the agent.

Inputs I will provide:
- `git diff main...HEAD` (or equivalent)

Output:
- Cleaned diff
- Final report limited to 1–3 sentences

---

## Recommended workflow
1) `plan-feature.md`
2) `implement-feature.md`
3) `cleanup-and-order.md`
4) `document-changes.md`

---

## Documentation conventions

### Updated continuously (source of truth)
Location: `/.codeagent/current/`
- `project_history.md`
- `database_schema.sql`
- `memory-log.md`
- `project_context.md`
- `deployment.md`
- `security.md`
- `design_system.md`

### Reference docs (not “current status”)
Location: `/.codeagent/docs/`
Suggested structure:
- `adr/` (architecture decisions)
- `runbooks/`
- `api/`
- `testing/`
- `migrations/`
- `ui/`
