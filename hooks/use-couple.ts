import { useMutation } from '@tanstack/react-query';
import { createCouple, joinCouple } from '../services/couple';

export function useCreateCouple() {
  return useMutation({
    mutationFn: ({ bookName, inviteCode }: { bookName: string; inviteCode: string }) =>
      createCouple(bookName, inviteCode),
  });
}

export function useJoinCouple() {
  return useMutation({
    mutationFn: (inviteCode: string) => joinCouple(inviteCode),
  });
}
