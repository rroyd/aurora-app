---
description: Invoke the Product Owner agent to triage a feature. Usage `/feature-triage <TICKET-ID>` (defaults to most recent under .aurora-pipeline/work).
---

# Feature pipeline — triage

Run the **Product Owner** agent against an existing `feature_context.json`.

## Steps

1. Resolve the ticket id from `$ARGUMENTS`. If empty, pick the most recently modified `.aurora-pipeline/work/*/feature_context.json` and infer the ticket id.
2. Read the context file. Refuse if `status` is anything other than `"draft"` or `"rejected"` (the latter allows a re-triage after the user supplies more info).
3. Delegate to the **product-owner** subagent via the Agent tool:
   ```
   Agent({
     subagent_type: "product-owner",
     description: "Triage <TICKET_ID>",
     prompt: "Read .aurora-pipeline/work/<TICKET_ID>/feature_context.json, apply your rules to product_requirements, write back to the file, and report the result."
   })
   ```
4. After the agent returns, read the file and report a short summary:
   - status (`triaged` or `rejected`)
   - if accepted: count of acceptance criteria and edge cases
   - if rejected: the clarifying questions
   - the next command (`/feature-design` if triaged)
