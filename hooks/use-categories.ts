import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type CategoryInput,
} from '../services/categories';
import type { Category } from '../types/database';

export type { CategoryInput };

export function useCategories() {
  const { userProfile } = useAuthStore();
  const coupleId = userProfile?.couple_id;

  return useQuery<Category[]>({
    queryKey: ['categories', coupleId],
    queryFn: () => fetchCategories(coupleId!),
    enabled: !!coupleId,
  });
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
