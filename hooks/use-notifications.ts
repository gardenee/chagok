// hooks/use-notifications.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import {
  fetchNotifications,
  markAllNotificationsAsRead,
} from '@/services/notifications';
import type { Notification } from '@/types/database';

export type { Notification };

export function useNotifications() {
  const { session } = useAuthStore();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  // Realtime 구독: 새 알림 INSERT 시 캐시 갱신
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ['notifications', userId],
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return useQuery<Notification[]>({
    queryKey: ['notifications', userId],
    queryFn: () => fetchNotifications(userId!),
    enabled: !!userId,
  });
}

export function useUnreadCount() {
  const result = useNotifications();
  const unreadCount = (result.data ?? []).filter(n => !n.is_read).length;
  return { ...result, unreadCount };
}

export function useMarkAllNotificationsAsRead() {
  const { session } = useAuthStore();
  const queryClient = useQueryClient();
  const userId = session?.user.id;

  // useCallback으로 안정적인 참조 유지 → useEffect dependency 오류 방지
  return useCallback(
    async function markAllAsRead() {
      if (!userId) return;
      await markAllNotificationsAsRead(userId);
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
    [userId, queryClient],
  );
}
