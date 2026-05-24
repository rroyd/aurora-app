import { performance } from 'node:perf_hooks';
import type { RequestHandler } from 'express';
import { logger } from '@/utils/logger.js';

/**
 * Records per-request wall-clock duration and emits a single structured log
 * line on response. Sets the `Server-Timing` header so the duration is visible
 * in browser devtools for FE debugging. This is the foundation for a future
 * Prometheus histogram exporter.
 */
export const timing = (): RequestHandler => (req, res, next) => {
  const start = performance.now();
  res.on('finish', () => {
    const durationMs = +(performance.now() - start).toFixed(2);
    res.setHeader('Server-Timing', `app;dur=${durationMs}`);
    logger.info(
      {
        requestId: req.id,
        method: req.method,
        route: req.route?.path ?? req.path,
        status: res.statusCode,
        durationMs,
      },
      'request.completed',
    );
  });
  next();
};
