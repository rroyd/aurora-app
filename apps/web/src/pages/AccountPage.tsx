import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { PageTransition } from '@/components/layout/PageTransition';
import { useAuth } from '@/features/auth/useAuth';
import { usePasswordForm, useProfileForm } from '@/features/account/useAccountForms';

export function AccountPage() {
  const { user } = useAuth();
  const { form: profile, submit: saveProfile } = useProfileForm();
  const { form: password, submit: savePassword } = usePasswordForm();

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
