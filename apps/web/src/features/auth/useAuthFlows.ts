import { useNavigate } from 'react-router-dom';
import type { LoginInput, RegisterInput } from '@shared/contracts';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/api';
import { useLogin, useRegister } from './api';

export function useLoginFlow(redirectTo = '/') {
  const navigate = useNavigate();
  const toast = useToast();
  const login = useLogin();

  async function submit(values: LoginInput) {
    try {
      await login.mutateAsync(values);
      toast.success('Welcome back');
      navigate(redirectTo);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Could not sign in';
      toast.error('Sign-in failed', msg);
    }
  }

  return { submit, isPending: login.isPending };
}

export function useSignupFlow(redirectTo = '/') {
  const navigate = useNavigate();
  const toast = useToast();
  const register = useRegister();

  async function submit(values: RegisterInput) {
    try {
      await register.mutateAsync(values);
      toast.success('Welcome to Aurora');
      navigate(redirectTo);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Could not sign up';
      toast.error('Sign-up failed', msg);
    }
  }

  return { submit, isPending: register.isPending };
}
