import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';
import {
  fetchMonthSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  type ScheduleInput,
} from '../services/schedules';
import type { Schedule } from '../types/database';

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: ScheduleInput & { id: string }) =>
      updateSchedule(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
}
