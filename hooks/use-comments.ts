import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import {
  fetchTransactionComments,
  createComment,
  deleteComment,
  type CommentRow,
} from '@/services/comments';
import { sendPartnerCommentPush } from '@/services/notifications';
import { useNotificationSettingsStore } from '@/store/notification-settings';

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
  const { comment: notifyEnabled } = useNotificationSettingsStore();

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
    onMutate: async ({ transactionId, content }) => {
      await queryClient.cancelQueries({
        queryKey: ['comments', transactionId],
      });
      const previous = queryClient.getQueryData<CommentRow[]>([
        'comments',
        transactionId,
      ]);
      const userId = session?.user.id ?? '';
      const optimistic: CommentRow = {
        id: `temp-${Date.now()}`,
        transaction_id: transactionId,
        user_id: userId,
        content,
        created_at: new Date().toISOString(),
        users: userProfile?.nickname
          ? { nickname: userProfile.nickname }
          : null,
      };
      queryClient.setQueryData<CommentRow[]>(
        ['comments', transactionId],
        old => [...(old ?? []), optimistic],
      );
      return { previous, transactionId };
    },
    onError: (_err, _vars, context) => {
      if (context) {
        queryClient.setQueryData(
          ['comments', context.transactionId],
          context.previous,
        );
      }
    },
    onSuccess: (newComment, _vars, context) => {
      queryClient.setQueryData<CommentRow[]>(
        ['comments', context?.transactionId ?? newComment.transaction_id],
        old =>
          (old ?? []).map(c => (c.id.startsWith('temp-') ? newComment : c)),
      );

      const coupleId = userProfile?.couple_id;
      const nickname = userProfile?.nickname;
      const userId = session?.user.id;
      if (notifyEnabled && coupleId && nickname && userId) {
        sendPartnerCommentPush({
          coupleId,
          commenterId: userId,
          commenterNickname: nickname,
          content: newComment.content,
          transactionId: newComment.transaction_id,
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
