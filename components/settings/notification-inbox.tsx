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
import { useEffect } from 'react';
import { Bell, X } from 'lucide-react-native';
import {
  useNotifications,
  useMarkAllNotificationsAsRead,
} from '@/hooks/use-notifications';
import { NotificationItem } from '@/components/settings/notification-item';
import { Colors } from '@/constants/colors';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function NotificationInbox({ visible, onClose }: Props) {
  const { data: notifications = [], isLoading, isSuccess } = useNotifications();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  // 데이터 로드 완료 후 전체 읽음 처리
  // visible도 dependency에 포함 → 모달 닫혔다 다시 열릴 때도 재호출 보장
  // (isSuccess만 넣으면 이미 true인 상태에서 재오픈 시 재호출 안 됨)
  // markAllAsRead는 useCallback으로 안정화되어 있으므로 dependency 포함 가능
  useEffect(() => {
    if (visible && isSuccess) {
      markAllAsRead();
    }
  }, [visible, isSuccess, markAllAsRead]);

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={onClose}
    >
      <SafeAreaView className='flex-1 bg-cream'>
        {/* 헤더 */}
        <View className='flex-row items-center justify-between px-6 pt-4 pb-4 border-b border-cream-dark'>
          <Text className='font-ibm-bold text-xl text-brown'>알림</Text>
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
          <View className='flex-1 items-center justify-center gap-2'>
            <Bell size={36} color='#D4D4D4' strokeWidth={1.5} />
            <Text className='font-ibm-semibold text-sm text-brown/40'>
              아직 알림이 없어요
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <NotificationItem notification={item} />}
            contentContainerStyle={{ padding: 16, gap: 8 }} // FlatList prop은 className 미지원 → inline style 허용
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}
