import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi, type LoginPayload } from '../api/auth.api';
import { useAuthStore } from '@/store/auth.store';

export const useLogin = () => {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (response) => {
      const { user, accessToken } = response.data.data;
      setAuth(user, accessToken);
      router.push(`/${user.role.toLowerCase()}/dashboard`);
    },
  });
};

export const useLogout = () => {
  const { clearAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clearAuth();
      router.push('/patient-login');
    },
  });
};
