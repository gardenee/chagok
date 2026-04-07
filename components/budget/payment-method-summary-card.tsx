import { View, Text } from 'react-native';
import { Wallet } from 'lucide-react-native';
import { Shadows } from '@/constants/shadows';
import { IconBox } from '@/components/ui/icon-box';
import { PM_TYPE_OPTIONS } from '@/constants/payment-method';
import { formatAmount } from '@/utils/format';
import { Colors } from '@/constants/colors';
import type { PaymentMethod } from '@/types/database';

type Props = { pm: PaymentMethod; spent: number } | { pm: null; spent: number };

export function PaymentMethodSummaryCard({ pm, spent }: Props) {
  const pmType = pm
    ? (PM_TYPE_OPTIONS.find(t => t.key === pm.type) ??
      PM_TYPE_OPTIONS[PM_TYPE_OPTIONS.length - 1])
    : null;

  return (
    <View
      className='mx-4 mt-2 mb-4 rounded-3xl p-5 bg-cream-dark'
      style={Shadows.card}
    >
      <View className='flex-row items-center gap-2.5 mb-3'>
        {pmType ? (
          <IconBox color={pmType.color} size='md'>
            <pmType.Icon size={20} color={pmType.color} strokeWidth={2.5} />
          </IconBox>
        ) : (
          <View className='w-10 h-10 rounded-2xl bg-neutral-100 items-center justify-center'>
            <Wallet size={19} color={Colors.neutralLighter} strokeWidth={2.5} />
          </View>
        )}
        <Text className='font-ibm-semibold text-base text-neutral-800'>
          {pmType ? pmType.label : '결제수단 미지정'}
        </Text>
      </View>

      <Text className='font-ibm-semibold text-base mb-0.5 text-neutral-700'>
        이번달 사용액
      </Text>
      <Text className='font-ibm-bold text-4xl leading-[44px] text-brown-darker'>
        {formatAmount(spent)}원
      </Text>
    </View>
  );
}
