---
description: Invoke the Engineer agent to implement the feature according to the Architect's spec. Usage `/feature-build <TICKET-ID>`.
---

# Feature pipeline — build

Run the **Engineer** agent.

## Steps

1. Resolve the ticket id.
2. Refuse if `status !== "designed"`.
3. Delegate to the **engineer** subagent:
   ```
   Agent({
     subagent_type: "engineer",
     description: "Implement <TICKET_ID>",
     prompt: "Read .aurora-pipeline/work/<TICKET_ID>/feature_context.json. Implement the architecture_spec exactly. Halt and flag (do not diverge) if the spec is flawed. Update execution_log and set status to in_progress when finished."
   })
   ```
4. Report:
   - Number of files created vs. modified.
   - `pnpm typecheck` result.
   - `pnpm test` result.
   - Whether the agent halted with `halted_for_architect_review` (if so, surface the reason).
5. Next: `/feature-test`.
