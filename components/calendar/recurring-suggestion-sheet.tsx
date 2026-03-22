import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Repeat } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

interface RecurringSuggestionSheetProps {
  visible: boolean;
  memo: string;
  onRegister: () => void;
  onDismiss: () => void;
}

export function RecurringSuggestionSheet({
  visible,
  memo,
  onRegister,
  onDismiss,
}: RecurringSuggestionSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType='slide'
      onRequestClose={onDismiss}
    >
      <View className='flex-1 justify-end'>
        <TouchableOpacity
          className='flex-1'
          activeOpacity={1}
          onPress={onDismiss}
        />
        <View className='bg-white rounded-t-3xl px-6 pt-6 pb-10'>
          <View className='flex-row items-center gap-3 mb-4'>
            <View className='w-11 h-11 rounded-2xl bg-lavender items-center justify-center'>
              <Repeat size={20} color={Colors.brown} strokeWidth={2.5} />
            </View>
            <View className='flex-1'>
              <Text className='font-ibm-bold text-base text-brown'>
                혹시 고정지출 아닌가요?
              </Text>
              <Text className='font-ibm-regular text-sm text-brown/60 mt-0.5'>
                지난달에도 비슷한 금액으로 결제됐어요
              </Text>
            </View>
          </View>

          <View className='bg-cream rounded-2xl px-4 py-3 mb-5'>
            <Text className='font-ibm-semibold text-base text-brown'>
              {memo}
            </Text>
          </View>

          <TouchableOpacity
            onPress={onRegister}
            className='bg-butter rounded-2xl py-4 items-center mb-3'
            activeOpacity={0.8}
          >
            <Text className='font-ibm-bold text-base text-brown'>
              고정지출로 등록하기
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onDismiss}
            className='py-3 items-center'
            activeOpacity={0.7}
          >
            <Text className='font-ibm-semibold text-sm text-brown/50'>
              아니에요
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
