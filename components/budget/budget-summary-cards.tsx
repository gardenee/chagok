import { View, Text } from 'react-native';
import { TrendingUp, Wallet, Scale } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Shadows } from '@/constants/shadows';
import { formatAmount, formatAmountShort } from '@/utils/format';

type Props = {
  totalIncome: number;
  totalSpent: number;
  totalBudget: number;
};

function DiffTag({ diff, positive }: { diff: number; positive: boolean }) {
  return (
    <View className='bg-white/40 rounded-full px-2 py-0.5'>
      <Text className='font-ibm-semibold text-xs text-neutral-700'>
        {formatAmountShort(Math.abs(diff))}원{positive ? ' 절약' : ' 초과'}
      </Text>
    </View>
  );
}

export function BudgetSummaryCards({
  totalIncome,
  totalSpent,
  totalBudget,
}: Props) {
  const balance = totalIncome - totalSpent;
  const isPositive = balance >= 0;

  const expenseDiff = totalBudget - totalSpent;

  return (
    <View className='mx-4 mb-4'>
      {/* 결산 카드 */}
      <View className='bg-white rounded-3xl px-4 py-3' style={Shadows.primary}>
        <View className='flex-row items-center justify-between'>
          <View className='flex-row items-center gap-2'>
            <Scale size={16} color={Colors.brownDark} strokeWidth={2.5} />
            <Text className='font-ibm-semibold text-sm text-neutral-800'>
              이번달 결산
            </Text>
          </View>
          <Text
            className='font-ibm-bold text-base'
            style={{
              color: isPositive ? Colors.oliveDarker : Colors.peachDarker,
            }}
          >
            {isPositive
              ? `+${formatAmount(balance)}원`
              : `-${formatAmount(Math.abs(balance))}원`}
          </Text>
        </View>
      </View>

      <View className='flex-row gap-3 mt-3'>
        {/* 총 수입 카드 */}
        <View className='flex-1 bg-olive rounded-3xl p-4' style={Shadows.card}>
          <View className='flex-row justify-between items-center mb-1.5'>
            <View className='flex-row items-center gap-2'>
              <TrendingUp
                size={16}
                color={Colors.oliveDarker}
                strokeWidth={2.5}
              />
              <Text className='font-ibm-semibold text-sm text-neutral-800'>
                월 수입
              </Text>
            </View>
          </View>
          <View className='flex-row justify-end items-center px-2 gap-0.5 mt-1'>
            <Text className='font-ibm-bold text-2xl text-olive-darker'>
              {formatAmount(totalIncome)}
            </Text>
            <Text className='font-ibm-semibold text-sm text-neutral-700'>
              원
            </Text>
          </View>
        </View>

        {/* 총 지출 카드 */}
        <View className='flex-1 bg-peach rounded-3xl p-4' style={Shadows.card}>
          <View className='flex-row justify-between items-center mb-1.5'>
            <View className='flex-row items-center gap-2'>
              <Wallet size={16} color={Colors.peachDarker} strokeWidth={2.5} />
              <Text className='font-ibm-semibold text-sm text-neutral-800'>
                월 지출
              </Text>
            </View>
            {totalBudget > 0 && (
              <DiffTag diff={expenseDiff} positive={expenseDiff >= 0} />
            )}
          </View>
          <View className='flex-row justify-end items-center px-2 gap-0.5 mt-1'>
            <Text className='font-ibm-bold text-2xl text-peach-darker'>
              {formatAmount(totalSpent)}
            </Text>
            <Text className='font-ibm-semibold text-sm text-neutral-700'>
              원
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
