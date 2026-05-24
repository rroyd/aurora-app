# Aurora Feature Pipeline — Full Reference

This document explains the 5-agent feature pipeline at depth. For a tl;dr, see [`/AGENTS.md`](../../AGENTS.md). For the per-agent prompt that ships in this repo, see [`.claude/agents/`](../../.claude/agents).

## Mental model

```
┌─────────────────┐   ┌───────────┐   ┌──────────┐   ┌──────┐   ┌──────────┐
│ Product Owner   │ → │ Architect │ → │ Engineer │ → │ SDET │ → │ Reviewer │
└─────────────────┘   └───────────┘   └──────────┘   └──────┘   └──────────┘
        ▲                                                            │
        │                                                            ▼
   raw user input                                            APPROVED / REJECTED
```

Each agent reads from `feature_context.json` and writes back to it. There is **no** direct agent-to-agent message-passing — the file is the only communication channel.

## Status state machine

```text
        ┌───────────┐
        │  draft    │  ← /feature-init
        └─────┬─────┘
              │ product-owner
       ┌──────┴──────┐
       ▼             ▼
 ┌──────────┐  ┌──────────┐
 │ rejected │  │ triaged  │
 └────┬─────┘  └────┬─────┘
      │             │ architect
      │             ▼
      │       ┌──────────┐
      │       │ designed │
      │       └────┬─────┘
      │            │ engineer
      │            ▼
      │     ┌──────────────┐
      │     │ in_progress  │
      │     └──────┬───────┘
      │            │ sdet
      │            ▼
      │       ┌──────────┐
      │       │  tested  │
      │       └────┬─────┘
      │            │ reviewer
      │     ┌──────┴───────┐
      │     ▼              ▼
      │ ┌─────────┐  ┌──────────┐
      │ │approved │  │ rejected │ ───┐
      │ └────┬────┘  └──────────┘    │
      │      │ (manual)              │ (engineer/sdet redo)
      │      ▼                       │
      │  ┌─────────┐                 │
      │  │ merged  │                 │
      │  └─────────┘                 │
      │                              │
      └──────────────────────────────┘
```

Allowed transitions:

| From          | To                                    | Agent          |
| ------------- | ------------------------------------- | -------------- |
| `draft`       | `triaged` or `rejected`               | product-owner  |
| `rejected`    | `triaged`                             | product-owner  |
| `triaged`     | `designed`                            | architect      |
| `designed`    | `in_progress` (or `designed` on halt) | engineer       |
| `in_progress` | `tested`                              | sdet           |
| `tested`      | `approved` or `rejected`              | reviewer       |
| `approved`    | `merged`                              | human          |

Any other transition is a bug.

## Field ownership

| Field                                              | Owner          | Read by                            |
| -------------------------------------------------- | -------------- | ---------------------------------- |
| `ticket_id`, `title`, `created_at`, `raw_request`  | init           | all                                |
| `updated_at`, `status`                             | currently-active agent | all                        |
| `product_requirements.*`                           | product-owner  | architect, sdet, reviewer          |
| `architecture_spec.*`                              | architect      | engineer, sdet, reviewer           |
| `execution_log[]`                                  | append-only by every agent | reviewer               |
| `test_results.*`                                   | sdet           | reviewer                           |
| `review_status`, `review_feedback[]`               | reviewer       | engineer (on rejection)            |

> **Hard rule:** an agent that writes a field it doesn't own is buggy. The reviewer should reject such a PR.

## Files in this configuration

```
.aurora-pipeline/
├── feature_context.template.json      # Empty starter
├── feature_context.schema.json        # JSON Schema (2020-12)
├── README.md                          # Pointer
└── work/
    └── <TICKET-ID>/
        └── feature_context.json       # One per ticket

.claude/
├── agents/                            # The 5 system prompts (consumed by Claude Code subagents)
│   ├── product-owner.md
│   ├── architect.md
│   ├── engineer.md
│   ├── sdet.md
│   └── reviewer.md
└── commands/                          # Slash commands (user-invocable)
    ├── feature-init.md                # /feature-init
    ├── feature-triage.md              # /feature-triage
    ├── feature-design.md              # /feature-design
    ├── feature-build.md               # /feature-build
    ├── feature-test.md                # /feature-test
    ├── feature-review.md              # /feature-review
    └── feature-pipeline.md            # /feature-pipeline (chained)

.cursor/rules/                         # Per-stage Cursor rules
├── 00-pipeline.mdc                    # Always applies
├── 10-product-owner.mdc
├── 20-architect.mdc
├── 30-engineer.mdc
├── 40-sdet.mdc
└── 50-reviewer.mdc

.cursorrules                           # Legacy single-file Cursor config
.github/copilot-instructions.md        # GitHub Copilot project instructions

AGENTS.md                              # Top-level portable spec (universal pointer)
docs/agents/README.md                  # ← you are here
```

## End-to-end example

A user says: *"Add a price-range filter to the catalog."*

