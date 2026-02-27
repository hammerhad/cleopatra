import { create } from 'zustand';
import type { UserProfile } from '../types/user';

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) =>
    set({ user, isAuthenticated: user !== null, isLoading: false }),

  setLoading: (isLoading) => set({ isLoading }),

  clear: () =>
    set({ user: null, isAuthenticated: false, isLoading: false }),
}));
