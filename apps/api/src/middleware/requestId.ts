import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

// Request.id is augmented globally in src/types/express.d.ts.

export const requestId = (): RequestHandler => (req, res, next) => {
  const incoming = req.header('x-request-id');
  req.id = incoming && /^[\w-]{8,128}$/.test(incoming) ? incoming : randomUUID();
  res.setHeader('x-request-id', req.id);
  next();
};
