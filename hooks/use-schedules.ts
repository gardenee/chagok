import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Schedule } from '../types/database';
import { useAuthStore } from '../store/auth';

type ScheduleInput = {
  title: string;
  date: string;
  tag: 'me' | 'partner' | 'together';
};

export function useMonthSchedules(year: number, month: number) {
  const { userProfile } = useAuthStore();
  const coupleId = userProfile?.couple_id;
  const queryClient = useQueryClient();

  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  useEffect(() => {
    if (!coupleId) return;
    const channel = supabase
      .channel(`schedules-${coupleId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'schedules',
        filter: `couple_id=eq.${coupleId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['schedules'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [coupleId, queryClient]);

  return useQuery<Schedule[]>({
    queryKey: ['schedules', year, month, coupleId],
    queryFn: async () => {
      if (!coupleId) return [];
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('couple_id', coupleId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!coupleId,
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();
  const { userProfile, session } = useAuthStore();

  return useMutation({
    mutationFn: async (input: ScheduleInput) => {
      const coupleId = userProfile?.couple_id;
      const userId = session?.user.id;
      if (!coupleId || !userId) throw new Error('로그인이 필요합니다');

      const { data, error } = await supabase
        .from('schedules')
        .insert({ ...input, couple_id: coupleId, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      return data as Schedule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...update }: { id: string } & ScheduleInput) => {
      const { data, error } = await supabase
        .from('schedules')
        .update(update)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Schedule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('schedules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
}
