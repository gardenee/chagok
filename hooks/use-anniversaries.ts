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
    onMutate: async input => {
      const coupleId = userProfile?.couple_id;
      if (!coupleId) return;
      const queryKey = ['anniversaries', coupleId];
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<Anniversary[]>(queryKey);
      const optimistic: Anniversary = {
        id: `__optimistic__${Date.now()}`,
        couple_id: coupleId,
        name: input.name,
        date: input.date,
        type: input.type,
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData<Anniversary[]>(queryKey, old => [
        ...(old ?? []),
        optimistic,
      ]);
      return { previousData, queryKey };
    },
    onError: (_, __, context) => {
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['anniversaries'] });
    },
  });
}

export function useUpdateAnniversary() {
  const queryClient = useQueryClient();
  const { userProfile } = useAuthStore();

  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: Partial<AnniversaryInput> & { id: string }) =>
      updateAnniversary(id, input),
    onMutate: async ({ id, ...input }) => {
      const coupleId = userProfile?.couple_id;
      if (!coupleId) return;
      const queryKey = ['anniversaries', coupleId];
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<Anniversary[]>(queryKey);
      queryClient.setQueryData<Anniversary[]>(queryKey, old =>
        (old ?? []).map(a => (a.id === id ? { ...a, ...input } : a)),
      );
      return { previousData, queryKey };
    },
    onError: (_, __, context) => {
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['anniversaries'] });
    },
  });
}

export function useDeleteAnniversary() {
  const queryClient = useQueryClient();
  const { userProfile } = useAuthStore();

  return useMutation({
    mutationFn: (id: string) => deleteAnniversary(id),
    onMutate: async id => {
      const coupleId = userProfile?.couple_id;
      if (!coupleId) return;
      const queryKey = ['anniversaries', coupleId];
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<Anniversary[]>(queryKey);
      queryClient.setQueryData<Anniversary[]>(queryKey, old =>
        (old ?? []).filter(a => a.id !== id),
      );
      return { previousData, queryKey };
    },
    onError: (_, __, context) => {
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
    },
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
    onMutate: async ({ type, name, date }) => {
      const coupleId = userProfile?.couple_id;
      if (!coupleId) return;
      const queryKey = ['anniversaries', coupleId];
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<Anniversary[]>(queryKey);
      const existing = (previousData ?? []).find(a => a.type === type);
      if (existing) {
        queryClient.setQueryData<Anniversary[]>(queryKey, old =>
          (old ?? []).map(a =>
            a.id === existing.id ? { ...a, name, date } : a,
          ),
        );
      } else {
        const optimistic: Anniversary = {
          id: `__optimistic__${Date.now()}`,
          couple_id: coupleId,
          name,
          date,
          type,
          created_at: new Date().toISOString(),
        };
        queryClient.setQueryData<Anniversary[]>(queryKey, old => [
          ...(old ?? []),
          optimistic,
        ]);
      }
      return { previousData, queryKey };
    },
    onError: (_, __, context) => {
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
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
