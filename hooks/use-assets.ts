import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Asset } from '@/types/database';
import { useAuthStore } from '@/store/auth';
import { fetchAssets } from '@/services/assets';

type AssetInput = {
  name: string;
  amount?: number | null;
  type: string;
  icon: string;
  color: string;
  sort_order?: number;
};

export function useAssets() {
  const { userProfile } = useAuthStore();
  const coupleId = userProfile?.couple_id;

  return useQuery<Asset[]>({
    queryKey: ['assets', coupleId],
    queryFn: async () => {
      if (!coupleId) return [];
      return fetchAssets(coupleId);
    },
    enabled: !!coupleId,
    staleTime: Infinity, // mutation setQueryData로 즉시 반영
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  const { userProfile } = useAuthStore();

  return useMutation({
    mutationFn: async (input: AssetInput) => {
      const coupleId = userProfile?.couple_id;
      if (!coupleId) throw new Error('로그인이 필요합니다');
      const { data, error } = await supabase
        .from('assets')
        .insert({ ...input, couple_id: coupleId })
        .select()
        .single();
      if (error) throw error;
      return data as Asset;
    },
    onSuccess: newItem => {
      const coupleId = userProfile?.couple_id;
      if (!coupleId) return;
      queryClient.setQueryData<Asset[]>(['assets', coupleId], old => [
        ...(old ?? []),
        newItem,
      ]);
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  const { userProfile } = useAuthStore();

  return useMutation({
    mutationFn: async ({
      id,
      ...update
    }: { id: string } & Partial<AssetInput>) => {
      const { data, error } = await supabase
        .from('assets')
        .update(update)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Asset;
    },
    onSuccess: updatedItem => {
      const coupleId = userProfile?.couple_id;
      if (!coupleId) return;
      queryClient.setQueryData<Asset[]>(['assets', coupleId], old =>
        (old ?? []).map(item =>
          item.id === updatedItem.id ? updatedItem : item,
        ),
      );
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  const { userProfile } = useAuthStore();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      const coupleId = userProfile?.couple_id;
      if (!coupleId) return;
      queryClient.setQueryData<Asset[]>(['assets', coupleId], old =>
        (old ?? []).filter(item => item.id !== id),
      );
    },
  });
}
