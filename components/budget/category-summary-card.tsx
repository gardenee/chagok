import { View, Text, TextInput } from 'react-native';
import { Colors } from '@/constants/colors';
import { Shadows } from '@/constants/shadows';
import { formatAmount } from '@/utils/format';
import type { Category } from '@/types/database';

type Props = {
  category: Category;
  totalAmount: number;
  budgetInput: string;
  isSavingBudget: boolean;
  onBudgetChange: (v: string) => void;
  onBudgetSave: () => void;
};

export function CategorySummaryCard({
  category,
  totalAmount,
  budgetInput,
  isSavingBudget,
  onBudgetChange,
  onBudgetSave,
}: Props) {
  const isExpense = category.type === 'expense';
  const budget = category.budget_amount ?? 0;
  const ratio = budget > 0 ? Math.min(totalAmount / budget, 1) : 0;
  const over = budget > 0 && totalAmount > budget;

  // expense-card.tsx와 동일한 barColor 로직
  const barColor = (() => {
    if (!isExpense) return over ? Colors.oliveDark : Colors.olive;
    if (budget <= 0) return Colors.olive;
    const pct = (totalAmount / budget) * 100;
    if (pct >= 100) return Colors.peachDark;
    if (pct >= 80) return Colors.butter;
    return Colors.olive;
  })();

  const badgeOver = isExpense ? over : !over; // 지출:초과=나쁨, 수입:미달=나쁨
  const badgeBg = badgeOver ? `${Colors.peach}40` : `${Colors.olive}30`;
  const badgeText = badgeOver ? Colors.peachDarker : Colors.oliveDarker;

  const inputLabel = isExpense ? '월 예산' : '예상 수입';
  const amountLabel = isExpense ? '이번달 지출' : '이번달 수입';

  return (
    <View
      className='mx-4 mt-2 mb-4 rounded-3xl p-5 bg-cream-dark'
      style={Shadows.card}
    >
      {/* 지출/수입 금액 */}
      <Text className='font-ibm-semibold text-base mb-0.5 text-neutral-700'>
        {amountLabel}
      </Text>
      <Text className='font-ibm-bold text-4xl leading-[44px] mb-1 text-brown-darker'>
        {formatAmount(totalAmount)}원
      </Text>

      {/* 프로그레스 바 (지출 예산 설정 시) */}
      {isExpense && budget > 0 && (
        <View className='mb-4'>
          <View className='flex-row justify-between mb-1.5'>
            <Text className='font-ibm-semibold text-base text-neutral-700'>
              {isExpense ? '예산' : '목표'} {formatAmount(budget)}원
            </Text>
            <View
              className='px-2.5 py-1 rounded-full'
              style={{ backgroundColor: badgeBg }}
            >
              <Text
                className='font-ibm-bold text-sm'
                style={{ color: badgeText }}
              >
                {isExpense
                  ? over
                    ? `초과 ${formatAmount(totalAmount - budget)}원`
                    : `절약 +${formatAmount(budget - totalAmount)}원`
                  : over
                    ? `초과달성 +${formatAmount(totalAmount - budget)}원`
                    : `미달 -${formatAmount(budget - totalAmount)}원`}
              </Text>
            </View>
          </View>
          <View
            className='rounded-full overflow-hidden'
            style={{ height: 8, backgroundColor: '#D4C9B0' }}
          >
            <View
              className='rounded-full h-full'
              style={{ width: `${ratio * 100}%`, backgroundColor: barColor }}
            />
          </View>
        </View>
      )}

      {/* 예산 인풋 (지출만) */}
      {isExpense && (
        <View className='flex-row items-center gap-3'>
          <Text className='font-ibm-semibold text-base w-20 text-neutral-700'>
            {inputLabel}
          </Text>
          <View
            className='flex-1 flex-row items-center rounded-xl px-3 bg-neutral-100 h-[36px]'
            style={Shadows.soft}
          >
            <TextInput
              className='flex-1 font-ibm-semibold text-base text-neutral-800'
              value={budgetInput}
              onChangeText={v => onBudgetChange(v.replace(/[^0-9]/g, ''))}
              keyboardType='numeric'
              placeholder='설정 안 함'
              placeholderTextColor='#BDBDBD'
              onBlur={onBudgetSave}
              returnKeyType='done'
              onSubmitEditing={onBudgetSave}
            />
            {budgetInput.length > 0 && (
              <Text className='font-ibm-regular text-base text-neutral-600'>
                원
              </Text>
            )}
          </View>
          {isSavingBudget && (
            <Text
              className='font-ibm-regular text-base'
              style={{ color: '#8C7A5E' }}
            >
              저장중...
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
