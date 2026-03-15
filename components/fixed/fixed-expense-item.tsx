import { View, Text, TouchableOpacity } from 'react-native';
import { Repeat } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { IconBox } from '@/components/ui/icon-box';
import { CategoryIcon } from '@/components/budget/category-icon';
import { SwipeableDeleteRow } from '@/components/ui/swipeable-delete-row';
import { formatAmount } from '@/utils/format';
import type { FixedExpense, Category } from '@/types/database';

type Props = {
  item: FixedExpense;
  category: Category | undefined;
  onEdit: (item: FixedExpense) => void;
  onDelete: (id: string, name: string) => void;
};

function dueLabel(item: FixedExpense): string {
  const dayMode = item.due_day_mode ?? 'day';
  const adjust = item.business_day_adjust ?? 'none';
  const dayText = dayMode === 'eom' ? '말일' : `${item.due_day}일`;
  if (adjust === 'prev') return `매월 ${dayText} (직전 영업일)`;
  if (adjust === 'next') return `매월 ${dayText} (직후 영업일)`;
  return `매월 ${dayText}`;
}

export function FixedExpenseItem({ item, category, onEdit, onDelete }: Props) {
  const iconColor = category?.color ?? Colors.peach;

  return (
    <SwipeableDeleteRow onDelete={() => onDelete(item.id, item.name)}>
      <TouchableOpacity onPress={() => onEdit(item)} activeOpacity={0.8}>
        <View className='bg-white rounded-3xl px-4 py-3.5 flex-row items-center gap-3'>
          {/* 아이콘 */}
          <IconBox color={iconColor} size='md'>
            {category ? (
              <CategoryIcon
                iconKey={category.icon}
                color={iconColor}
                size={19}
              />
            ) : (
              <Repeat size={19} color={iconColor} strokeWidth={2.5} />
            )}
          </IconBox>

          {/* 이름 + 날짜 + 카테고리 */}
          <View className='flex-1'>
            <Text className='font-ibm-semibold text-sm text-neutral-800'>
              {item.name}
            </Text>
            <View className='flex-row items-center gap-1.5 mt-0.5'>
              <Text className='font-ibm-regular text-xs text-neutral-600'>
                {dueLabel(item)}
              </Text>
              {category && (
                <Text className='font-ibm-regular text-xs text-neutral-600'>
                  · {category.name}
                </Text>
              )}
            </View>
          </View>

          {/* 금액 */}
          <Text className='font-ibm-bold text-sm text-neutral-800'>
            {formatAmount(item.amount)}원
          </Text>
        </View>
      </TouchableOpacity>
    </SwipeableDeleteRow>
  );
}
