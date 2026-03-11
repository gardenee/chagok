import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/types/database';
import { useAuthStore } from '@/store/auth';

export function useCoupleMembers() {
  const { userProfile } = useAuthStore();
  const coupleId = userProfile?.couple_id;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!coupleId) return;

    const channel = supabase
      .channel(`couple-members-${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `couple_id=eq.${coupleId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['couple-members'] });
          queryClient.invalidateQueries({ queryKey: ['couple', coupleId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, queryClient]);

  return useQuery<UserProfile[]>({
    queryKey: ['couple-members', coupleId],
    queryFn: async () => {
      if (!coupleId) return [];
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('couple_id', coupleId);
      if (error) throw error;
      return data;
    },
    enabled: !!coupleId,
  });
}
