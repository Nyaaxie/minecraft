import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '../types/database.types';
import { supabase } from '../services/supabase';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      loading: true,
      setUser: (user) => {
        set({ user });
      },
      setProfile: (profile) => {
        set({ profile });
      },
      setLoading: (loading) => set({ loading }),
      signOut: async () => {
        try {
          await supabase.auth.signOut();
        } catch (err) {
          console.error('Sign out error:', err);
        }
        set({ user: null, profile: null });
      },
    }),
    {
      name: 'strawberry-auth',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: (_state) => {
        return (_state, error) => {
          if (error) {
            console.error('useAuthStore: hydration error', error);
          }
        };
      },
      partialize: (state) => ({ 
        user: state.user, 
        profile: state.profile 
      }),
    }
  )
);
