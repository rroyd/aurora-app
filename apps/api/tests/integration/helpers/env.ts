// MUST be imported (or its side-effects loaded) before any application module.
// Sets env vars so config/env.ts validates and Prisma client points at the test DB.
import 'dotenv/config';

function fallback(key: string, value: string): void {
  if (!process.env[key]) process.env[key] = value;
}

process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = process.env.LOG_LEVEL ?? 'warn';

// Test DB — override via TEST_DATABASE_URL in CI
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'mysql://root:rootpw@127.0.0.1:3306/ecommerce_test';

fallback('WEB_ORIGIN', 'http://localhost:5173');
fallback('JWT_ACCESS_SECRET', 'test-access-secret-must-be-32-bytes-min-aaaa');
fallback('JWT_REFRESH_SECRET', 'test-refresh-secret-must-be-32-bytes-min-bbbb');
// Force-clear COOKIE_DOMAIN — supertest hits 127.0.0.1, and an explicit
// "domain=localhost" Set-Cookie attribute makes the agent drop the cookie.
process.env.COOKIE_DOMAIN = '';
fallback('COOKIE_SECURE', 'false');
fallback('ACCESS_TOKEN_TTL', '900');
fallback('REFRESH_TOKEN_TTL', '2592000');
fallback('RATE_LIMIT_STORE', 'memory');
fallback('PORT', '4000');
