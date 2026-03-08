import { useMutation } from '@tanstack/react-query';
import { createUserProfile, getUserProfile } from '../services/user';

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
