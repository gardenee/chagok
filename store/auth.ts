import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { UserProfile } from '../types/database';

interface AuthState {
  session: Session | null;
  userProfile: UserProfile | null;
  setSession: (session: Session | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  userProfile: null,
  setSession: (session) => set({ session }),
  setUserProfile: (userProfile) => set({ userProfile }),
}));
