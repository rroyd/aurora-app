import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { loginSchema, type LoginInput } from '@shared/contracts';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { PageTransition } from '@/components/layout/PageTransition';
import { useLogin } from '@/features/auth/api';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/api';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values);
      toast.success('Welcome back');
      navigate('/');
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Could not sign in';
      toast.error('Sign-in failed', msg);
    }
  });

  return (
    <PageTransition>
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-ink-muted">Sign in to continue shopping.</p>

        <form onSubmit={onSubmit} noValidate className="mt-8 space-y-4">
          <Field label="Email" error={errors.email?.message}>
            {(p) => <Input type="email" autoComplete="email" {...register('email')} {...p} />}
          </Field>
          <Field label="Password" error={errors.password?.message}>
            {(p) => (
              <Input
                type="password"
                autoComplete="current-password"
                {...register('password')}
                {...p}
              />
            )}
          </Field>
          <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          No account?{' '}
          <Link to="/signup" className="font-medium text-brand-600 hover:underline">
            Create one
          </Link>
        </p>

        <div className="mt-8 rounded-lg bg-surface-muted p-4 text-xs text-ink-muted">
          <p className="font-semibold text-ink">Demo credentials</p>
          <p>Email: demo@shop.dev / Password: Password123!</p>
        </div>
      </div>
    </PageTransition>
  );
}
