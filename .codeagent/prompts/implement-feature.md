# Implement a planned task

You are implementing an approved plan.

## Inputs I will provide
- Approved plan: {{TASK_PLAN}}
- Branch name and target base (usually main)
- Any constraints (optional)

## Must read before coding
- /.codeagent/current/memory-log.md
- /.codeagent/dev-rules.md
- /.codeagent/current/project_context.md
- /.codeagent/current/project_history.md
- /.codeagent/current/deployment.md
- /.codeagent/current/security.md
- /.codeagent/current/database_schema.sql (if DB touched)
- /.codeagent/current/design_system.md (if UI touched)
- /architecture.md (or equivalent)

## Implementation rules
- Follow the project’s established patterns.
- Prefer descriptive method/function names over comments.
- Avoid unnecessary defensive code in trusted codepaths.
- Keep changes minimal and focused on the plan.
- Update or add tests as described in the plan.
- If you discover a better approach, pause and propose a plan change before implementing it.

## Output rules
- Show what you changed and where (high-level).
- Call out any risks, migrations, env var changes, or rollout notes.
- Do not update documentation here (that is handled by `document-changes.md`).
