import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      animationType='slide'
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className='flex-1 justify-end'
      >
        <TouchableOpacity
          className='flex-1'
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          className='bg-white rounded-t-3xl px-6 pt-5'
          style={{
            paddingBottom: Math.max(insets.bottom, 24),
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: -4 },
          }}
        >
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

type BottomSheetHeaderProps = {
  title: string;
  onClose: () => void;
  onDelete?: () => void;
  className?: string;
};

export function BottomSheetHeader({
  title,
  onClose,
  onDelete,
  className = 'mb-5',
}: BottomSheetHeaderProps) {
  return (
    <View className={`flex-row items-center justify-between ${className}`}>
      <Text className='font-ibm-bold text-lg text-neutral-800'>{title}</Text>
      <View className='flex-row items-center gap-3'>
        {onDelete && (
          <TouchableOpacity
            onPress={onDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Trash2 size={18} color='#A3A3A3' strokeWidth={2} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={22} color='#A3A3A3' strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
