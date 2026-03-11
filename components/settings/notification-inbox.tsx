import {
  Modal,
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Bell, X } from 'lucide-react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function NotificationInbox({ visible, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={onClose}
    >
      <SafeAreaView className='flex-1 bg-cream'>
        <View className='flex-row items-center justify-between px-6 pt-4 pb-4 border-b border-cream-dark'>
          <Text className='font-ibm-bold text-xl text-brown-darker'>알림</Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={22} color='#A3A3A3' strokeWidth={2} />
          </TouchableOpacity>
        </View>
        <View className='flex-1 items-center justify-center gap-2'>
          <Bell size={36} color='#D4D4D4' strokeWidth={1.5} />
          <Text className='font-ibm-semibold text-sm text-neutral-400'>
            아직 알림이 없어요
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
