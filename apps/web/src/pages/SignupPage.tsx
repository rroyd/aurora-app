import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { registerSchema, type RegisterInput } from '@shared/contracts';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { PageTransition } from '@/components/layout/PageTransition';
import { useRegister } from '@/features/auth/api';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/api';

export function SignupPage() {
  const navigate = useNavigate();
  const register = useRegister();
  const toast = useToast();
  const {
    register: rhf,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await register.mutateAsync(values);
      toast.success('Welcome to Aurora');
      navigate('/');
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Could not sign up';
      toast.error('Sign-up failed', msg);
    }
  });

  return (
    <PageTransition>
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Free, takes 30 seconds. We never share your info.
        </p>

        <form onSubmit={onSubmit} noValidate className="mt-8 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name" error={errors.firstName?.message}>
              {(p) => <Input autoComplete="given-name" {...rhf('firstName')} {...p} />}
            </Field>
            <Field label="Last name" error={errors.lastName?.message}>
              {(p) => <Input autoComplete="family-name" {...rhf('lastName')} {...p} />}
            </Field>
          </div>
          <Field label="Email" error={errors.email?.message}>
            {(p) => <Input type="email" autoComplete="email" {...rhf('email')} {...p} />}
          </Field>
          <Field
            label="Password"
            error={errors.password?.message}
            hint="At least 8 characters, with upper, lower, and a digit."
          >
            {(p) => (
              <Input type="password" autoComplete="new-password" {...rhf('password')} {...p} />
            )}
          </Field>
          <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </PageTransition>
  );
}
