import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '../api/auth.api';
import type { LoginRequest, RefreshTokenRequest } from '@/types/auth.types';
import { useAuthStore } from '@/store/auth.store';
import { ROLE_DASHBOARD, ROUTES, UNAUTHENTICATED_REDIRECT } from '@/config/routes';

export const useLogin = () => {
  const { login } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: LoginRequest) => authApi.login(payload),
    onSuccess: (response) => {
      const { user, accessToken, refreshToken } = response.data.data;
      login(user, accessToken, refreshToken);
      const destination = ROLE_DASHBOARD[user.role] ?? UNAUTHENTICATED_REDIRECT;
      router.push(destination);
    },
  });
};

export const useLogout = () => {
  const store = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: () =>
      authApi.logout({ refreshToken: store.refreshToken ?? '' } satisfies RefreshTokenRequest),
    onSettled: () => {
      store.logout();
      router.push(ROUTES.login);
    },
  });
};
