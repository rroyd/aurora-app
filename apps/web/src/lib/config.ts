import { z } from 'zod';

const schema = z.object({
  VITE_API_BASE_URL: z.string().url().default('http://localhost:4000'),
});

const parsed = schema.safeParse(import.meta.env);
if (!parsed.success) {
  throw new Error(`Invalid env: ${parsed.error.message}`);
}

export const config = {
  apiBaseUrl: parsed.data.VITE_API_BASE_URL.replace(/\/$/, ''),
};
