import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AuthSession, LoginInput, PublicUser, RegisterInput } from '@shared/contracts';
import { ApiError, apiRequest } from '@/lib/api';

export const authKeys = {
  me: ['auth', 'me'] as const,
};

export function useMe() {
  return useQuery<PublicUser | null>({
    queryKey: authKeys.me,
    queryFn: async () => {
      try {
        return await apiRequest<PublicUser>('/v1/auth/me');
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null;
        throw e;
      }
    },
    retry: false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) =>
      apiRequest<AuthSession>('/v1/auth/login', { method: 'POST', body: input, skipRefresh: true }),
    onSuccess: (session) => {
      qc.setQueryData(authKeys.me, session.user);
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterInput) =>
      apiRequest<AuthSession>('/v1/auth/register', { method: 'POST', body: input, skipRefresh: true }),
    onSuccess: (session) => {
      qc.setQueryData(authKeys.me, session.user);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest<void>('/v1/auth/logout', { method: 'POST', skipRefresh: true }),
    onSuccess: () => {
      qc.setQueryData(authKeys.me, null);
      qc.clear();
    },
  });
}
