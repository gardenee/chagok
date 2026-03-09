import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';
import {
  fetchTransactionComments,
  createComment,
  deleteComment,
  type CommentRow,
} from '../services/comments';
import { sendPartnerCommentPush } from '../services/notifications';

export type { CommentRow };

export function useTransactionComments(transactionId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!transactionId) return;
    const channel = supabase
      .channel(`comments-${transactionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `transaction_id=eq.${transactionId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ['comments', transactionId],
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [transactionId, queryClient]);

  return useQuery<CommentRow[]>({
    queryKey: ['comments', transactionId],
    queryFn: () => fetchTransactionComments(transactionId),
    enabled: !!transactionId,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  const { session, userProfile } = useAuthStore();

  return useMutation({
    mutationFn: ({
      transactionId,
      content,
    }: {
      transactionId: string;
      content: string;
    }) => {
      const userId = session?.user.id;
      if (!userId) throw new Error('로그인이 필요합니다');
      return createComment(userId, transactionId, content);
    },
    onSuccess: newComment => {
      queryClient.setQueryData<CommentRow[]>(
        ['comments', newComment.transaction_id],
        old => [...(old ?? []), newComment],
      );

      const coupleId = userProfile?.couple_id;
      const nickname = userProfile?.nickname;
      const userId = session?.user.id;
      if (coupleId && nickname && userId) {
        sendPartnerCommentPush({
          coupleId,
          commenterId: userId,
          commenterNickname: nickname,
          content: newComment.content,
        }).catch(() => {});
      }
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      transactionId,
    }: {
      id: string;
      transactionId: string;
    }) => deleteComment(id).then(() => ({ transactionId })),
    onSuccess: ({ transactionId }, { id }) => {
      queryClient.setQueryData<CommentRow[]>(['comments', transactionId], old =>
        (old ?? []).filter(c => c.id !== id),
      );
    },
  });
}
