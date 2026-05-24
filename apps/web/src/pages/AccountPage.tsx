import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  changePasswordSchema,
  updateProfileSchema,
  type ChangePasswordInput,
  type UpdateProfileInput,
} from '@shared/contracts';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { PageTransition } from '@/components/layout/PageTransition';
import { useAuth } from '@/features/auth/useAuth';
import { apiRequest } from '@/lib/api';

export function AccountPage() {
  const { user } = useAuth();
  const toast = useToast();
  const profile = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { firstName: user?.firstName ?? '', lastName: user?.lastName ?? '' },
  });
  const password = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const saveProfile = profile.handleSubmit(async (values) => {
    try {
      await apiRequest<void>('/v1/users/me', { method: 'PATCH', body: values });
      toast.success('Profile updated');
    } catch {
      toast.error('Could not update profile');
    }
  });

  const savePassword = password.handleSubmit(async (values) => {
    try {
      await apiRequest<void>('/v1/users/me/password', { method: 'POST', body: values });
      password.reset();
      toast.success('Password changed');
    } catch (e) {
      toast.error('Could not change password', (e as Error).message);
    }
  });

  return (
    <PageTransition>
      <h1 className="text-3xl font-bold">Account</h1>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card className="space-y-4 p-6">
          <h2 className="text-lg font-semibold">Profile</h2>
          <form onSubmit={saveProfile} noValidate className="space-y-3">
            <Field label="First name" error={profile.formState.errors.firstName?.message}>
              {(p) => <Input {...profile.register('firstName')} {...p} />}
            </Field>
            <Field label="Last name" error={profile.formState.errors.lastName?.message}>
              {(p) => <Input {...profile.register('lastName')} {...p} />}
            </Field>
            <Field label="Email">
              {(p) => <Input value={user?.email ?? ''} disabled {...p} />}
            </Field>
            <div className="flex justify-end">
              <Button type="submit" loading={profile.formState.isSubmitting}>
                Save profile
              </Button>
            </div>
          </form>
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="text-lg font-semibold">Change password</h2>
          <form onSubmit={savePassword} noValidate className="space-y-3">
            <Field label="Current password" error={password.formState.errors.currentPassword?.message}>
              {(p) => (
                <Input type="password" autoComplete="current-password" {...password.register('currentPassword')} {...p} />
              )}
            </Field>
            <Field
              label="New password"
              error={password.formState.errors.newPassword?.message}
              hint="At least 8 characters, with upper, lower, and a digit."
            >
              {(p) => (
                <Input type="password" autoComplete="new-password" {...password.register('newPassword')} {...p} />
              )}
            </Field>
            <div className="flex justify-end">
              <Button type="submit" loading={password.formState.isSubmitting}>
                Update password
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </PageTransition>
  );
}
