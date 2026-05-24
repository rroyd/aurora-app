---
description: Invoke the Architect agent to design the technical blueprint. Usage `/feature-design <TICKET-ID>`.
---

# Feature pipeline — design

Run the **Architect** agent.

## Steps

1. Resolve the ticket id from `$ARGUMENTS`, or pick the most recent `feature_context.json`.
2. Read the context. Refuse if `status !== "triaged"`.
3. Delegate to the **architect** subagent:
   ```
   Agent({
     subagent_type: "architect",
     description: "Design <TICKET_ID>",
     prompt: "Read .aurora-pipeline/work/<TICKET_ID>/feature_context.json (product_requirements). Apply your rules to architecture_spec, write back to the file, advance status to designed."
   })
   ```
4. Report: count of interfaces, API contracts, migrations, impacted files, feature flag key.
5. Next: `/feature-build`.
