import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { UserProfile } from '@/types/database';

interface AuthState {
  session: Session | null;
  userProfile: UserProfile | null;
  pendingInviteCode: string | null;
  appleDisplayName: string | null;
  setSession: (session: Session | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setPendingInviteCode: (code: string | null) => void;
  setAppleDisplayName: (name: string | null) => void;
}

export const useAuthStore = create<AuthState>(set => ({
  session: null,
  userProfile: null,
  pendingInviteCode: null,
  appleDisplayName: null,
  setSession: session => set({ session }),
  setUserProfile: userProfile => set({ userProfile }),
  setPendingInviteCode: pendingInviteCode => set({ pendingInviteCode }),
  setAppleDisplayName: appleDisplayName => set({ appleDisplayName }),
}));
