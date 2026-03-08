import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { FixedExpense } from '../types/database';
import { useAuthStore } from '../store/auth';

type FixedExpenseInput = {
  name: string;
  amount: number;
  due_day: number;
  category_id?: string | null;
};

export function useFixedExpenses() {
  const { userProfile } = useAuthStore();
  const coupleId = userProfile?.couple_id;

  return useQuery<FixedExpense[]>({
    queryKey: ['fixed-expenses', coupleId],
    queryFn: async () => {
      if (!coupleId) return [];
      const { data, error } = await supabase
        .from('fixed_expenses')
        .select('*')
        .eq('couple_id', coupleId)
        .order('due_day', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!coupleId,
  });
}

export function useCreateFixedExpense() {
  const queryClient = useQueryClient();
  const { userProfile } = useAuthStore();

  return useMutation({
    mutationFn: async (input: FixedExpenseInput) => {
      const coupleId = userProfile?.couple_id;
      if (!coupleId) throw new Error('로그인이 필요합니다');

      const { data, error } = await supabase
        .from('fixed_expenses')
        .insert({ ...input, couple_id: coupleId })
        .select()
        .single();
      if (error) throw error;
      return data as FixedExpense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed-expenses'] });
    },
  });
}

export function useUpdateFixedExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...update }: { id: string } & FixedExpenseInput) => {
      const { data, error } = await supabase
        .from('fixed_expenses')
        .update(update)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as FixedExpense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed-expenses'] });
    },
  });
}

export function useDeleteFixedExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('fixed_expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed-expenses'] });
    },
  });
}
