import { View, Text } from 'react-native';
import { Colors } from '@/constants/colors';
import { Shadows } from '@/constants/shadows';
import { TagPill } from '@/components/ui/color-pill';
import { formatAmount } from '@/utils/format';
import type { Transaction } from '@/types/database';

type Props = {
  transaction: Transaction;
  tagLabel?: string;
};

export function TransactionItem({ transaction: t, tagLabel }: Props) {
  const hasMemo = t.memo && t.memo.trim().length > 0;

  return (
    <View
      className='bg-white rounded-3xl px-4 py-5 flex-row items-center gap-3'
      style={Shadows.primary}
    >
      {/* 날짜 */}
      <Text className='font-ibm-regular text-sm text-neutral-600 w-11 shrink-0'>
        {t.date.slice(5).replace('-', '.')}
      </Text>

      {/* 메모 + 태그 */}
      <View className='flex-1 flex-row items-center gap-2 overflow-hidden'>
        <Text
          className='font-ibm-semibold text-base text-neutral-800 shrink'
          numberOfLines={1}
        >
          {hasMemo ? t.memo : '—'}
        </Text>
        {t.tag && tagLabel && <TagPill tag={t.tag} label={tagLabel} />}
      </View>

      {/* 금액 */}
      <Text
        className='font-ibm-bold text-base shrink-0'
        style={{
          color:
            t.type === 'transfer'
              ? Colors.lavender
              : t.type === 'income'
                ? Colors.oliveDark
                : Colors.brownDarker,
        }}
      >
        {t.type === 'income' ? '+' : t.type === 'transfer' ? '' : '-'}
        {formatAmount(t.amount)}원
      </Text>
    </View>
  );
}
