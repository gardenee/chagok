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
    onMutate: async (input: FixedExpenseInput) => {
      const coupleId = userProfile?.couple_id;
      if (!coupleId) return;
      await queryClient.cancelQueries({
        queryKey: ['fixed-expenses', coupleId],
      });
      const previous = queryClient.getQueryData<FixedExpense[]>([
        'fixed-expenses',
        coupleId,
      ]);
      const tempItem: FixedExpense = {
        id: `temp-${Date.now()}`,
        couple_id: coupleId,
        type: input.type ?? 'expense',
        name: input.name,
        amount: input.amount,
        due_day: input.due_day,
        due_day_mode: input.due_day_mode,
        business_day_adjust: input.business_day_adjust,
        category_id: input.category_id ?? null,
        from_asset_id: input.from_asset_id ?? null,
        to_asset_id: input.to_asset_id ?? null,
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData<FixedExpense[]>(
        ['fixed-expenses', coupleId],
        old => sortByDue([...(old ?? []), tempItem]),
      );
      return { previous };
    },
    onError: (_err, _input, context) => {
      const coupleId = userProfile?.couple_id;
      if (coupleId && context?.previous) {
        queryClient.setQueryData(
          ['fixed-expenses', coupleId],
          context.previous,
        );
      }
    },
    onSuccess: async newItem => {
      const coupleId = userProfile?.couple_id;
      const userId = session?.user.id;
      if (!coupleId) return;

      queryClient.setQueryData<FixedExpense[]>(
        ['fixed-expenses', coupleId],
        old =>
          sortByDue(
            (old ?? []).map(item =>
              item.id.startsWith('temp-') ? newItem : item,
            ),
          ),
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
      queryClient.invalidateQueries({ queryKey: ['fixed-expenses', coupleId] });
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
    onMutate: async ({ id, ...input }) => {
      const coupleId = userProfile?.couple_id;
      if (!coupleId) return;
      await queryClient.cancelQueries({
        queryKey: ['fixed-expenses', coupleId],
      });
      const previous = queryClient.getQueryData<FixedExpense[]>([
        'fixed-expenses',
        coupleId,
      ]);
      queryClient.setQueryData<FixedExpense[]>(
        ['fixed-expenses', coupleId],
        old =>
          sortByDue(
            (old ?? []).map(item =>
              item.id === id ? { ...item, ...input } : item,
            ),
          ),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      const coupleId = userProfile?.couple_id;
      if (coupleId && context?.previous) {
        queryClient.setQueryData(
          ['fixed-expenses', coupleId],
          context.previous,
        );
      }
    },
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
        await deleteFutureFixedTransactions(updatedItem.id, todayStr);
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

      const { name, amount, category_id } = variables;
      await updateLinkedTransactions(
        updatedItem.id,
        { name, amount, category_id },
        startOfMonth,
      );

      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['fixed-expenses', coupleId] });
    },
  });
}

export function useDeleteFixedExpense() {
  const queryClient = useQueryClient();
  const { userProfile } = useAuthStore();

  return useMutation({
    mutationFn: (id: string) => deleteFixedExpense(id),
    onMutate: async (id: string) => {
      const coupleId = userProfile?.couple_id;
      if (!coupleId) return;
      await queryClient.cancelQueries({
        queryKey: ['fixed-expenses', coupleId],
      });
      const previous = queryClient.getQueryData<FixedExpense[]>([
        'fixed-expenses',
        coupleId,
      ]);
      queryClient.setQueryData<FixedExpense[]>(
        ['fixed-expenses', coupleId],
        old => (old ?? []).filter(item => item.id !== id),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      const coupleId = userProfile?.couple_id;
      if (coupleId && context?.previous) {
        queryClient.setQueryData(
          ['fixed-expenses', coupleId],
          context.previous,
        );
      }
    },
    onSuccess: () => {
      const coupleId = userProfile?.couple_id;
      if (!coupleId) return;
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['fixed-expenses', coupleId] });
    },
  });
}
