import { View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/colors';
import { resolveColor } from '@/constants/color-map';
import { Shadows } from '@/constants/shadows';
import { IconBox } from '@/components/ui/icon-box';
import { CategoryIcon } from '@/components/budget/category-icon';
import { formatAmount } from '@/utils/format';
import type { Category } from '@/types/database';

type Props = {
  c: Category;
  spent: number;
  onPress: () => void;
};

export function ExpenseCard({ c, spent, onPress }: Props) {
  const color = resolveColor(c.color);
  const hasBudget = c.budget_amount > 0;
  const over = hasBudget && spent > c.budget_amount;
  const diff = hasBudget ? c.budget_amount - spent : 0;
  const ratio = hasBudget ? Math.min(spent / c.budget_amount, 1) : 0;

  const barColor = (() => {
    if (!hasBudget) return Colors.olive;
    const pct = (spent / c.budget_amount) * 100;
    if (pct >= 100) return Colors.peachDark;
    if (pct >= 80) return Colors.butter;
    return Colors.olive;
  })();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View className='bg-white rounded-3xl p-4' style={Shadows.primary}>
        {/* 1행: 아이콘 + 카테고리명 + 목표·사용 수치 */}
        <View
          className={`flex-row items-center gap-2.5 ${hasBudget ? 'mb-1.5' : ''}`}
        >
          <IconBox color={color}>
            <CategoryIcon iconKey={c.icon} color={color} />
          </IconBox>
          <Text
            className='font-ibm-semibold text-base text-neutral-700 flex-1'
            numberOfLines={1}
          >
            {c.name}
          </Text>
          {hasBudget ? (
            <View className='flex-row items-center gap-1.5'>
              <Text className='font-ibm-regular text-sm text-neutral-500'>
                목표
              </Text>
              <Text className='font-ibm-bold text-base text-neutral-700'>
                {formatAmount(c.budget_amount)}원
              </Text>
              <Text className='font-ibm-regular text-sm text-neutral-500'>
                ·
              </Text>
              <Text className='font-ibm-regular text-sm text-neutral-500'>
                사용
              </Text>
              <Text
                className='font-ibm-bold text-base'
                style={{ color: over ? Colors.peachDark : '#404040' }}
              >
                {formatAmount(spent)}원
              </Text>
            </View>
          ) : (
            <View className='flex-row items-center gap-1.5'>
              <Text className='font-ibm-regular text-sm text-neutral-500'>
                사용
              </Text>
              <Text className='font-ibm-bold text-base text-neutral-700'>
                {formatAmount(spent)}원
              </Text>
            </View>
          )}
        </View>

        {/* 2행: 프로그레스바(flex:2 고정) + 차액 뱃지(flex:1) */}
        {hasBudget && (
          <View className='flex-row items-center gap-1'>
            <View
              className='rounded-full overflow-hidden'
              style={{ flex: 2, height: 6, backgroundColor: '#f0f0f0' }}
            >
              <View
                className='rounded-full h-full'
                style={{ width: `${ratio * 100}%`, backgroundColor: barColor }}
              />
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <View
                className='px-2.5 py-1 rounded-full'
                style={{
                  backgroundColor: over
                    ? `${Colors.peach}40`
                    : `${Colors.olive}30`,
                }}
              >
                <Text
                  className='font-ibm-bold text-sm'
                  style={{
                    color: over ? Colors.peachDarker : Colors.oliveDarker,
                  }}
                >
                  {over
                    ? `초과 ${formatAmount(Math.abs(diff))}원`
                    : `절약 +${formatAmount(diff)}원`}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
