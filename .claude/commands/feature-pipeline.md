---
description: Run the FULL 5-stage feature pipeline end-to-end. Usage `/feature-pipeline <TICKET-ID> "<raw request>"`. Stops at the first stage that REJECTS.
---

# Feature pipeline — full run

Chain the five agents in order. Stop and report at the first rejection.

## Steps

1. **Init** — invoke `/feature-init <TICKET_ID> "<raw request>"` semantics: create the directory, copy the template, populate `raw_request`. Status starts at `draft`.
2. **Triage** — invoke the **product-owner** agent. If it sets `status = "rejected"`, STOP and report the clarifying questions. Otherwise continue.
3. **Design** — invoke the **architect** agent. Status moves to `designed`.
4. **Build** — invoke the **engineer** agent. If it returns `halted_for_architect_review`, STOP and report the contract flaw. Otherwise status moves to `in_progress`.
5. **Test** — invoke the **sdet** agent. Status moves to `tested`.
6. **Review** — invoke the **reviewer** agent. Status ends at `approved` or `rejected`.

## Reporting

At the end, print a one-line status of every stage:

```
✓ init      → draft
✓ triage    → triaged  (4 AC, 3 EC)
✓ design    → designed (2 interfaces, 1 API contract, 0 migrations, flag=catalog.priceFilter)
✓ build     → in_progress (5 files created, 3 modified, typecheck OK, tests 17/17)
✓ test      → tested (AC: 4/4, EC: 3/3, suites: 41/41)
✓ review    → APPROVED_FOR_MERGE
```

A rejection at any stage prints the same line for completed stages plus the rejection details.

## Strict ordering

Never invoke a stage out of order. Never run the pipeline against a ticket that already has `status = "approved"` or `"merged"`.
