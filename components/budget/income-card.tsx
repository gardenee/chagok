import { View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/colors';
import { Shadows } from '@/constants/shadows';
import { IconBox } from '@/components/ui/icon-box';
import { CategoryIcon } from '@/components/budget/category-icon';
import { formatAmount } from '@/utils/format';
import type { Category } from '@/types/database';

type Props = {
  c: Category;
  income: number;
  onPress: () => void;
};

export function IncomeCard({ c, income, onPress }: Props) {
  const hasTarget = c.budget_amount > 0;
  const over = hasTarget && income > c.budget_amount;
  const diff = hasTarget ? income - c.budget_amount : 0;

  const incomeRatio = hasTarget ? Math.min(income / c.budget_amount, 1) : 0;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View className='bg-white rounded-3xl p-3' style={Shadows.primary}>
        {/* 1행: 아이콘 + 카테고리명 + 목표·수입 수치 */}
        <View className='flex-row items-center gap-2 mb-2'>
          <IconBox color={c.color}>
            <CategoryIcon iconKey={c.icon} color={c.color} />
          </IconBox>
          <Text
            className='font-ibm-semibold text-sm text-neutral-700 flex-1'
            numberOfLines={1}
          >
            {c.name}
          </Text>
          {hasTarget ? (
            <View className='flex-row items-baseline gap-1'>
              <Text className='font-ibm-regular text-xs text-neutral-400'>
                목표
              </Text>
              <Text className='font-ibm-bold text-sm text-neutral-700'>
                {formatAmount(c.budget_amount)}원
              </Text>
              <Text className='font-ibm-regular text-xs text-neutral-300'>
                ·
              </Text>
              <Text className='font-ibm-regular text-xs text-neutral-400'>
                수입
              </Text>
              <Text
                className='font-ibm-bold text-sm'
                style={{ color: over ? Colors.oliveDark : '#404040' }}
              >
                {formatAmount(income)}원
              </Text>
            </View>
          ) : (
            <View className='flex-row items-baseline gap-1'>
              <Text className='font-ibm-bold text-sm text-neutral-700'>
                {formatAmount(income)}원
              </Text>
              <Text className='font-ibm-regular text-xs text-neutral-400'>
                이번달 수입
              </Text>
            </View>
          )}
        </View>

        {/* 2행: 프로그레스바(flex:2 고정) + 차액 뱃지(flex:1) */}
        {hasTarget && (
          <View className='flex-row items-center gap-2'>
            <View
              className='rounded-full overflow-hidden'
              style={{ flex: 2, height: 6, backgroundColor: '#f0f0f0' }}
            >
              <View
                className='rounded-full h-full'
                style={{
                  width: `${incomeRatio * 100}%`,
                  backgroundColor: over ? Colors.oliveDark : Colors.olive,
                }}
              />
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <View
                className='px-2 py-0.5 rounded-full'
                style={{
                  backgroundColor: over
                    ? `${Colors.olive}30`
                    : `${Colors.peach}40`,
                }}
              >
                <Text
                  className='font-ibm-bold text-xs'
                  style={{
                    color: over ? Colors.oliveDarker : Colors.peachDarker,
                  }}
                >
                  {over
                    ? `초과달성 +${formatAmount(diff)}원`
                    : `미달 -${formatAmount(Math.abs(diff))}원`}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
