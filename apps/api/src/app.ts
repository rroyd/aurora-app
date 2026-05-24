import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from '@/config/env.js';
import { attachUserIfPresent } from '@/middleware/auth.js';
import { errorHandler, notFoundHandler } from '@/middleware/error.js';
import { globalLimiter } from '@/middleware/rateLimit.js';
import { requestId } from '@/middleware/requestId.js';
import { timing } from '@/middleware/timing.js';
import { createAuthRepository } from '@/modules/auth/auth.repository.js';
import { createAuthRouter } from '@/modules/auth/auth.routes.js';
import { createAuthService } from '@/modules/auth/auth.service.js';
import { createCartRepository } from '@/modules/cart/cart.repository.js';
import { createCartRouter } from '@/modules/cart/cart.routes.js';
import { createCartService } from '@/modules/cart/cart.service.js';
import { createOrdersRepository } from '@/modules/orders/orders.repository.js';
import { createOrdersRouter } from '@/modules/orders/orders.routes.js';
import { createOrdersService } from '@/modules/orders/orders.service.js';
import { createMockPaymentProvider } from '@/modules/orders/payment.provider.js';
import { createProductsRepository } from '@/modules/products/products.repository.js';
import { createProductsRouter } from '@/modules/products/products.routes.js';
import { createProductsService } from '@/modules/products/products.service.js';
import { createUsersRepository } from '@/modules/users/users.repository.js';
import { createUsersRouter } from '@/modules/users/users.routes.js';
import { createUsersService } from '@/modules/users/users.service.js';
import { prisma } from '@/db/prisma.js';
import { logger } from '@/utils/logger.js';

export function createApp(): Express {
  const authRepo = createAuthRepository(prisma);
  const authService = createAuthService(authRepo);

  const productsRepo = createProductsRepository(prisma);
  const productsService = createProductsService(productsRepo);

  const cartRepo = createCartRepository(prisma);
  const cartService = createCartService(cartRepo);

  const usersRepo = createUsersRepository(prisma);
  const usersService = createUsersService(usersRepo);

  const ordersRepo = createOrdersRepository(prisma);
  const payment = createMockPaymentProvider();
  const ordersService = createOrdersService({
    orders: ordersRepo,
    cart: cartService,
    payment,
  });

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.WEB_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use(requestId());
  app.use(timing());
  app.use(pinoHttp({ logger, customProps: (req) => ({ requestId: req.id }) }));
  app.use(globalLimiter);
  app.use(attachUserIfPresent);

  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), version: '0.1.0' });
  });
  app.get('/readyz', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok' });
    } catch {
      res.status(503).json({ status: 'unavailable' });
    }
  });

  app.use('/v1/auth', createAuthRouter(authService));
  app.use('/v1/products', createProductsRouter(productsService));
  app.use('/v1/cart', createCartRouter(cartService));
  app.use('/v1/orders', createOrdersRouter(ordersService, (id) => usersRepo.getEmail(id)));
  app.use('/v1/users', createUsersRouter(usersService));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
