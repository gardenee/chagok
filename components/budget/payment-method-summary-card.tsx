import { View, Text } from 'react-native';
import { Shadows } from '@/constants/shadows';
import { formatAmount } from '@/utils/format';
import type { PaymentMethod } from '@/types/database';

type Props = { pm: PaymentMethod; spent: number } | { pm: null; spent: number };

export function PaymentMethodSummaryCard({ pm: _, spent }: Props) {
  return (
    <View
      className='mx-4 mt-2 mb-4 rounded-3xl p-5 bg-cream-dark'
      style={Shadows.card}
    >
      <Text className='font-ibm-semibold text-base mb-0.5 text-neutral-700'>
        이번달 사용액
      </Text>
      <Text className='font-ibm-bold text-4xl leading-[44px] text-brown-darker'>
        {formatAmount(spent)}원
      </Text>
    </View>
  );
}
