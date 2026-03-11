import { View, Text, TextInput } from 'react-native';
import { Colors } from '@/constants/colors';
import { Shadows } from '@/constants/shadows';
import { IconBox } from '@/components/ui/icon-box';
import { CategoryIcon } from '@/components/budget/category-icon';
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
  const ratio =
    category.budget_amount > 0
      ? Math.min(totalAmount / category.budget_amount, 1)
      : 0;
  const over =
    totalAmount > category.budget_amount && category.budget_amount > 0;

  return (
    <View
      className='mx-4 rounded-3xl p-5 mb-4'
      style={{ backgroundColor: Colors.butter, ...Shadows.soft }}
    >
      <View className='flex-row items-center gap-3 mb-4'>
        <IconBox color={category.color} size='md'>
          <CategoryIcon
            iconKey={category.icon}
            color={category.color}
            size={20}
          />
        </IconBox>
        <Text className='font-ibm-bold text-lg text-brown'>
          {category.name}
        </Text>
      </View>

      {isExpense ? (
        <>
          <Text className='font-ibm-regular text-xs text-brown/70 mb-1'>
            이번달 지출
          </Text>
          <Text className='font-ibm-bold text-2xl text-brown mb-3'>
            {formatAmount(totalAmount)}원
          </Text>

          {/* 예산 인풋 */}
          <View className='flex-row items-center gap-2 mb-3'>
            <Text className='font-ibm-semibold text-xs text-brown/70'>
              월 예산
            </Text>
            <View
              className='flex-1 flex-row items-center bg-white/70 rounded-xl px-3'
              style={{ height: 36 }}
            >
              <TextInput
                className='flex-1 font-ibm-semibold text-sm text-brown'
                value={budgetInput}
                onChangeText={onBudgetChange}
                keyboardType='numeric'
                placeholder='예산 금액'
                placeholderTextColor={Colors.brown + '50'}
                onBlur={onBudgetSave}
                returnKeyType='done'
                onSubmitEditing={onBudgetSave}
              />
              <Text className='font-ibm-regular text-sm text-brown/60'>원</Text>
            </View>
            {isSavingBudget && (
              <Text className='font-ibm-regular text-xs text-brown/50'>
                저장중...
              </Text>
            )}
          </View>

          {/* 프로그레스 바 */}
          {category.budget_amount > 0 && (
            <>
              <View className='bg-brown/15 rounded-full h-2 mb-1'>
                <View
                  className='h-2 rounded-full'
                  style={{
                    width: `${ratio * 100}%`,
                    backgroundColor: over ? Colors.peach : category.color,
                  }}
                />
              </View>
              <Text className='font-ibm-semibold text-xs text-brown/70'>
                {over
                  ? `${formatAmount(totalAmount - category.budget_amount)}원 초과`
                  : `${formatAmount(category.budget_amount - totalAmount)}원 남음`}
              </Text>
            </>
          )}
        </>
      ) : (
        <>
          <Text className='font-ibm-regular text-xs text-brown/70 mb-1'>
            이번달 수입
          </Text>
          <Text className='font-ibm-bold text-2xl text-brown'>
            {formatAmount(totalAmount)}원
          </Text>
        </>
      )}
    </View>
  );
}
