import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import {
  fetchMonthTransactions,
  fetchAssetTransfers,
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
import type { Category, PaymentMethod, Asset } from '@/types/database';

export type { TransactionRow, TransactionInput };
export { fetchAssetTransfers };

// 'YYYY-MM-DD' → [year, month(0-indexed)]
function parseDateKey(date: string): [number, number] {
  const parts = date.split('-');
  return [parseInt(parts[0]), parseInt(parts[1]) - 1];
}

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

export function useAssetTransfers(
  assetId: string,
  year: number,
  month: number,
) {
  return useQuery<TransactionRow[]>({
    queryKey: ['asset-transfers', assetId, year, month],
    queryFn: () => fetchAssetTransfers(assetId, year, month),
    enabled: !!assetId,
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
    onMutate: async input => {
      const coupleId = userProfile?.couple_id;
      const userId = session?.user.id;
      if (!coupleId || !userId) return;

      await queryClient.cancelQueries({ queryKey: ['transactions'] });

      const [txYear, txMonth] = parseDateKey(input.date);
      const queryKey = ['transactions', txYear, txMonth, coupleId];
      const previousData = queryClient.getQueryData<TransactionRow[]>(queryKey);

      // 캐시에서 join 데이터 조합
      const categories = queryClient.getQueryData<Category[]>([
        'categories',
        coupleId,
      ]);
      const category =
        categories?.find(c => c.id === input.category_id) ?? null;
      const paymentMethods = queryClient.getQueryData<PaymentMethod[]>([
        'payment-methods',
        coupleId,
      ]);
      const paymentMethod =
        paymentMethods?.find(p => p.id === input.payment_method_id) ?? null;
      const assets = queryClient.getQueryData<Asset[]>(['assets', coupleId]);
      const asset = assets?.find(a => a.id === input.asset_id) ?? null;
      const targetAsset =
        assets?.find(a => a.id === input.target_asset_id) ?? null;

      const optimistic: TransactionRow = {
        id: `__optimistic__${Date.now()}`,
        couple_id: coupleId,
        user_id: userId,
        amount: input.amount,
        type: input.type,
        tag: input.tag ?? null,
        memo: input.memo ?? null,
        date: input.date,
        category_id: input.category_id ?? null,
        payment_method_id: input.payment_method_id ?? null,
        asset_id: input.asset_id ?? null,
        target_asset_id: input.target_asset_id ?? null,
        fixed_expense_id: input.fixed_expense_id ?? null,
        created_at: new Date().toISOString(),
        categories: category
          ? { name: category.name, icon: category.icon, color: category.color }
          : null,
        payment_methods: paymentMethod ? { name: paymentMethod.name } : null,
        assets: asset ? { name: asset.name } : null,
        target_assets: targetAsset ? { name: targetAsset.name } : null,
      };

      queryClient.setQueryData<TransactionRow[]>(queryKey, old => [
        ...(old ?? []),
        optimistic,
      ]);

      return { previousData, queryKey };
    },
    onSuccess: newTransaction => {
      // 알림은 서버 확인 후에만 발송
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
    onError: (_, __, context) => {
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const { userProfile } = useAuthStore();

  return useMutation({
    mutationFn: ({ id, ...input }: TransactionInput & { id: string }) =>
      updateTransaction(id, input),
    onMutate: async ({ id, ...input }) => {
      const coupleId = userProfile?.couple_id;
      if (!coupleId) return;

      await queryClient.cancelQueries({ queryKey: ['transactions'] });

      const snapshots = queryClient.getQueriesData<TransactionRow[]>({
        queryKey: ['transactions'],
      });

      // 기존 아이템 찾기
      let existingItem: TransactionRow | undefined;
      for (const [, data] of snapshots) {
        existingItem = data?.find(t => t.id === id);
        if (existingItem) break;
      }

      // join 데이터 조합
      const categories = queryClient.getQueryData<Category[]>([
        'categories',
        coupleId,
      ]);
      const category =
        categories?.find(c => c.id === input.category_id) ?? null;
      const paymentMethods = queryClient.getQueryData<PaymentMethod[]>([
        'payment-methods',
        coupleId,
      ]);
      const paymentMethod =
        paymentMethods?.find(p => p.id === input.payment_method_id) ?? null;
      const assets = queryClient.getQueryData<Asset[]>(['assets', coupleId]);
      const asset = assets?.find(a => a.id === input.asset_id) ?? null;
      const targetAsset =
        assets?.find(a => a.id === input.target_asset_id) ?? null;

      const updatedItem: TransactionRow = {
        ...(existingItem ?? ({} as TransactionRow)),
        id,
        amount: input.amount,
        type: input.type,
        tag: input.tag ?? null,
        memo: input.memo ?? null,
        date: input.date,
        category_id: input.category_id ?? null,
        payment_method_id: input.payment_method_id ?? null,
        asset_id: input.asset_id ?? null,
        target_asset_id: input.target_asset_id ?? null,
        fixed_expense_id: input.fixed_expense_id ?? null,
        categories: category
          ? { name: category.name, icon: category.icon, color: category.color }
          : null,
        payment_methods: paymentMethod ? { name: paymentMethod.name } : null,
        assets: asset ? { name: asset.name } : null,
        target_assets: targetAsset ? { name: targetAsset.name } : null,
      };

      const [newYear, newMonth] = parseDateKey(input.date);
      const newQueryKey = ['transactions', newYear, newMonth, coupleId];

      if (existingItem) {
        const [oldYear, oldMonth] = parseDateKey(existingItem.date);
        if (oldYear === newYear && oldMonth === newMonth) {
          // 같은 달: in-place 교체
          queryClient.setQueryData<TransactionRow[]>(newQueryKey, old =>
            (old ?? []).map(t => (t.id === id ? updatedItem : t)),
          );
        } else {
          // 달이 다름: 기존 달에서 제거 + 새 달에 추가
          const oldQueryKey = ['transactions', oldYear, oldMonth, coupleId];
          queryClient.setQueryData<TransactionRow[]>(oldQueryKey, old =>
            (old ?? []).filter(t => t.id !== id),
          );
          queryClient.setQueryData<TransactionRow[]>(newQueryKey, old => [
            ...(old ?? []),
            updatedItem,
          ]);
        }
      } else {
        queryClient.setQueryData<TransactionRow[]>(newQueryKey, old => [
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
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onMutate: async id => {
      await queryClient.cancelQueries({ queryKey: ['transactions'] });

      const snapshots = queryClient.getQueriesData<TransactionRow[]>({
        queryKey: ['transactions'],
      });

      for (const [key, data] of snapshots) {
        if (data?.some(t => t.id === id)) {
          queryClient.setQueryData<TransactionRow[]>(
            key,
            data.filter(t => t.id !== id),
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
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
