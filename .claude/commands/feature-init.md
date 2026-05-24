---
description: Bootstrap a new feature ticket. Usage `/feature-init <TICKET-ID> "<raw request>"`. Creates .aurora-pipeline/work/<TICKET>/feature_context.json from the template.
---

# Feature pipeline — init

Bootstrap a new feature ticket so the rest of the pipeline can take over.

## Steps

1. Parse `$ARGUMENTS` — first token is the ticket id (e.g. `FEAT-123`), the rest is the raw request quoted by the user.
2. If the ticket id does not match `^[A-Z]+-\d+$`, stop and ask the user for a properly formatted id.
3. Create the directory `.aurora-pipeline/work/<TICKET_ID>/`.
4. Copy `.aurora-pipeline/feature_context.template.json` to `.aurora-pipeline/work/<TICKET_ID>/feature_context.json`.
5. Edit the new file: set `ticket_id`, set `created_at` and `updated_at` (ISO 8601 UTC), set `raw_request` to whatever the user supplied (or leave empty if none).
6. Report:
   - Where the file lives.
   - The next step (`/feature-triage`).
   - The full pipeline order: triage → design → build → test → review.

## Do not

- Do NOT advance status. Status stays `"draft"` until the Product Owner runs.
- Do NOT generate any product requirements yourself. That is the Product Owner agent's job.
