import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth';
import {
  fetchPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  type PaymentMethodInput,
} from '../services/payment-methods';
import type { PaymentMethod } from '../types/database';

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    },
  });
}

export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: { id: string } & Partial<PaymentMethodInput>) =>
      updatePaymentMethod(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    },
  });
}

export function useDeletePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePaymentMethod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    },
  });
}
