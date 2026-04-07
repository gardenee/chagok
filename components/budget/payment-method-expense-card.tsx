import { View, Text, TouchableOpacity } from 'react-native';
import { Shadows } from '@/constants/shadows';
import { IconBox } from '@/components/ui/icon-box';
import { PM_TYPE_OPTIONS } from '@/constants/payment-method';
import { formatAmount } from '@/utils/format';
import type { PaymentMethod } from '@/types/database';

type Props = {
  pm: PaymentMethod;
  spent: number;
  onPress?: () => void;
};

export function PaymentMethodExpenseCard({ pm, spent, onPress }: Props) {
  const pmType =
    PM_TYPE_OPTIONS.find(t => t.key === pm.type) ??
    PM_TYPE_OPTIONS[PM_TYPE_OPTIONS.length - 1];

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className='bg-white rounded-3xl p-4'
      style={Shadows.primary}
    >
      <View className='flex-row items-center gap-2.5'>
        <IconBox color={pmType.color} size='md'>
          <pmType.Icon size={20} color={pmType.color} strokeWidth={2.5} />
        </IconBox>
        <Text
          className='font-ibm-semibold text-base text-neutral-700 flex-1'
          numberOfLines={1}
        >
          {pm.name}
        </Text>
        <View className='flex-row items-baseline gap-1'>
          <Text className='font-ibm-regular text-sm text-neutral-500'>
            사용
          </Text>
          <Text className='font-ibm-bold text-base text-neutral-700'>
            {formatAmount(spent)}원
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
