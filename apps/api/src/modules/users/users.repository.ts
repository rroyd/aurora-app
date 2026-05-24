import type { Prisma, PrismaClient } from '@prisma/client';

export interface UsersRepository {
  updateProfile(userId: string, data: { firstName: string; lastName: string }): Promise<void>;
  getPasswordHash(userId: string): Promise<string | null>;
  setPasswordHash(userId: string, passwordHash: string): Promise<void>;
  listAddresses(userId: string): Promise<Prisma.AddressGetPayload<{}>[]>;
  createAddress(userId: string, data: Omit<Prisma.AddressCreateManyInput, 'userId'>): Promise<Prisma.AddressGetPayload<{}>>;
  deleteAddress(userId: string, addressId: string): Promise<void>;
  setDefaultAddress(userId: string, addressId: string): Promise<void>;
  getEmail(userId: string): Promise<string>;
}

export function createUsersRepository(prisma: PrismaClient): UsersRepository {
  return {
    updateProfile: async (userId, data) => {
      await prisma.user.update({ where: { id: userId }, data });
    },
    getPasswordHash: async (userId) => {
      const u = await prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true },
      });
      return u?.passwordHash ?? null;
    },
    setPasswordHash: async (userId, passwordHash) => {
      await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    },
    listAddresses: (userId) =>
      prisma.address.findMany({ where: { userId }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] }),
    createAddress: (userId, data) =>
      prisma.address.create({ data: { ...data, userId } }),
    deleteAddress: async (userId, addressId) => {
      await prisma.address.deleteMany({ where: { id: addressId, userId } });
    },
    setDefaultAddress: async (userId, addressId) => {
      await prisma.$transaction([
        prisma.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } }),
        prisma.address.updateMany({ where: { id: addressId, userId }, data: { isDefault: true } }),
      ]);
    },
    getEmail: async (userId) => {
      const u = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
      return u?.email ?? '';
    },
  };
}
