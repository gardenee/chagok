import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Transaction } from '../types/database';
import { useAuthStore } from '../store/auth';

export type TransactionRow = Transaction & {
  categories: { name: string } | null;
};

type TransactionInput = {
  amount: number;
  type: 'expense' | 'income';
  tag: 'me' | 'partner' | 'together';
  memo?: string | null;
  date: string;
  category_id?: string | null;
};

export function useMonthTransactions(year: number, month: number) {
  const { userProfile } = useAuthStore();
  const coupleId = userProfile?.couple_id;
  const queryClient = useQueryClient();

  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  useEffect(() => {
    if (!coupleId) return;
    const channel = supabase
      .channel(`transactions-${coupleId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions',
        filter: `couple_id=eq.${coupleId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [coupleId, queryClient]);

  return useQuery<TransactionRow[]>({
    queryKey: ['transactions', year, month, coupleId],
    queryFn: async () => {
      if (!coupleId) return [];
      const { data, error } = await supabase
        .from('transactions')
        .select('*, categories(name)')
        .eq('couple_id', coupleId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as TransactionRow[];
    },
    enabled: !!coupleId,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { userProfile, session } = useAuthStore();

  return useMutation({
    mutationFn: async (input: TransactionInput) => {
      const coupleId = userProfile?.couple_id;
      const userId = session?.user.id;
      if (!coupleId || !userId) throw new Error('로그인이 필요합니다');

      const { data, error } = await supabase
        .from('transactions')
        .insert({ ...input, couple_id: coupleId, user_id: userId })
        .select('*, categories(name)')
        .single();
      if (error) throw error;
      return data as TransactionRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...update }: { id: string } & TransactionInput) => {
      const { data, error } = await supabase
        .from('transactions')
        .update(update)
        .eq('id', id)
        .select('*, categories(name)')
        .single();
      if (error) throw error;
      return data as TransactionRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
