import { useMe } from './api';

export function useAuth() {
  const { data, isLoading } = useMe();
  return {
    user: data ?? null,
    isAuthenticated: !!data,
    isLoading,
  };
}
