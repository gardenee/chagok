import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import {
  fetchAnniversaries,
  createAnniversary,
  updateAnniversary,
  deleteAnniversary,
  upsertBirthday,
  type AnniversaryInput,
} from '@/services/anniversaries';
import { scheduleAnniversaryReminders } from '@/services/notifications';
import { useNotificationSettingsStore } from '@/store/notification-settings';
import type { Anniversary } from '@/types/database';

export function useAnniversaries() {
  const { userProfile } = useAuthStore();
  const coupleId = userProfile?.couple_id;

  return useQuery<Anniversary[]>({
    queryKey: ['anniversaries', coupleId],
    queryFn: () => fetchAnniversaries(coupleId!),
    enabled: !!coupleId,
  });
}

export function useCreateAnniversary() {
  const queryClient = useQueryClient();
  const { userProfile } = useAuthStore();

  return useMutation({
    mutationFn: (input: AnniversaryInput) => {
      const coupleId = userProfile?.couple_id;
      if (!coupleId) throw new Error('커플 정보가 없습니다');
      return createAnniversary(coupleId, input);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['anniversaries'] });
    },
  });
}

export function useUpdateAnniversary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: Partial<AnniversaryInput> & { id: string }) =>
      updateAnniversary(id, input),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['anniversaries'] });
    },
  });
}

export function useDeleteAnniversary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAnniversary(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['anniversaries'] });
    },
  });
}

export function useUpsertBirthday() {
  const queryClient = useQueryClient();
  const { userProfile } = useAuthStore();

  return useMutation({
    mutationFn: ({
      type,
      name,
      date,
    }: {
      type: 'birthday_me' | 'birthday_partner';
      name: string;
      date: string;
    }) => {
      const coupleId = userProfile?.couple_id;
      if (!coupleId) throw new Error('커플 정보가 없습니다');
      return upsertBirthday(coupleId, type, name, date);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['anniversaries'] });
    },
  });
}

export function useAnniversaryReminders() {
  const { anniversaryReminder } = useNotificationSettingsStore();
  const { data: anniversaries = [] } = useAnniversaries();

  useEffect(() => {
    scheduleAnniversaryReminders(anniversaries, anniversaryReminder).catch(
      () => {},
    );
  }, [anniversaries, anniversaryReminder]);
}
