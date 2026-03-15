import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import {
  fetchFixedExpenses,
  createFixedExpense,
  updateFixedExpense,
  deleteFixedExpense,
  type FixedExpenseInput,
} from '@/services/fixed-expenses';
import { scheduleFixedExpenseReminders } from '@/services/notifications';
import { useNotificationSettingsStore } from '@/store/notification-settings';
import type { FixedExpense } from '@/types/database';

export type { FixedExpenseInput };

function dueSortValue(item: FixedExpense): number {
  return item.due_day_mode === 'eom' ? 32 : item.due_day;
}

function sortByDue(items: FixedExpense[]): FixedExpense[] {
  return [...items].sort((a, b) => dueSortValue(a) - dueSortValue(b));
}

export function useFixedExpenses() {
  const { userProfile } = useAuthStore();
  const coupleId = userProfile?.couple_id;
  const { fixedExpenseReminder } = useNotificationSettingsStore();

  const query = useQuery<FixedExpense[]>({
    queryKey: ['fixed-expenses', coupleId],
    queryFn: () => fetchFixedExpenses(coupleId!),
    select: items => sortByDue(items),
    enabled: !!coupleId,
  });

  useEffect(() => {
    if (!query.data) return;
    if (fixedExpenseReminder) {
      scheduleFixedExpenseReminders(query.data).catch(() => {});
    } else {
      scheduleFixedExpenseReminders([]).catch(() => {});
    }
  }, [query.data, fixedExpenseReminder]);

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
        old => sortByDue([...(old ?? []), newItem]),
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
          sortByDue(
            (old ?? []).map(item =>
              item.id === updatedItem.id ? updatedItem : item,
            ),
          ),
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
