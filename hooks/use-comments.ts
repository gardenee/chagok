import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Comment } from '../types/database';
import { useAuthStore } from '../store/auth';

export type CommentRow = Comment & {
  users: { nickname: string } | null;
};

export function useTransactionComments(transactionId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!transactionId) return;
    const channel = supabase
      .channel(`comments-${transactionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `transaction_id=eq.${transactionId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['comments', transactionId] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [transactionId, queryClient]);

  return useQuery<CommentRow[]>({
    queryKey: ['comments', transactionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*, users(nickname)')
        .eq('transaction_id', transactionId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as CommentRow[];
    },
    enabled: !!transactionId,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  const { session } = useAuthStore();

  return useMutation({
    mutationFn: async ({ transactionId, content }: { transactionId: string; content: string }) => {
      const userId = session?.user.id;
      if (!userId) throw new Error('로그인이 필요합니다');

      const { data, error } = await supabase
        .from('comments')
        .insert({ transaction_id: transactionId, user_id: userId, content })
        .select('*, users(nickname)')
        .single();
      if (error) throw error;
      return data as CommentRow;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['comments', data.transaction_id] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, transactionId }: { id: string; transactionId: string }) => {
      const { error } = await supabase.from('comments').delete().eq('id', id);
      if (error) throw error;
      return { transactionId };
    },
    onSuccess: ({ transactionId }) => {
      queryClient.invalidateQueries({ queryKey: ['comments', transactionId] });
    },
  });
}
