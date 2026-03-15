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
import {
  materializeFixedExpenses,
  updateLinkedTransactions,
  deleteFutureFixedTransactions,
} from '@/services/transactions';
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
  const { userProfile, session } = useAuthStore();

  return useMutation({
    mutationFn: (input: FixedExpenseInput) => {
      const coupleId = userProfile?.couple_id;
      if (!coupleId) throw new Error('로그인이 필요합니다');
      return createFixedExpense(coupleId, input);
    },
    onSuccess: async newItem => {
      const coupleId = userProfile?.couple_id;
      const userId = session?.user.id;
      if (!coupleId) return;

      queryClient.setQueryData<FixedExpense[]>(
        ['fixed-expenses', coupleId],
        old => sortByDue([...(old ?? []), newItem]),
      );

      if (userId) {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
        const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
        await Promise.all([
          materializeFixedExpenses(
            coupleId,
            userId,
            [newItem],
            currentYear,
            currentMonth,
          ),
          materializeFixedExpenses(
            coupleId,
            userId,
            [newItem],
            nextYear,
            nextMonth,
          ),
        ]);
      }
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useUpdateFixedExpense() {
  const queryClient = useQueryClient();
  const { userProfile, session } = useAuthStore();

  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: Partial<FixedExpenseInput> & { id: string }) =>
      updateFixedExpense(id, input),
    onSuccess: async (updatedItem, variables) => {
      const coupleId = userProfile?.couple_id;
      const userId = session?.user.id;
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

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const startOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

      if (userId) {
        // 오늘 이후 기존 트랜잭션 삭제 (날짜 변경 대응)
        await deleteFutureFixedTransactions(updatedItem.id, todayStr);

        // 현재달 + 다음달 재 materialization
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
        const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
        await Promise.all([
          materializeFixedExpenses(
            coupleId,
            userId,
            [updatedItem],
            currentYear,
            currentMonth,
          ),
          materializeFixedExpenses(
            coupleId,
            userId,
            [updatedItem],
            nextYear,
            nextMonth,
          ),
        ]);
      }

      // 이번달 이미 지난 내역 컨텐츠 동기화 (이름/금액/카테고리)
      const { name, amount, category_id } = variables;
      await updateLinkedTransactions(
        updatedItem.id,
        { name, amount, category_id },
        startOfMonth,
      );

      queryClient.invalidateQueries({ queryKey: ['transactions'] });
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
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
