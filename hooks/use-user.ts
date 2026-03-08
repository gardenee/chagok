import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth';
import { createUserProfile, getUserProfile, updateNickname } from '../services/user';

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

export function useUpdateNickname() {
  const { userProfile, setUserProfile } = useAuthStore();

  return useMutation({
    mutationFn: (nickname: string) => updateNickname(userProfile!.id, nickname),
    onSuccess: (updated) => {
      setUserProfile(updated);
    },
  });
}
