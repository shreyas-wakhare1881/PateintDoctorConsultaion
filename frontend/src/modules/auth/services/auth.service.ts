// Auth business logic service (client-side)
// Stateless helpers; state lives in useAuthStore
import { useAuthStore } from '@/store/auth.store';

export const authService = {
  isTokenExpired: (): boolean => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  },
};
