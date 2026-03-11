import { View, Text } from 'react-native';
import { TrendingUp, Wallet, Scale } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Shadows } from '@/constants/shadows';
import { formatAmount } from '@/utils/format';

type Props = {
  totalIncome: number;
  totalSpent: number;
  totalBudget: number;
};

export function BudgetSummaryCards({
  totalIncome,
  totalSpent,
  totalBudget,
}: Props) {
  const isOver = totalSpent > totalBudget && totalBudget > 0;
  const balance = totalIncome - totalSpent;
  const isPositive = balance >= 0;

  return (
    <View className='mx-4 mb-4'>
      <View className='flex-row gap-3 mb-3'>
        {/* 총 수입 카드 */}
        <View
          className='flex-1 bg-olive-light rounded-3xl p-4'
          style={Shadows.primary}
        >
          <View className='flex-row items-center gap-2 mb-1'>
            <TrendingUp size={16} color={Colors.oliveDark} strokeWidth={2.5} />
            <Text className='font-ibm-semibold text-xs text-neutral-500'>
              총 수입
            </Text>
          </View>
          <Text
            className='font-ibm-bold text-base'
            style={{ color: Colors.oliveDark }}
          >
            {formatAmount(totalIncome)}원
          </Text>
        </View>

        {/* 총 지출 카드 */}
        <View
          className='flex-1 bg-peach-light rounded-3xl p-4'
          style={Shadows.primary}
        >
          <View className='flex-row items-center gap-2 mb-1'>
            <Wallet
              size={16}
              color={isOver ? Colors.peachDark : '#a3a3a3'}
              strokeWidth={2.5}
            />
            <Text className='font-ibm-semibold text-xs text-neutral-500'>
              총 지출
            </Text>
          </View>
          <Text
            className='font-ibm-bold text-base'
            style={{ color: isOver ? Colors.peachDark : '#404040' }}
          >
            {formatAmount(totalSpent)}원
          </Text>
        </View>
      </View>

      {/* 결산 카드 */}
      <View className='bg-white rounded-3xl px-4 py-3' style={Shadows.primary}>
        <View className='flex-row items-center justify-between'>
          <View className='flex-row items-center gap-2'>
            <Scale
              size={16}
              color={isPositive ? Colors.oliveDark : Colors.peachDark}
              strokeWidth={2.5}
            />
            <Text className='font-ibm-semibold text-sm text-neutral-600'>
              이번달 결산
            </Text>
          </View>
          <Text
            className='font-ibm-bold text-base'
            style={{
              color: isPositive ? Colors.oliveDark : Colors.peachDark,
            }}
          >
            {isPositive
              ? `+${formatAmount(balance)}원`
              : `-${formatAmount(Math.abs(balance))}원`}
          </Text>
        </View>
      </View>
    </View>
  );
}
