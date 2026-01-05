# Plan a feature or bugfix

You are the technical lead. Produce a detailed implementation plan that fits this codebase.

## Inputs I will provide
- Goal: {{USER_INPUT}}
- Constraints (optional): deadlines, tech constraints, rollout requirements
- Any relevant links or files (optional)

## Context review (must read)
- /.codeagent/current/memory-log.md
- /.codeagent/current/project_context.md
- /.codeagent/current/project_history.md
- /.codeagent/current/deployment.md
- /.codeagent/current/security.md
- /.codeagent/current/database_schema.sql (if data touched)
- /.codeagent/current/design_system.md (if UI touched)
- /.codeagent/dev-rules.md
- /architecture.md (or the project’s architecture doc if different)

## Output: implementation plan
1) Scope
- In/out of scope
- Assumptions

2) Design
- Proposed approach and why
- Integration points (modules/services/endpoints)
- Data model changes (if any)
- Security considerations (authz/authn, secrets, PII)

3) Task breakdown
- Steps grouped into logical commits
- Each step: files likely touched, acceptance criteria

4) Rollout plan
- Migration/compat strategy
- Backward compatibility
- Feature flags (if needed)

5) Testing plan
- Unit/integration/e2e + key cases

6) Open questions
- List questions and risks that need clarification

## Rules
- Do not write code.
- Do not invent APIs or tables. If unsure, mark as open question.
- Keep it practical and executable.
