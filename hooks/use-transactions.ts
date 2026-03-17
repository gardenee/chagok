import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import {
  fetchMonthTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  type TransactionRow,
  type TransactionInput,
} from '@/services/transactions';
import {
  sendPartnerTransactionPush,
  checkAndNotifyBudgetThresholds,
} from '@/services/notifications';
import { useNotificationSettingsStore } from '@/store/notification-settings';

export type { TransactionRow, TransactionInput };

export function useMonthTransactions(year: number, month: number) {
  const { userProfile } = useAuthStore();
  const coupleId = userProfile?.couple_id;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!coupleId) return;
    const channel = supabase
      .channel(`transactions-${coupleId}-${year}-${month}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `couple_id=eq.${coupleId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['transactions'] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, year, month, queryClient]);

  return useQuery<TransactionRow[]>({
    queryKey: ['transactions', year, month, coupleId],
    queryFn: () => fetchMonthTransactions(coupleId!, year, month),
    enabled: !!coupleId,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { userProfile, session } = useAuthStore();
  const {
    partnerTransaction: notifyEnabled,
    budgetExceeded: budgetNotifyEnabled,
  } = useNotificationSettingsStore();

  return useMutation({
    mutationFn: (input: TransactionInput) => {
      const coupleId = userProfile?.couple_id;
      const userId = session?.user.id;
      if (!coupleId || !userId) throw new Error('로그인이 필요합니다');
      return createTransaction(coupleId, userId, input);
    },
    onSuccess: newTransaction => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });

      const coupleId = userProfile?.couple_id;
      const nickname = userProfile?.nickname;
      const userId = session?.user.id;
      if (notifyEnabled && coupleId && nickname && userId) {
        sendPartnerTransactionPush({
          coupleId,
          senderId: userId,
          senderNickname: nickname,
          amount: newTransaction.amount,
          type: newTransaction.type,
          categoryName: newTransaction.categories?.name,
        }).catch(() => {});
      }

      if (
        budgetNotifyEnabled &&
        coupleId &&
        newTransaction.type === 'expense' &&
        newTransaction.category_id &&
        newTransaction.categories?.name
      ) {
        checkAndNotifyBudgetThresholds({
          coupleId,
          categoryId: newTransaction.category_id,
          categoryName: newTransaction.categories.name,
          newAmount: newTransaction.amount,
        }).catch(() => {});
      }
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: TransactionInput & { id: string }) =>
      updateTransaction(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
