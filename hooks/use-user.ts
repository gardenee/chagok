import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { supabase } from '@/lib/supabase';
import {
  createUserProfile,
  getUserProfile,
  updateNickname,
  leaveCouple,
  deleteAccount,
} from '@/services/user';

export function useCreateUserProfile() {
  return useMutation({
    mutationFn: ({ userId, nickname }: { userId: string; nickname: string }) =>
      createUserProfile(userId, nickname),
  });
}

export function useGetUserProfile() {
  return useMutation({
    mutationFn: (userId: string) => getUserProfile(userId),
  });
}

export function useLeaveCouple() {
  const queryClient = useQueryClient();
  const { userProfile, setUserProfile } = useAuthStore();

  return useMutation({
    mutationFn: leaveCouple,
    onSuccess: () => {
      if (userProfile) {
        setUserProfile({ ...userProfile, couple_id: null });
      }
      queryClient.clear();
    },
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      await deleteAccount();
      try {
        await supabase.auth.signOut();
      } catch {
        // 계정 삭제 후 signOut 실패는 무시
      }
    },
  });
}

export function useUpdateNickname() {
  const { userProfile, setUserProfile } = useAuthStore();

  return useMutation({
    mutationFn: (nickname: string) => {
      if (!userProfile) throw new Error('로그인이 필요합니다');
      return updateNickname(userProfile.id, nickname);
    },
    onSuccess: updated => {
      setUserProfile(updated);
    },
  });
}
