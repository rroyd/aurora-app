# Models Used

Documenting which model handled which step, and **why** that model — so the process is reproducible and auditable.

| Stage                                          | Model              | Why                                                                                       |
| ---------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------- |
| Engineering guidelines (`ai/guidelines/`)      | Claude Opus 4.7    | Long-form structured writing benefits from the strongest reasoning model.                  |
| Capability docs (`ai/capabilities/`)           | Claude Opus 4.7    | Same — these documents are the public contract the AI generates against.                   |
| `ai/initial.md` (bootstrap)                    | Claude Opus 4.7    | High-leverage prompt; mistakes propagate everywhere.                                       |
| Prisma schema + seed data                      | Claude Opus 4.7    | Schema design is reasoning-heavy; mistakes here are expensive to roll back.                |
| Backend modules (auth, products, cart, orders) | Claude Opus 4.7    | Multi-file edits with cross-module consistency; benefits from larger context window.       |
| Frontend pages and feature slices              | Claude Opus 4.7    | UX polish + cross-page consistency.                                                        |
| UI primitives (Button, Input, etc.)            | Claude Sonnet 4.6  | Single-file, well-defined output — Sonnet is fast and sufficient here.                     |
| Unit / component tests                         | Claude Sonnet 4.6  | Tests are mechanical given the source files; faster model wins.                            |
| Documentation polish (this file, README)       | Claude Opus 4.7    | Tone, structure, and accuracy matter more than speed.                                      |

## Model-selection rules of thumb

- **Use Opus for "load-bearing" work**: the blueprint, schema, anything that gets referenced from many other places.
- **Use Sonnet for "leaf" work**: a single isolated component, a single test, a single util.
- **Use Haiku for "lookup" work** (none in this project): trivial reformatting, simple data extraction.
- **Always do prompt caching** when interacting with the API: long system prompts (guidelines + capabilities) are cache-eligible and dramatically reduce cost on repeated calls.
