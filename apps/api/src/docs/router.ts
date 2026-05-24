import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { buildOpenApiDocument } from './openapi.js';

export function createDocsRouter(): Router {
  const router = Router();
  const doc = buildOpenApiDocument();

  router.get('/openapi.json', (_req, res) => {
    res.json(doc);
  });

  // Swagger UI at /v1/docs
  router.use(
    '/',
    swaggerUi.serve,
    swaggerUi.setup(doc, {
      customSiteTitle: 'Aurora API — Docs',
      swaggerOptions: { persistAuthorization: true },
    }),
  );

  return router;
}
