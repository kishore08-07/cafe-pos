import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthResponse } from '../api/client';

export type Role = 'ADMIN' | 'EMPLOYEE';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  setSession: (response: AuthResponse) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      setSession: (response) =>
        set({
          user: {
            id: String(response.userId),
            name: response.name,
            email: response.email,
            role: response.role,
          },
          token: response.accessToken,
          refreshToken: response.refreshToken,
        }),
      clearSession: () => set({ user: null, token: null, refreshToken: null }),
    }),
    { name: 'cafe-etoile-auth', version: 2 }
  )
);
