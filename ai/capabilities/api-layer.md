# Capability — API Layer (Express)

## App Composition

```ts
// apps/api/src/app.ts
export function createApp(deps: AppDependencies) {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use(requestId());            // populate req.id
  app.use(httpLogger());           // pino-http
  app.use('/auth', authRouter(deps));
  app.use('/products', productsRouter(deps));
  app.use('/cart', cartRouter(deps));
  app.use('/orders', ordersRouter(deps));
  app.use('/users', usersRouter(deps));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
```

## Module Wiring

`createApp` accepts a `deps` object (DI) so tests can substitute repositories / clocks / token services. In production, a `composition.ts` file builds the real deps from Prisma + env.

## Controller Pattern

```ts
// products.controller.ts
export function productsController(svc: ProductsService) {
  return {
    list: async (req: Request, res: Response) => {
      const query = listProductsSchema.parse(req.query);
      const result = await svc.search(query);
      res.json(result);
    },
    detail: async (req: Request, res: Response) => {
      const { slug } = paramsSlugSchema.parse(req.params);
      const product = await svc.getBySlug(slug);
      res.json(product);
    },
  };
}
```

- Controllers are thin: parse → call service → return JSON.
- They never `try/catch`. They throw — the error middleware formats.

## Validation Helpers

```ts
// utils/validate.ts
export const validateBody = <T extends z.ZodTypeAny>(schema: T) =>
  (req: Request, _res: Response, next: NextFunction) => {
    req.body = schema.parse(req.body);
    next();
  };
```

Mounted as middleware in routes for endpoints with bodies. Controllers can still parse query/params inline.

## Response Conventions

- Success: bare JSON of the resource or `{ items, nextCursor }` for lists.
- Error: the shape in `guidelines/05-error-handling.md`.
- Status codes:
  - `200` GET / PATCH success
  - `201` POST creating a resource
  - `204` DELETE
  - `400` validation error
  - `401` unauthenticated
  - `403` unauthorized
  - `404` not found
  - `409` conflict (e.g., duplicate email)
  - `429` rate limited
  - `500` internal

## Health & Ops

- `GET /healthz` → `{ status: 'ok', uptime, version }`. No DB hit.
- `GET /readyz` → 200 if DB ping succeeds.

## Versioning

Routes live at `/v1/*` from day 1 (`/auth`, etc. are mounted under `/v1`). The blueprint's example paths omit `/v1` for brevity but the AI MUST prefix all routes with `/v1`.
