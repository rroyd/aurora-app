import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  changePasswordSchema,
  updateProfileSchema,
  type ChangePasswordInput,
  type UpdateProfileInput,
} from '@shared/contracts';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/useAuth';
import { useChangePassword, useUpdateProfile } from './api';

export function useProfileForm() {
  const { user } = useAuth();
  const toast = useToast();
  const updateProfile = useUpdateProfile();

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
    },
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      await updateProfile.mutateAsync(values);
      toast.success('Profile updated');
    } catch {
      toast.error('Could not update profile');
    }
  });

  return { form, submit };
}

export function usePasswordForm() {
  const toast = useToast();
  const changePassword = useChangePassword();

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      await changePassword.mutateAsync(values);
      form.reset();
      toast.success('Password changed');
    } catch (e) {
      toast.error('Could not change password', (e as Error).message);
    }
  });

  return { form, submit };
}
