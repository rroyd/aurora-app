# AGENTS.md — Aurora Feature Pipeline

> Portable, IDE-agnostic specification for the five-agent feature pipeline used in this repo. Anything that reads project AI configuration (Claude Code, Cursor, GitHub Copilot, JetBrains AI Assistant, Continue, Codeium, …) should respect what is in this file.

## TL;DR

When working on a feature in this repo, route your work through five sequential roles. Each role has strict rules and writes to a shared state file. **Skipping or merging roles is forbidden.**

```
┌─────────────────┐   ┌───────────┐   ┌──────────┐   ┌──────┐   ┌──────────┐
│ Product Owner   │ → │ Architect │ → │ Engineer │ → │ SDET │ → │ Reviewer │
│ triage          │   │ design    │   │ build    │   │ test │   │ gate     │
└─────────────────┘   └───────────┘   └──────────┘   └──────┘   └──────────┘
        ▲                  ▲                                          │
        └─────── rejection sends the ticket back to the right step ───┘
```

The shared state file is `.aurora-pipeline/work/<TICKET-ID>/feature_context.json`. Its schema lives at `.aurora-pipeline/feature_context.schema.json`.

## IDE / AI-tool routing

| Tool                                  | How it picks up these agents                                                    |
| ------------------------------------- | -------------------------------------------------------------------------------- |
| **Claude Code** (CLI, VS Code, JetBrains plugin, web) | Reads `.claude/agents/*.md` and `.claude/commands/*.md` automatically. Invoke with `/feature-init`, `/feature-triage`, ..., `/feature-pipeline`. |
| **Cursor**                            | Reads `.cursor/rules/*.mdc`. The rules point AI to this file (`AGENTS.md`) and the per-agent specs. |
| **GitHub Copilot Chat**               | Reads `.github/copilot-instructions.md`. Same pointer pattern.                  |
| **JetBrains AI Assistant** (native)   | Has no project-config standard yet. Engineers paste-link this file when prompting; or invoke Claude Code via the JetBrains plugin. |
| **Continue / Codeium / others**       | Most read a `rules/`, `.continuerc.json`, or top-level `AGENTS.md`. Point them at this file. |

## The five agents

Full spec for each lives at `.claude/agents/<name>.md`. Summaries below.

### 1. Product Owner — `product-owner`

| | |
|---|---|
| **Role** | Translate a raw user request into rigorous, developer-ready acceptance criteria |
| **Inputs** | Raw user request + ticket id |
| **Output** | `product_requirements` block in `feature_context.json` |
| **Rules** | ≥ 3 BDD acceptance criteria (`Given/When/Then`), ≥ 3 edge cases, NO implementation details, REJECT under-specified tickets rather than guessing |
| **Next status** | `triaged` (or `rejected`) |

### 2. Architect — `architect`

| | |
|---|---|
| **Role** | Design the technical blueprint before any code is written |
| **Inputs** | `product_requirements` from the context file |
| **Output** | `architecture_spec` block: interfaces, API contracts, impact analysis, migrations, feature flag |
| **Rules** | Interface First (all types in `packages/shared`), exact REST signatures, identify all impacted files, no destructive migrations without a deprecation plan |
| **Next status** | `designed` |

### 3. Engineer — `engineer`

| | |
|---|---|
| **Role** | Write functional code conforming exactly to the Architect's spec |
| **Inputs** | `product_requirements` + `architecture_spec` |
| **Output** | Code files in `apps/api`, `apps/web`, `packages/shared`. Updates `execution_log` |
| **Rules** | Architectural obedience (no deviation — halt if spec is flawed), feature-flag every new surface, idempotent POST/PUT, no placeholders, file-path headers on every code block |
| **Next status** | `in_progress` |

### 4. SDET — `sdet`

| | |
|---|---|
| **Role** | Write automated tests proving the Engineer's code satisfies every AC and EC |
| **Inputs** | `product_requirements.acceptance_criteria` + `product_requirements.edge_cases` + `execution_log` |
| **Output** | Test files + `test_results.acceptance_coverage` + `test_results.edge_case_coverage` |
| **Rules** | Vitest + supertest for backend, Playwright (POM) for UI E2E, state isolation per test, descriptive names, every AC and EC mapped to a test |
| **Next status** | `tested` |

### 5. Reviewer — `reviewer`

