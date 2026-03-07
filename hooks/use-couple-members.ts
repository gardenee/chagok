import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types/database';
import { useAuthStore } from '../store/auth';

export function useCoupleMembers() {
  const { userProfile } = useAuthStore();
  const coupleId = userProfile?.couple_id;

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
