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
  const hasMemo = t.memo && t.memo.trim().length > 0;

  return (
    <View
      className='bg-white rounded-3xl px-4 py-3.5 flex-row items-center gap-2.5'
      style={Shadows.soft}
    >
      {/* 날짜 */}
      <Text className='font-ibm-regular text-xs text-neutral-400 w-9 shrink-0'>
        {t.date.slice(5).replace('-', '.')}
      </Text>

      {/* 메모 (거래 이름) */}
      <Text
        className='font-ibm-semibold text-sm flex-1'
        style={{ color: hasMemo ? '#404040' : '#BDBDBD' }}
        numberOfLines={1}
      >
        {hasMemo ? t.memo : '—'}
      </Text>

      {/* 태그 */}
      <TagPill tag={t.tag} label={TAG_LABELS[t.tag] ?? t.tag} />

      {/* 금액 */}
      <Text
        className='font-ibm-bold text-sm shrink-0'
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
