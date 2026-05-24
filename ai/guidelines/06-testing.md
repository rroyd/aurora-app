# 06 — Testing Strategy

## Pyramid

```
        ┌────────────┐
        │   E2E (Playwright, optional)
        ├────────────┤
        │ Integration (Vitest + supertest, real Prisma against test DB)
        ├────────────┤
        │   Unit (Vitest, no I/O, fast)
        └────────────┘
```

## What to Test

| Layer        | Tested by      | Example                                                |
| ------------ | -------------- | ------------------------------------------------------ |
| Service      | Unit           | Cart totals, discount math, password hashing           |
| Repository   | Integration    | Real DB; pagination, soft-deletes, transactions        |
| Controller   | Integration    | Full HTTP path through middleware → 200/400/401/404    |
| Component    | Unit           | Renders branches, fires callbacks                      |
| Hook         | Unit           | State transitions; mocked TanStack Query              |
| Critical flow| E2E            | Sign up → browse → cart → checkout → see order        |

## Conventions

- File mirrors source: `cart.service.ts` ↔ `cart.service.test.ts` (sibling).
- One `describe` per public function. `it.each` for parametric cases.
- Test names read like sentences: `it('rejects orders with empty cart', …)`.
- No shared mutable fixtures across tests — each test seeds what it needs.
- Use **arrange / act / assert** spacing.

## Coverage

- Required ≥ 70% for `apps/api/src/modules/**/{service,repository}.ts`.
- Required ≥ 60% for `features/**/api.ts` and `features/**/components/`.
- Do **not** chase coverage by testing implementation details.

## Mocks

- Mock at the **integration boundary**, not inside the service. The service should be tested with a fake repository implementing the same interface, not with `vi.mock`'d Prisma.
- For HTTP from the frontend, use `msw` to mock the network at the network layer.

## Speed Budget

- Unit suite: < 5 s.
- Integration suite: < 60 s.
- Anything slower → split or move to E2E.
