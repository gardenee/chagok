import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import {
  fetchMonthSchedules,
  fetchUpcomingSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  type ScheduleInput,
} from '@/services/schedules';
import { scheduleEventReminders } from '@/services/notifications';
import { useNotificationSettingsStore } from '@/store/notification-settings';
import type { Schedule } from '@/types/database';

export { type ScheduleInput };

// 'YYYY-MM-DD' → [year, month(0-indexed)]
function parseDateKey(date: string): [number, number] {
  const parts = date.split('-');
  return [parseInt(parts[0]), parseInt(parts[1]) - 1];
}

export function useMonthSchedules(year: number, month: number) {
  const { userProfile } = useAuthStore();
  const coupleId = userProfile?.couple_id;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!coupleId) return;
    const channel = supabase
      .channel(`schedules-${coupleId}-${year}-${month}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'schedules',
          filter: `couple_id=eq.${coupleId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['schedules'] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, year, month, queryClient]);

  return useQuery<Schedule[]>({
    queryKey: ['schedules', year, month, coupleId],
    queryFn: () => fetchMonthSchedules(coupleId!, year, month),
    enabled: !!coupleId,
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();
  const { userProfile, session } = useAuthStore();

  return useMutation({
    mutationFn: (input: ScheduleInput) => {
      const coupleId = userProfile?.couple_id;
      const userId = session?.user.id;
      if (!coupleId || !userId) throw new Error('로그인이 필요합니다');
      return createSchedule(coupleId, userId, input);
    },
    onMutate: async input => {
      const coupleId = userProfile?.couple_id;
      const userId = session?.user.id;
      if (!coupleId || !userId) return;

      await queryClient.cancelQueries({ queryKey: ['schedules'] });

      const [schedYear, schedMonth] = parseDateKey(input.date);
      const queryKey = ['schedules', schedYear, schedMonth, coupleId];
      const previousData = queryClient.getQueryData<Schedule[]>(queryKey);

      const optimistic: Schedule = {
        id: `__optimistic__${Date.now()}`,
        couple_id: coupleId,
        user_id: userId,
        title: input.title,
        date: input.date,
        start_time: input.start_time ?? null,
        tag: input.tag,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData<Schedule[]>(queryKey, old => [
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
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-schedules'] });
    },
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();
  const { userProfile } = useAuthStore();

  return useMutation({
    mutationFn: ({ id, ...input }: ScheduleInput & { id: string }) =>
      updateSchedule(id, input),
    onMutate: async ({ id, ...input }) => {
      const coupleId = userProfile?.couple_id;
      if (!coupleId) return;

      await queryClient.cancelQueries({ queryKey: ['schedules'] });

      const snapshots = queryClient.getQueriesData<Schedule[]>({
        queryKey: ['schedules'],
      });

      let existingItem: Schedule | undefined;
      for (const [, data] of snapshots) {
        existingItem = data?.find(s => s.id === id);
        if (existingItem) break;
      }

      const updatedItem: Schedule = {
        ...(existingItem ?? ({} as Schedule)),
        id,
        title: input.title,
        date: input.date,
        start_time: input.start_time ?? null,
        tag: input.tag,
      };

      const [newYear, newMonth] = parseDateKey(input.date);
      const newQueryKey = ['schedules', newYear, newMonth, coupleId];

      if (existingItem) {
        const [oldYear, oldMonth] = parseDateKey(existingItem.date);
        if (oldYear === newYear && oldMonth === newMonth) {
          queryClient.setQueryData<Schedule[]>(newQueryKey, old =>
            (old ?? []).map(s => (s.id === id ? updatedItem : s)),
          );
        } else {
          const oldQueryKey = ['schedules', oldYear, oldMonth, coupleId];
          queryClient.setQueryData<Schedule[]>(oldQueryKey, old =>
            (old ?? []).filter(s => s.id !== id),
          );
          queryClient.setQueryData<Schedule[]>(newQueryKey, old => [
            ...(old ?? []),
            updatedItem,
          ]);
        }
      } else {
        queryClient.setQueryData<Schedule[]>(newQueryKey, old => [
          ...(old ?? []),
          updatedItem,
        ]);
      }

      return { snapshots };
    },
    onError: (_, __, context) => {
      context?.snapshots.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-schedules'] });
    },
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSchedule(id),
    onMutate: async id => {
      await queryClient.cancelQueries({ queryKey: ['schedules'] });

      const snapshots = queryClient.getQueriesData<Schedule[]>({
        queryKey: ['schedules'],
      });

      for (const [key, data] of snapshots) {
        if (data?.some(s => s.id === id)) {
          queryClient.setQueryData<Schedule[]>(
            key,
            data.filter(s => s.id !== id),
          );
        }
      }

      return { snapshots };
    },
    onError: (_, __, context) => {
      context?.snapshots.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-schedules'] });
    },
  });
}

export function useScheduleReminders() {
  const { userProfile } = useAuthStore();
  const coupleId = userProfile?.couple_id;
  const userId = userProfile?.id;
  const { mySchedule, togetherSchedule } = useNotificationSettingsStore();

  const query = useQuery<Schedule[]>({
    queryKey: ['upcoming-schedules', coupleId],
    queryFn: () => fetchUpcomingSchedules(coupleId!),
    enabled: !!coupleId,
  });

  useEffect(() => {
    if (!query.data || !userId) return;
    scheduleEventReminders(
      query.data,
      userId,
      mySchedule,
      togetherSchedule,
    ).catch(() => {});
  }, [query.data, userId, mySchedule, togetherSchedule]);
}
