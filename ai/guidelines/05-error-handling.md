# 05 — Error Handling Strategy

## Principles

1. **Fail fast at boundaries.** Validate every external input (HTTP body, env, third-party response) with Zod.
2. **Throw inside, format at edge.** Services throw typed `AppError`s. A single error middleware on the API renders the HTTP response.
3. **Never leak internals.** Stack traces and Prisma error codes never reach the client in production.
4. **Errors are data.** They have a stable `code` so the frontend can branch on them programmatically.

## Backend: `AppError`

```ts
// apps/api/src/utils/AppError.ts
export type AppErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL';

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    public readonly httpStatus: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```

Helpers: `AppError.notFound('Product')`, `AppError.unauthenticated()`, etc.

## Uniform Error Response Shape

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      { "path": "email", "message": "Invalid email" }
    ],
    "requestId": "8c4d…"
  }
}
```

- `code` is always one of `AppErrorCode`.
- `details` is optional; present for validation errors.
- `requestId` always present (injected by request-id middleware).

## Error Middleware (sketch)

```ts
// middleware/error.ts
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const requestId = req.id;
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: err.flatten(), requestId },
    });
  }
  if (err instanceof AppError) {
    return res.status(err.httpStatus).json({
      error: { code: err.code, message: err.message, details: err.details, requestId },
    });
  }
  logger.error({ err, requestId }, 'unhandled error');
  return res.status(500).json({
    error: { code: 'INTERNAL', message: 'Something went wrong', requestId },
  });
};
```

## Frontend Error Handling

- The API client (`lib/api.ts`) parses error responses into a typed `ApiError` object.
- TanStack Query: components consume `error` from `useQuery` / `useMutation` and render via a shared `<ErrorState code={...}/>` component.
- A global toast handler maps `code → friendly message`. Validation errors render inline next to the field.

## What NOT To Do

- ❌ `try { … } catch (e) { console.log(e) }` — swallowing.
- ❌ Returning `null` to indicate an error in a service (use throw + typed code).
- ❌ Exposing Prisma `P2002` or SQL errors to the client.
- ❌ Multiple shapes of error response across endpoints.
