import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be 72 characters or fewer')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/[0-9]/, 'Must contain a digit');

export const registerSchema = z
  .object({
    email: z.string().email(),
    password: passwordSchema,
    firstName: z.string().min(1).max(80),
    lastName: z.string().min(1).max(80),
  })
  .strict();
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(1).max(72),
  })
  .strict();
export type LoginInput = z.infer<typeof loginSchema>;

export const publicUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(['CUSTOMER', 'ADMIN']),
  createdAt: z.string(),
});
export type PublicUser = z.infer<typeof publicUserSchema>;

export const authSessionSchema = z.object({
  user: publicUserSchema,
  accessToken: z.string(),
  expiresAt: z.string(),
});
export type AuthSession = z.infer<typeof authSessionSchema>;
