import { View, Text, TouchableOpacity } from 'react-native';
import {
  Bell,
  MessageCircle,
  Receipt,
  CalendarClock,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { BottomSheet } from '@/components/ui/bottom-sheet';

type Props = {
  visible: boolean;
  onAllow: () => void;
  onDismiss: () => void;
};

const NOTIFICATION_ITEMS = [
  { Icon: MessageCircle, label: '짝꿍 댓글 알림' },
  { Icon: Receipt, label: '짝꿍 새 지출 알림' },
  { Icon: CalendarClock, label: '고정지출 납부일 리마인더' },
];

export function PushPermissionModal({ visible, onAllow, onDismiss }: Props) {
  return (
    <BottomSheet visible={visible} onClose={onDismiss}>
      <View className='items-center mb-5 pt-1'>
        <View
          className='w-16 h-16 rounded-3xl items-center justify-center mb-4'
          style={{ backgroundColor: Colors.butter }}
        >
          <Bell size={28} color={Colors.brownDarker} strokeWidth={2.5} />
        </View>
        <Text className='font-ibm-bold text-xl text-neutral-800 text-center'>
          알림을 켜면 놓치지 않아요
        </Text>
        <Text className='font-ibm-regular text-sm text-neutral-400 text-center mt-1'>
          중요한 소식을 바로 알려드릴게요
        </Text>
      </View>

      <View className='bg-neutral-50 rounded-2xl px-4 py-3 mb-6 gap-3'>
        {NOTIFICATION_ITEMS.map(({ Icon, label }) => (
          <View key={label} className='flex-row items-center gap-3'>
            <View
              className='w-8 h-8 rounded-xl items-center justify-center'
              style={{ backgroundColor: Colors.cream }}
            >
              <Icon size={16} color={Colors.brownDark} strokeWidth={2} />
            </View>
            <Text className='font-ibm-regular text-sm text-neutral-700'>
              {label}
            </Text>
          </View>
        ))}
      </View>

      <View className='flex-row gap-3'>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onDismiss();
          }}
          className='flex-1 py-4 rounded-2xl items-center'
          style={{ backgroundColor: Colors.cream }}
          activeOpacity={0.8}
        >
          <Text className='font-ibm-semibold text-base text-neutral-500'>
            나중에
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onAllow();
          }}
          className='flex-1 py-4 rounded-2xl items-center'
          style={{ backgroundColor: Colors.butter }}
          activeOpacity={0.8}
        >
          <Text className='font-ibm-bold text-base text-brown-darker'>
            알림 켜기
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}
