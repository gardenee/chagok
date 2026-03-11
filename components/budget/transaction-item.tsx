import { View, Text } from 'react-native';
import { Colors } from '@/constants/colors';
import { Shadows } from '@/constants/shadows';
import { TagPill } from '@/components/ui/color-pill';
import { formatAmount } from '@/utils/format';
import type { Transaction } from '@/types/database';

const TAG_LABELS: Record<string, string> = {
  me: '나',
  partner: '파트너',
  together: '함께',
};

type Props = {
  transaction: Transaction;
};

export function TransactionItem({ transaction: t }: Props) {
  return (
    <View
      className='bg-white rounded-3xl px-4 py-4 flex-row items-center gap-3'
      style={Shadows.soft}
    >
      <View className='flex-1'>
        <View className='flex-row items-center gap-2 mb-0.5'>
          <Text className='font-ibm-regular text-xs text-neutral-400'>
            {t.date.slice(5).replace('-', '.')}
          </Text>
          <TagPill tag={t.tag} label={TAG_LABELS[t.tag] ?? t.tag} />
        </View>
        <Text className='font-ibm-semibold text-sm text-neutral-700'>
          {t.memo ?? '메모 없음'}
        </Text>
      </View>
      <Text
        className='font-ibm-bold text-base'
        style={{
          color: t.type === 'income' ? Colors.oliveDark : Colors.brownDarker,
        }}
      >
        {t.type === 'income' ? '+' : '-'}
        {formatAmount(t.amount)}원
      </Text>
    </View>
  );
}
