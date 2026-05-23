'use client';

import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/store/auth.store';
import apiClient from '@/services/api-client';

interface AuthContextValue {
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue>({ isAuthenticated: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
