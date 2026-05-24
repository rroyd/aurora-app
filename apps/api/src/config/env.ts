import 'dotenv/config';
import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    WEB_ORIGIN: z.string().url(),
    DATABASE_URL: z.string().min(1),
    SHADOW_DATABASE_URL: z.string().min(1).optional(),

    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    ACCESS_TOKEN_TTL: z.coerce.number().int().positive().default(900),
    REFRESH_TOKEN_TTL: z.coerce.number().int().positive().default(2_592_000),

    COOKIE_DOMAIN: z.string().optional().transform((v) => (v ? v : undefined)),
    COOKIE_SECURE: z
      .union([z.boolean(), z.enum(['true', 'false'])])
      .transform((v) => (typeof v === 'boolean' ? v : v === 'true'))
      .default(false),

    RATE_LIMIT_STORE: z.enum(['memory', 'redis']).default('memory'),
    LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  });

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  console.error(`Invalid environment configuration:\n${issues}`);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
