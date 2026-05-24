# 03 — Folder Structure (canonical)

```
ai-blueprint-ecommerce/
├── ai/                                # AI Blueprint (the "engine")
│   ├── initial.md                     # Bootstrap prompt
│   ├── guidelines/                    # How the AI must build
│   ├── capabilities/                  # What the AI can use
│   └── interactions/                  # Meta: prompts, models, tools used
│
├── apps/
│   ├── api/                           # Backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── seed.ts
│   │   │   └── migrations/
│   │   ├── src/
│   │   │   ├── config/env.ts          # Zod-validated env
│   │   │   ├── db/prisma.ts           # Prisma singleton
│   │   │   ├── middleware/            # auth, error, requestId, rateLimit
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── products/
│   │   │   │   ├── cart/
│   │   │   │   ├── orders/
│   │   │   │   └── users/
│   │   │   ├── utils/
│   │   │   ├── app.ts                 # Express app factory
│   │   │   └── server.ts              # Bootstrap, listen
│   │   ├── tests/
│   │   ├── .env.example
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                           # Frontend
│       ├── public/
│       ├── src/
│       │   ├── routes/
│       │   ├── pages/
│       │   ├── features/
│       │   ├── components/{ui,layout}/
│       │   ├── lib/{api,auth,config,utils}.ts
│       │   ├── hooks/
│       │   ├── stores/
│       │   ├── styles/index.css
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── tests/
│       ├── index.html
│       ├── tailwind.config.ts
│       ├── postcss.config.js
│       ├── vite.config.ts
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   └── shared/                        # Shared between FE/BE
│       ├── src/
│       │   ├── schemas/               # Zod schemas (auth, product, cart, order)
│       │   ├── types/                 # Inferred types
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── scripts/                           # One-off scripts (seed-images, etc.)
├── docs/                              # Architecture diagrams, ADRs
├── docker-compose.yml
├── package.json                       # Root workspace
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .prettierrc
├── .editorconfig
├── .gitignore
└── README.md
```

## File-Naming Rules

| Kind                | Convention                | Example                          |
| ------------------- | ------------------------- | -------------------------------- |
| React component     | PascalCase                | `ProductCard.tsx`                |
| Hook                | camelCase, `use` prefix   | `useDebounce.ts`                 |
| Zustand store       | camelCase, `.store.ts`    | `cart.store.ts`                  |
| Express route       | kebab-case domain         | `products.routes.ts`             |
| Service / repo      | kebab-case domain         | `products.service.ts`            |
| Zod schema          | kebab-case domain         | `products.schema.ts`             |
| Test file           | mirror with `.test.ts`    | `products.service.test.ts`       |
| Type-only module    | `*.types.ts`              | `cart.types.ts`                  |

## Forbidden Patterns

- ❌ A `utils/` dump folder with unrelated helpers. Co-locate utilities with the feature that uses them; promote to `lib/` only when ≥2 features need it.
- ❌ Default exports for components (named exports only — easier refactor).
- ❌ Cross-feature imports (`features/products/...` MUST NOT import from `features/cart/...`). Use `@shared` or `lib/` for the seam.
- ❌ Mixing concerns in one file (no controller+service in the same file).
