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
      {/* 오버레이: KAV와 독립적으로 전체 화면 덮음. 터치하면 닫힘 */}
      <TouchableOpacity
        className='absolute inset-0'
        activeOpacity={1}
        onPress={onClose}
      />
      {/* KAV가 시트만 감싸서 키보드 위로 시트가 올라오게 함.
          pointerEvents='box-none'으로 KAV 프레임 자체는 터치를 막지 않음 */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className='flex-1 justify-end'
        pointerEvents='box-none'
      >
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
