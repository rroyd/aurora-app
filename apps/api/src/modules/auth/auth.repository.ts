import type { PrismaClient, Role, User } from '@prisma/client';

export interface AuthRepository {
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
  createUser(input: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    role?: Role;
  }): Promise<User>;
  createRefreshToken(input: {
    userId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
  }): Promise<void>;
  findRefreshTokenByHash(tokenHash: string): Promise<{
    id: string;
    userId: string;
    familyId: string;
    revokedAt: Date | null;
    expiresAt: Date;
  } | null>;
  revokeRefreshTokenById(id: string): Promise<void>;
  revokeFamily(familyId: string): Promise<void>;
}

export function createAuthRepository(prisma: PrismaClient): AuthRepository {
  return {
    findUserByEmail: (email) => prisma.user.findUnique({ where: { email } }),
    findUserById: (id) => prisma.user.findUnique({ where: { id } }),
    createUser: ({ email, passwordHash, firstName, lastName, role }) =>
      prisma.user.create({
        data: { email, passwordHash, firstName, lastName, role: role ?? 'CUSTOMER' },
      }),
    createRefreshToken: async ({ userId, tokenHash, familyId, expiresAt }) => {
      await prisma.refreshToken.create({ data: { userId, tokenHash, familyId, expiresAt } });
    },
    findRefreshTokenByHash: (tokenHash) =>
      prisma.refreshToken.findUnique({
        where: { tokenHash },
        select: { id: true, userId: true, familyId: true, revokedAt: true, expiresAt: true },
      }),
    revokeRefreshTokenById: async (id) => {
      await prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } });
    },
    revokeFamily: async (familyId) => {
      await prisma.refreshToken.updateMany({
        where: { familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    },
  };
}
