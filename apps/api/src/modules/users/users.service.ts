import argon2 from 'argon2';
import type { Address, ChangePasswordInput, UpdateProfileInput } from '@shared/contracts';
import { AppError } from '@/utils/AppError.js';
import type { UsersRepository } from './users.repository.js';

export interface UsersService {
  updateProfile(userId: string, input: UpdateProfileInput): Promise<void>;
  changePassword(userId: string, input: ChangePasswordInput): Promise<void>;
  listAddresses(userId: string): Promise<(Address & { id: string; isDefault: boolean })[]>;
  createAddress(
    userId: string,
    input: Address & { isDefault?: boolean },
  ): Promise<Address & { id: string; isDefault: boolean }>;
  deleteAddress(userId: string, addressId: string): Promise<void>;
  setDefaultAddress(userId: string, addressId: string): Promise<void>;
}

export function createUsersService(repo: UsersRepository): UsersService {
  return {
    async updateProfile(userId, input) {
      await repo.updateProfile(userId, {
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
      });
    },

    async changePassword(userId, input) {
      const current = await repo.getPasswordHash(userId);
      if (!current) throw AppError.notFound('User');
      const ok = await argon2.verify(current, input.currentPassword);
      if (!ok) throw AppError.validation('Current password is incorrect');
      const next = await argon2.hash(input.newPassword, { type: argon2.argon2id });
      await repo.setPasswordHash(userId, next);
    },

    async listAddresses(userId) {
      const rows = await repo.listAddresses(userId);
      return rows.map((r) => ({
        id: r.id,
        isDefault: r.isDefault,
        label: r.label,
        firstName: r.firstName,
        lastName: r.lastName,
        line1: r.line1,
        line2: r.line2 ?? undefined,
        city: r.city,
        region: r.region,
        postalCode: r.postalCode,
        country: r.country,
        phone: r.phone,
      }));
    },

    async createAddress(userId, input) {
      const created = await repo.createAddress(userId, {
        label: input.label ?? 'Home',
        firstName: input.firstName,
        lastName: input.lastName,
        line1: input.line1,
        line2: input.line2 ?? null,
        city: input.city,
        region: input.region,
        postalCode: input.postalCode,
        country: input.country,
        phone: input.phone,
        isDefault: !!input.isDefault,
      });
      if (input.isDefault) {
        await repo.setDefaultAddress(userId, created.id);
      }
      return {
        id: created.id,
        isDefault: created.isDefault,
        label: created.label,
        firstName: created.firstName,
        lastName: created.lastName,
        line1: created.line1,
        line2: created.line2 ?? undefined,
        city: created.city,
        region: created.region,
        postalCode: created.postalCode,
        country: created.country,
        phone: created.phone,
      };
    },

    async deleteAddress(userId, addressId) {
      await repo.deleteAddress(userId, addressId);
    },

    async setDefaultAddress(userId, addressId) {
      await repo.setDefaultAddress(userId, addressId);
    },
  };
}
