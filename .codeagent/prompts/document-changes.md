# Document changes (post-implementation)

You are updating project documentation after code changes were completed.

## Inputs I will provide
- Branch name + commit hash(es)
- PR link (optional)
- Git diff summary or `git diff main...HEAD` (or equivalent)
- Notes about behavior changes, endpoints, migrations, env var changes (if any)

## Must read before writing
- /.codeagent/current/project_history.md
- /.codeagent/current/memory-log.md
- /.codeagent/current/project_context.md
- /.codeagent/current/deployment.md
- /.codeagent/current/security.md
- /.codeagent/current/database_schema.sql (if DB changed)
- /.codeagent/current/design_system.md (if UI changed)

## Update these files (only when relevant)
1) /.codeagent/current/project_history.md
   - Add a new entry at the TOP in the agreed format.
   - Include: summary, key file/module changes, reasoning, impact, deployment/ops notes, testing, next steps, schema changes.

2) /.codeagent/current/memory-log.md
   - Add only durable knowledge: decisions, patterns, “how we do things here”, gotchas.
   - Keep it short and skimmable.

3) /.codeagent/current/project_context.md
   - Update “what the system is” and “what changed recently”.
   - Keep chronological updates (newest first).
   - Link to the other docs for details.

4) /.codeagent/current/deployment.md
   - Update build/deploy steps if anything changed.
   - Add env var/config changes and rollback steps if needed.

5) /.codeagent/current/security.md
   - Update auth, permissions, secrets handling, threat notes if relevant.

6) /.codeagent/current/database_schema.sql (only if DB changed)
   - Update schema to match the working DB state.
   - Ensure tables, indexes, constraints are correct and consistent.

7) /.codeagent/current/design_system.md (only if UI changed)
   - Capture UI patterns/decisions so future UI stays consistent.

## Output rules
- Return ONLY the updated file contents for each file you changed.
- Do not invent changes: everything must be grounded in the diff/inputs.
- Keep each file concise; prefer bullet lists.