| | |
|---|---|
| **Role** | Final security + complexity + coverage gate |
| **Inputs** | The whole context file + the diff against `origin/main` |
| **Output** | `review_status` = `APPROVED_FOR_MERGE` or `REJECTED_WITH_FEEDBACK` + `review_feedback[]` |
| **Rules** | Reject on hardcoded secrets, raw SQL, missing auth, missing AC/EC coverage, functions > 50 lines, nesting > 3 levels, typecheck/lint/test failures. Feedback MUST include file, line, and a drop-in fix snippet |
| **Next status** | `approved` or `rejected` |

## Daily workflow

### Inside Claude Code

```
/feature-init   FEAT-123 "Customers want to filter products by price range"
/feature-triage FEAT-123
/feature-design FEAT-123
/feature-build  FEAT-123
/feature-test   FEAT-123
/feature-review FEAT-123

# or, all at once:
/feature-pipeline FEAT-123 "Customers want to filter products by price range"
```

### Inside Cursor

`.cursor/rules/*.mdc` instructs Cursor's AI to read this file and switch persona based on the requested stage. Use Cursor's "Composer" or chat with explicit role prefixes:

```
@product-owner I need triage for FEAT-123: <raw request>
@architect Now design FEAT-123 from the triaged context
…
```

### Inside any other tool

Open `AGENTS.md`, then `.claude/agents/<name>.md` for the role you need, paste the system prompt into the chat, and proceed. The tool only needs to read and write the shared `feature_context.json`.

## The shared context file

```jsonc
{
  "ticket_id": "FEAT-123",
  "title": "...",
  "status": "draft | triaged | designed | in_progress | tested | in_review | approved | rejected | merged",
  "created_at": "ISO-8601",
  "updated_at": "ISO-8601",
  "raw_request": "...",
  "product_requirements": {
    "summary": "...",
    "business_value": "...",
    "acceptance_criteria": [/* {id, given, when, then} */],
    "edge_cases": [/* {id, scenario, expected_behavior} */],
    "out_of_scope": ["..."],
    "owner_decisions": [/* {question, decision, rationale} */],
    "rejected_reason": null
  },
  "architecture_spec": {
    "summary": "...",
    "interfaces": [/* {name, file, definition} */],
    "api_contracts": [/* {method, path, auth, request, responses, idempotent} */],
    "schema_migrations": [/* {name, sql, destructive, deprecation_plan} */],
    "impacted_files": [/* {path, impact, reason} */],
    "feature_flag": {/* {key, default, description} */},
    "non_functional_requirements": ["..."]
  },
  "execution_log": [/* {timestamp, agent, action, files_created, files_modified, notes} */],
  "test_results": {
    "page_objects": ["..."],
    "test_files": ["..."],
    "acceptance_coverage": { "AC-1": ["file:test name"] },
    "edge_case_coverage": { "EC-1": ["..."] }
  },
  "review_status": "pending | APPROVED_FOR_MERGE | REJECTED_WITH_FEEDBACK",
  "review_feedback": [/* {severity, file, line, issue, fix_snippet} */]
}
```

The full JSON Schema (Draft 2020-12) is at `.aurora-pipeline/feature_context.schema.json`. Validate with:

```bash
npx ajv-cli validate \
  -s .aurora-pipeline/feature_context.schema.json \
  -d .aurora-pipeline/work/<TICKET-ID>/feature_context.json
```

## Strict ordering, no shortcuts

- **Never** skip a stage. An Engineer who wants to start writing code without the Architect's contract is no different from one who ignores code review.
- **Never** edit a section owned by another agent. The Product Owner does not touch `architecture_spec`; the Engineer does not touch `acceptance_criteria`.
- **Always** advance `status` by exactly one stage. If you bypass triage, the Reviewer rejects.

## Why this exists

Five small, specialized prompts are dramatically more reliable than one giant "build me this feature" prompt:

1. **Single responsibility** — each agent has a clear job and only that job.
2. **Visible state** — `feature_context.json` is auditable. You can re-run any stage in isolation.
3. **Cheap failure** — the cheapest stage to redo is triage; the most expensive is the gate. We push as many decisions as possible to the cheap end.
4. **Plays nicely with humans** — any stage's output is human-reviewable before the next agent picks it up.

If you find yourself fighting the pipeline, the answer is almost never "skip it." The answer is "the inputs to that stage are wrong; go back one step."
