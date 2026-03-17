import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import {
  fetchPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  type PaymentMethodInput,
} from '@/services/payment-methods';
import type { PaymentMethod } from '@/types/database';

export type { PaymentMethodInput };

export function usePaymentMethods() {
  const { userProfile } = useAuthStore();
  const coupleId = userProfile?.couple_id;

  return useQuery<PaymentMethod[]>({
    queryKey: ['payment-methods', coupleId],
    queryFn: async () => {
      if (!coupleId) return [];
      return fetchPaymentMethods(coupleId);
    },
    enabled: !!coupleId,
    staleTime: Infinity, // mutation setQueryData로 즉시 반영
  });
}

export function useCreatePaymentMethod() {
  const queryClient = useQueryClient();
  const { userProfile } = useAuthStore();

  return useMutation({
    mutationFn: async (input: PaymentMethodInput) => {
      const coupleId = userProfile?.couple_id;
      if (!coupleId) throw new Error('로그인이 필요합니다');
      return createPaymentMethod(coupleId, input);
    },
    onSuccess: newItem => {
      const coupleId = userProfile?.couple_id;
      if (!coupleId) return;
      queryClient.setQueryData<PaymentMethod[]>(
        ['payment-methods', coupleId],
        old => [...(old ?? []), newItem],
      );
    },
  });
}

export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient();
  const { userProfile } = useAuthStore();

  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: { id: string } & Partial<PaymentMethodInput>) =>
      updatePaymentMethod(id, input),
    onSuccess: updatedItem => {
      const coupleId = userProfile?.couple_id;
      if (!coupleId) return;
      queryClient.setQueryData<PaymentMethod[]>(
        ['payment-methods', coupleId],
        old =>
          (old ?? []).map(item =>
            item.id === updatedItem.id ? updatedItem : item,
          ),
      );
    },
  });
}

export function useDeletePaymentMethod() {
  const queryClient = useQueryClient();
  const { userProfile } = useAuthStore();

  return useMutation({
    mutationFn: (id: string) => deletePaymentMethod(id),
    onSuccess: (_, id) => {
      const coupleId = userProfile?.couple_id;
      if (!coupleId) return;
      queryClient.setQueryData<PaymentMethod[]>(
        ['payment-methods', coupleId],
        old => (old ?? []).filter(item => item.id !== id),
      );
    },
  });
}