```bash
# 1. Bootstrap
/feature-init FEAT-128 "Add a price-range filter to the catalog"
# → .aurora-pipeline/work/FEAT-128/feature_context.json with status=draft

# 2. Triage
/feature-triage FEAT-128
# product-owner agent runs.
# After:
#   status = triaged
#   product_requirements.acceptance_criteria.length >= 3
#   product_requirements.edge_cases.length >= 3

# 3. Design
/feature-design FEAT-128
# architect agent runs.
# After:
#   status = designed
#   architecture_spec.interfaces  (e.g. extends listProductsQuerySchema)
#   architecture_spec.api_contracts  (GET /v1/products with minCents/maxCents)
#   architecture_spec.impacted_files  (5 entries)
#   architecture_spec.feature_flag = { key: 'catalog.priceFilter', default: false, ... }

# 4. Build
/feature-build FEAT-128
# engineer agent runs.
# Generated/modified files (example):
#   apps/api/src/modules/products/products.repository.ts
#   apps/api/src/modules/products/products.routes.ts
#   apps/web/src/pages/HomePage.tsx
#   packages/shared/src/schemas/product.ts
# After:
#   status = in_progress
#   execution_log has 1 new entry from "engineer"

# 5. Test
/feature-test FEAT-128
# sdet agent runs.
# Generated files (example):
#   apps/api/tests/integration/products-price-filter.test.ts
#   apps/web/e2e/pages/CatalogPage.ts
#   apps/web/e2e/catalog-price-filter.spec.ts
# After:
#   status = tested
#   test_results.acceptance_coverage = { "AC-1": ["..."], "AC-2": ["..."], "AC-3": ["..."] }
#   test_results.edge_case_coverage  = { "EC-1": [...], "EC-2": [...], "EC-3": [...] }

# 6. Review
/feature-review FEAT-128
# reviewer agent runs.
# Either:
#   status = approved, review_status = APPROVED_FOR_MERGE
# Or:
#   status = rejected, review_status = REJECTED_WITH_FEEDBACK, review_feedback = [...]
# If rejected, the engineer addresses the feedback and the cycle returns to /feature-build.
```

## Running in different IDEs

### Claude Code (CLI, VS Code, JetBrains plugin, web)

Slash commands work directly. The CLI reads `.claude/`.

```
/feature-pipeline FEAT-128 "Add a price-range filter to the catalog"
```

### Cursor

Cursor reads `.cursor/rules/*.mdc`. Engage roles via `@`-mentions in chat or Composer:

```
@product-owner I need triage for FEAT-128: <raw request>
```

Cursor's AI will read the matching `.claude/agents/product-owner.md` and follow its rules.

### GitHub Copilot Chat

Reads `.github/copilot-instructions.md`. Just describe the stage you need ("triage", "design", "review") and Copilot will switch personas based on the instructions there.

### JetBrains AI Assistant (native, not via Claude Code plugin)

There is no project-config standard yet for the native assistant. Paste the relevant `.claude/agents/<role>.md` content as the system prompt for that conversation. Better yet: install the Anthropic Claude plugin and use the slash commands directly.

### Anything else

Open `AGENTS.md`. Paste the relevant agent's system prompt. Write and read `feature_context.json`. That's all the pipeline requires.

## Anti-patterns

- **"I'll just do triage and design in one go."** → No. They have different success criteria. The Architect should not be reading the user's raw words; they should be reading the Product Owner's distilled BDD.
- **"This is too small for the pipeline; let me skip ahead."** → If it's truly tiny (a one-line typo fix), the pipeline does not need to run at all. If it warrants a PR, it warrants the pipeline.
- **"The Architect's contract has a small issue; I'll just tweak it as I implement."** → Halt. The Engineer's job description literally forbids this. Push it back to the Architect.
- **"I'll write tests for the happy path only."** → Reviewer will reject. Coverage for every `AC-*` and `EC-*` is non-negotiable.
- **"Reviewer rejected; I'll override and merge."** → No human bypass of the reviewer is part of the pipeline. If the reviewer's complaint is wrong, fix the prompt — don't bypass the gate.

## Extending the pipeline

To add a new agent (e.g., a Security Audit agent that runs after the Reviewer for sensitive features):

1. Add `.claude/agents/security-auditor.md` with frontmatter and a strict system prompt.
2. Add a new status to the schema (e.g., `audited`).
3. Add `.claude/commands/feature-audit.md`.
4. Update `AGENTS.md` and `docs/agents/README.md` to document the new stage.
5. Update `.cursor/rules/` if you want Cursor users to see the new role.

## Maintenance

- The five agent prompts (`.claude/agents/*.md`) are the source of truth. The Cursor / Copilot files are summaries that point at them. If you change a rule, update the agent file first, then make sure the summaries don't drift.
- Validate context files with `npx ajv-cli validate -s .aurora-pipeline/feature_context.schema.json -d <path>`.
