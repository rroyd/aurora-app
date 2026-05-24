---
description: Invoke the Reviewer agent to gate the PR before merge. Usage `/feature-review <TICKET-ID>`.
---

# Feature pipeline — review

Run the **Reviewer** agent.

## Steps

1. Resolve the ticket id.
2. Refuse if `status !== "tested"`.
3. Delegate to the **reviewer** subagent:
   ```
   Agent({
     subagent_type: "reviewer",
     description: "Final review for <TICKET_ID>",
     prompt: "Read .aurora-pipeline/work/<TICKET_ID>/feature_context.json AND the diff vs origin/main. Apply your rules. Output APPROVED_FOR_MERGE or REJECTED_WITH_FEEDBACK with actionable line-level snippets. Update review_status and status."
   })
   ```
4. Report the final verdict verbatim.
5. If approved → suggest `gh pr create` (do not push automatically).
6. If rejected → list each issue with file:line and the proposed fix snippet. The Engineer (or you) can address them and re-run `/feature-build` → `/feature-test` → `/feature-review`.
