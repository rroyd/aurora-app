# Aurora Feature Pipeline — Shared State

This directory hosts the **shared context file** that all five pipeline agents read from and write to. It is the only allowed channel of communication between agents.

## Files

| File                              | Purpose                                                        |
| --------------------------------- | -------------------------------------------------------------- |
| `feature_context.template.json`   | Empty template — copied to `work/<ticket>/feature_context.json` |
| `feature_context.schema.json`     | JSON Schema (draft 2020-12). Validates structure before merge. |
| `work/<TICKET>/feature_context.json` | The live state file for one ticket. Created by `/feature-init`. |

## Lifecycle

```
draft → triaged → designed → in_progress → tested → in_review → approved → merged
                                                          ↘
                                                       rejected ↻ (back to in_progress)
```

Each agent advances `status` exactly one stage forward. Agents must NEVER skip stages.

## Validating manually

```bash
# Requires ajv-cli, jsonschema, or similar
npx ajv-cli validate \
  -s .aurora-pipeline/feature_context.schema.json \
  -d .aurora-pipeline/work/FEAT-123/feature_context.json
```

The pre-merge reviewer agent runs this automatically.
