import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryOrders,
  type CategoryInput,
} from '@/services/categories';
import type { Category } from '@/types/database';

export type { CategoryInput };

export function useCategories() {
  const { userProfile } = useAuthStore();
  const coupleId = userProfile?.couple_id;

  return useQuery<Category[]>({
    queryKey: ['categories', coupleId],
    queryFn: () => fetchCategories(coupleId!),
    enabled: !!coupleId,
    staleTime: Infinity, // mutation setQueryData로 즉시 반영되므로 주기적 refetch 불필요
    select: data => [...data].sort((a, b) => a.sort_order - b.sort_order),
  });
}

export function useExpenseCategories() {
  const result = useCategories();
  return {
    ...result,
    data: result.data?.filter(c => c.type === 'expense') ?? [],
  };
}

export function useIncomeCategories() {
  const result = useCategories();
  return {
    ...result,
    data: result.data?.filter(c => c.type === 'income') ?? [],
  };
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { userProfile } = useAuthStore();

  return useMutation({
    mutationFn: (input: CategoryInput) => {
      const coupleId = userProfile?.couple_id;
      if (!coupleId) throw new Error('로그인이 필요합니다');
      return createCategory(coupleId, input);
    },
    onSuccess: newItem => {
      const coupleId = userProfile?.couple_id;
      if (!coupleId) return;
      queryClient.setQueryData<Category[]>(['categories', coupleId], old => [
        ...(old ?? []),
        newItem,
      ]);
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const { userProfile } = useAuthStore();

  return useMutation({
    mutationFn: ({ id, ...input }: Partial<CategoryInput> & { id: string }) =>
      updateCategory(id, input),
    onSuccess: updatedItem => {
      const coupleId = userProfile?.couple_id;
      if (!coupleId) return;
      queryClient.setQueryData<Category[]>(['categories', coupleId], old =>
        (old ?? []).map(item =>
          item.id === updatedItem.id ? updatedItem : item,
        ),
      );
    },
  });
}

export function useReorderCategories() {
  const queryClient = useQueryClient();
  const { userProfile } = useAuthStore();

  return useMutation({
    mutationFn: (updates: { id: string; sort_order: number }[]) =>
      updateCategoryOrders(updates),
    onMutate: async updates => {
      const coupleId = userProfile?.couple_id;
      if (!coupleId) return;
      await queryClient.cancelQueries({ queryKey: ['categories', coupleId] });
      const previous = queryClient.getQueryData<Category[]>([
        'categories',
        coupleId,
      ]);
      queryClient.setQueryData<Category[]>(['categories', coupleId], old =>
        (old ?? []).map(item => {
          const update = updates.find(u => u.id === item.id);
          return update ? { ...item, sort_order: update.sort_order } : item;
        }),
      );
      return { previous };
    },
    onError: (_, __, context) => {
      const coupleId = userProfile?.couple_id;
      if (!coupleId || !context?.previous) return;
      queryClient.setQueryData(['categories', coupleId], context.previous);
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const { userProfile } = useAuthStore();

  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: (_, id) => {
      const coupleId = userProfile?.couple_id;
      if (!coupleId) return;
      queryClient.setQueryData<Category[]>(['categories', coupleId], old =>
        (old ?? []).filter(item => item.id !== id),
      );
    },
  });
}
