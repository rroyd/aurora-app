import { performance } from 'node:perf_hooks';
import type { RequestHandler } from 'express';
import { logger } from '@/utils/logger.js';

/**
 * Records per-request wall-clock duration and emits a structured log line on
 * response. The `Server-Timing` header is added BEFORE flushing (via writeHead
 * interception) so the duration is visible in browser devtools.
 *
 * This is the foundation for a future Prometheus histogram exporter.
 */
export const timing = (): RequestHandler => (req, res, next) => {
  const start = performance.now();

  const originalWriteHead = res.writeHead.bind(res);
  res.writeHead = ((...args: Parameters<typeof originalWriteHead>) => {
    const durationMs = +(performance.now() - start).toFixed(2);
    if (!res.headersSent) {
      res.setHeader('Server-Timing', `app;dur=${durationMs}`);
    }
    return originalWriteHead(...args);
  }) as typeof originalWriteHead;

  res.on('finish', () => {
    const durationMs = +(performance.now() - start).toFixed(2);
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
