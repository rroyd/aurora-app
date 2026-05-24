import { createHash, randomBytes, randomUUID } from 'node:crypto';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import type {
  AuthSession,
  LoginInput,
  PublicUser,
  RegisterInput,
} from '@shared/contracts';
import { env } from '@/config/env.js';
import { AppError } from '@/utils/AppError.js';
import type { AuthRepository } from './auth.repository.js';

function toPublicUser(u: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'CUSTOMER' | 'ADMIN';
  createdAt: Date;
}): PublicUser {
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
  };
}

function signAccessToken(userId: string, role: 'CUSTOMER' | 'ADMIN'): string {
  return jwt.sign({ role }, env.JWT_ACCESS_SECRET, {
    subject: userId,
    expiresIn: env.ACCESS_TOKEN_TTL,
  });
}

function generateRefreshToken(): { plaintext: string; hash: string } {
  const plaintext = randomBytes(64).toString('base64url');
  const hash = createHash('sha256').update(plaintext).digest('hex');
  return { plaintext, hash };
}

export interface AuthService {
  register(input: RegisterInput): Promise<{ session: AuthSession; refreshToken: string }>;
  login(input: LoginInput): Promise<{ session: AuthSession; refreshToken: string }>;
  refresh(refreshToken: string): Promise<{ session: AuthSession; refreshToken: string }>;
  logout(refreshToken: string): Promise<void>;
  me(userId: string): Promise<PublicUser>;
}

export function createAuthService(repo: AuthRepository): AuthService {
  async function issueSession(user: {
    id: string;
    role: 'CUSTOMER' | 'ADMIN';
    email: string;
    firstName: string;
    lastName: string;
    createdAt: Date;
  }, familyId: string): Promise<{ session: AuthSession; refreshToken: string }> {
    const accessToken = signAccessToken(user.id, user.role);
    const refresh = generateRefreshToken();
    const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL * 1000);
    await repo.createRefreshToken({
      userId: user.id,
      tokenHash: refresh.hash,
      familyId,
      expiresAt,
    });
    const accessExpiresAt = new Date(Date.now() + env.ACCESS_TOKEN_TTL * 1000).toISOString();
    return {
      session: {
        user: toPublicUser(user),
        accessToken,
        expiresAt: accessExpiresAt,
      },
      refreshToken: refresh.plaintext,
    };
  }

  return {
    async register(input) {
      const existing = await repo.findUserByEmail(input.email.toLowerCase());
      if (existing) throw AppError.conflict('Email already in use');
      const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
      const user = await repo.createUser({
        email: input.email.toLowerCase(),
        passwordHash,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
      });
      return issueSession(user, randomUUID());
    },

    async login(input) {
      const user = await repo.findUserByEmail(input.email.toLowerCase());
      const fakeHash =
        '$argon2id$v=19$m=65536,t=3,p=1$YWFhYWFhYWFhYWFhYWFhYQ$' +
        'XBkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRk';
      const ok = user
        ? await argon2.verify(user.passwordHash, input.password)
        : (await argon2.verify(fakeHash, input.password).catch(() => false), false);
      if (!user || !ok) throw AppError.unauthenticated('Invalid email or password');
      return issueSession(user, randomUUID());
    },

    async refresh(refreshToken) {
      if (!refreshToken) throw AppError.unauthenticated();
      const hash = createHash('sha256').update(refreshToken).digest('hex');
      const record = await repo.findRefreshTokenByHash(hash);
      if (!record) throw AppError.unauthenticated('Invalid refresh token');
      if (record.expiresAt.getTime() < Date.now()) {
        throw AppError.unauthenticated('Refresh token expired');
      }
      if (record.revokedAt) {
        await repo.revokeFamily(record.familyId);
        throw AppError.unauthenticated('Refresh token reuse detected');
      }
      const user = await repo.findUserById(record.userId);
      if (!user) throw AppError.unauthenticated();
      await repo.revokeRefreshTokenById(record.id);
      return issueSession(user, record.familyId);
    },

    async logout(refreshToken) {
      if (!refreshToken) return;
      const hash = createHash('sha256').update(refreshToken).digest('hex');
      const record = await repo.findRefreshTokenByHash(hash);
      if (record && !record.revokedAt) {
        await repo.revokeRefreshTokenById(record.id);
      }
    },

    async me(userId) {
      const user = await repo.findUserById(userId);
      if (!user) throw AppError.notFound('User');
      return toPublicUser(user);
    },
  };
}
