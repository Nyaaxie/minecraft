import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '../types/database.types';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
}

import { supabase } from '../services/supabase';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  setUser: (user) => {
    console.log('useAuthStore: Setting user:', !!user);
    set({ user });
  },
  setProfile: (profile) => {
    console.log('useAuthStore: Setting profile:', !!profile);
    set({ profile });
  },
  setLoading: (loading) => set({ loading }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },
}));
