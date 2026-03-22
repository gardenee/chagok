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

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['couple-members'] });
      queryClient.invalidateQueries({ queryKey: ['couple', coupleId] });
    };

    // 파트너 닉네임 변경 등 기존 멤버 row 변경 감지
    const usersChannel = supabase
      .channel(`couple-members-${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `couple_id=eq.${coupleId}`,
        },
        invalidate,
      )
      .subscribe();

    // 파트너 최초 조인 감지 (join_couple RPC가 couples.invite_code를 null로 변경함)
    const coupleChannel = supabase
      .channel(`couple-info-${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'couples',
          filter: `id=eq.${coupleId}`,
        },
        invalidate,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(coupleChannel);
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
    staleTime: Infinity,
  });
}
