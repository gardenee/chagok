// components/settings/notification-item.tsx
import { View, Text } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import type { Notification } from '@/hooks/use-notifications';

type Props = {
  notification: Notification;
};

function formatRelativeTime(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '방금';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}일 전`;
}

export function NotificationItem({ notification }: Props) {
  const hasIcon = !!notification.icon;
  const isUnread = !notification.is_read;

  return (
    // 읽은 알림은 흐리게 (opacity-60)
    <View
      className={`flex-row items-center gap-3 px-4 py-3 bg-cream-light rounded-2xl ${isUnread ? '' : 'opacity-60'}`}
    >
      {/* 아이콘 박스 */}
      {hasIcon ? (
        <View
          className='w-9 h-9 rounded-xl items-center justify-center flex-shrink-0'
          style={{ backgroundColor: notification.icon_color ?? '#FAD97A' }}
        >
          <Text style={{ fontSize: 18 }}>{notification.icon}</Text>
        </View>
      ) : (
        <View className='w-9 h-9 rounded-xl bg-lavender items-center justify-center flex-shrink-0'>
          <MessageCircle size={18} color='#7B5E3A' strokeWidth={2} />
        </View>
      )}

      {/* 텍스트 */}
      <View className='flex-1 min-w-0'>
        <Text
          className='font-ibm-semibold text-sm text-brown'
          numberOfLines={1}
        >
          {notification.title}
        </Text>
        <Text
          className='font-ibm-regular text-xs text-brown/50 mt-0.5'
          numberOfLines={1}
        >
          {notification.body} · {formatRelativeTime(notification.created_at)}
        </Text>
      </View>

      {/* 읽음 점 */}
      {isUnread && (
        <View className='w-2 h-2 rounded-full bg-peach flex-shrink-0' />
      )}
    </View>
  );
}
