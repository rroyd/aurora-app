import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ChangePasswordInput,
  PublicUser,
  UpdateProfileInput,
} from '@shared/contracts';
import { authKeys } from '@/features/auth/api';
import { apiRequest } from '@/lib/api';

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) =>
      apiRequest<PublicUser | void>('/v1/users/me', { method: 'PATCH', body: input }),
    onSuccess: (updated) => {
      if (updated) {
        qc.setQueryData(authKeys.me, updated);
      } else {
        qc.invalidateQueries({ queryKey: authKeys.me });
      }
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) =>
      apiRequest<void>('/v1/users/me/password', { method: 'POST', body: input }),
  });
}
