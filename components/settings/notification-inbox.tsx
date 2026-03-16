// components/settings/notification-inbox.tsx
import {
  Modal,
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Bell, X } from 'lucide-react-native';
import {
  useNotifications,
  useMarkAllNotificationsAsRead,
} from '@/hooks/use-notifications';
import type { Notification } from '@/hooks/use-notifications';
import { NotificationItem } from '@/components/settings/notification-item';
import { Colors } from '@/constants/colors';
import { EmptyState } from '../ui/empty-state';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function NotificationInbox({ visible, onClose }: Props) {
  const router = useRouter();
  const { data: notifications = [], isLoading } = useNotifications();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  function handleNotificationPress(notification: Notification) {
    onClose();
    if (
      (notification.type === 'comment' ||
        notification.type === 'partner_transaction') &&
      notification.reference_id
    ) {
      router.push({
        pathname: '/(tabs)/calendar',
        params: { openTxId: notification.reference_id },
      });
    }
  }

  // 모달이 닫히거나(visible: true→false) 컴포넌트가 언마운트될 때 전체 읽음 처리
  const wasVisibleRef = useRef(false);
  useEffect(() => {
    if (visible) {
      wasVisibleRef.current = true;
    } else if (wasVisibleRef.current) {
      markAllAsRead();
      wasVisibleRef.current = false;
    }
  }, [visible, markAllAsRead]);

  useEffect(() => {
    return () => {
      if (wasVisibleRef.current) markAllAsRead();
    };
  }, [markAllAsRead]);

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={onClose}
    >
      <SafeAreaView className='flex-1 bg-white'>
        {/* 헤더 */}
        <View className='flex-row items-center justify-between px-8 pt-8 pb-5'>
          <Text className='font-ibm-bold text-2xl text-brown-darker'>알림</Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={22} color={Colors.neutralLight} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* 목록 */}
        {isLoading ? (
          <View className='flex-1 items-center justify-center'>
            <ActivityIndicator color={Colors.brown} />
          </View>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title='아직 알림이 없어요'
            description='알림이 없습니다'
            containerClassName='mx-4 mt-5'
          />
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <NotificationItem
                notification={item}
                onPress={() => handleNotificationPress(item)}
              />
            )}
            ItemSeparatorComponent={() => (
              <View className='h-px bg-cream-dark mx-8' />
            )}
            contentContainerStyle={{ paddingVertical: 8 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}
