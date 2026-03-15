// components/settings/notification-item.tsx
import { View, Text, TouchableOpacity } from 'react-native';
import { MessageCircle, Wallet } from 'lucide-react-native';
import type { Notification } from '@/hooks/use-notifications';
import { Colors } from '@/constants/colors';
import { ICON_MAP } from '@/constants/icon-map';
import { resolveColor } from '@/constants/color-map';

type Props = {
  notification: Notification;
  onPress?: () => void;
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

export function NotificationItem({ notification, onPress }: Props) {
  const isUnread = !notification.is_read;
  const CatIcon = notification.icon
    ? (ICON_MAP[notification.icon] ?? Wallet)
    : null;
  const iconColor = notification.icon_color
    ? resolveColor(notification.icon_color)
    : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      className={`flex-row items-center gap-3 px-4 py-3 ${isUnread ? '' : 'opacity-75'}`}
    >
      {/* 아이콘 박스 */}
      {CatIcon && iconColor ? (
        <View
          className='w-10 h-10 rounded-xl items-center justify-center flex-shrink-0'
          style={{ backgroundColor: iconColor + '30' }}
        >
          <CatIcon size={20} color={iconColor} strokeWidth={2.5} />
        </View>
      ) : (
        <View className='w-10 h-10 rounded-xl bg-lavender items-center justify-center flex-shrink-0'>
          <MessageCircle
            size={20}
            color={Colors.neutralLight}
            strokeWidth={2.5}
          />
        </View>
      )}

      {/* 텍스트 */}
      <View className='flex-1 min-w-0'>
        <Text
          className='font-ibm-semibold text-base text-neutral-800'
          numberOfLines={1}
        >
          {notification.title}
        </Text>
        <Text
          className='font-ibm-regular text-xs text-neutral-700 mt-0.5'
          numberOfLines={1}
        >
          {notification.body} · {formatRelativeTime(notification.created_at)}
        </Text>
      </View>

      {/* 읽음 점 */}
      {isUnread && (
        <View className='w-2 h-2 rounded-full bg-peach flex-shrink-0' />
      )}
    </TouchableOpacity>
  );
}
