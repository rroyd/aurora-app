---
description: Invoke the SDET agent to write tests covering every AC and EC. Usage `/feature-test <TICKET-ID>`.
---

# Feature pipeline — test

Run the **SDET** agent.

## Steps

1. Resolve the ticket id.
2. Refuse if `status !== "in_progress"`.
3. Delegate to the **sdet** subagent:
   ```
   Agent({
     subagent_type: "sdet",
     description: "Write tests for <TICKET_ID>",
     prompt: "Read .aurora-pipeline/work/<TICKET_ID>/feature_context.json. Write Vitest integration tests + Playwright E2E (POM) so every AC and EC is covered. Run all suites and advance status to tested."
   })
   ```
4. Report:
   - Tests added (path:test_name list)
   - AC coverage map
   - EC coverage map
   - Pass/fail of `pnpm test`, `pnpm test:int`, and (if present) `pnpm --filter @app/web test:e2e`.
5. Next: `/feature-review`.
