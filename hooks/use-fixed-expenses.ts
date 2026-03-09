import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import {
  fetchFixedExpenses,
  createFixedExpense,
  updateFixedExpense,
  deleteFixedExpense,
  type FixedExpenseInput,
} from '../services/fixed-expenses';
import { scheduleFixedExpenseReminders } from '../services/notifications';
import type { FixedExpense } from '../types/database';

export type { FixedExpenseInput };

export function useFixedExpenses() {
  const { userProfile } = useAuthStore();
  const coupleId = userProfile?.couple_id;

  const query = useQuery<FixedExpense[]>({
    queryKey: ['fixed-expenses', coupleId],
    queryFn: () => fetchFixedExpenses(coupleId!),
    enabled: !!coupleId,
  });

  useEffect(() => {
    if (query.data) {
      scheduleFixedExpenseReminders(query.data).catch(() => {});
    }
  }, [query.data]);

  return query;
}

export function useCreateFixedExpense() {
  const queryClient = useQueryClient();
  const { userProfile } = useAuthStore();

  return useMutation({
    mutationFn: (input: FixedExpenseInput) => {
      const coupleId = userProfile?.couple_id;
      if (!coupleId) throw new Error('로그인이 필요합니다');
      return createFixedExpense(coupleId, input);
    },
    onSuccess: newItem => {
      const coupleId = userProfile?.couple_id;
      if (!coupleId) return;
      queryClient.setQueryData<FixedExpense[]>(
        ['fixed-expenses', coupleId],
        old => [...(old ?? []), newItem].sort((a, b) => a.due_day - b.due_day),
      );
    },
  });
}

export function useUpdateFixedExpense() {
  const queryClient = useQueryClient();
  const { userProfile } = useAuthStore();

  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: Partial<FixedExpenseInput> & { id: string }) =>
      updateFixedExpense(id, input),
    onSuccess: updatedItem => {
      const coupleId = userProfile?.couple_id;
      if (!coupleId) return;
      queryClient.setQueryData<FixedExpense[]>(
        ['fixed-expenses', coupleId],
        old =>
          (old ?? [])
            .map(item => (item.id === updatedItem.id ? updatedItem : item))
            .sort((a, b) => a.due_day - b.due_day),
      );
    },
  });
}

export function useDeleteFixedExpense() {
  const queryClient = useQueryClient();
  const { userProfile } = useAuthStore();

  return useMutation({
    mutationFn: (id: string) => deleteFixedExpense(id),
    onSuccess: (_, id) => {
      const coupleId = userProfile?.couple_id;
      if (!coupleId) return;
      queryClient.setQueryData<FixedExpense[]>(
        ['fixed-expenses', coupleId],
        old => (old ?? []).filter(item => item.id !== id),
      );
    },
  });
}
