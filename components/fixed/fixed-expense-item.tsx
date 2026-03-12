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

function ordinalDay(day: number): string {
  return `매월 ${day}일`;
}

export function FixedExpenseItem({ item, category, onEdit, onDelete }: Props) {
  const iconColor = category?.color ?? Colors.peach;

  return (
    <SwipeableDeleteRow onDelete={() => onDelete(item.id, item.name)}>
      <TouchableOpacity onPress={() => onEdit(item)} activeOpacity={0.8}>
        <View
          className='bg-white rounded-3xl px-4 py-3.5 flex-row items-center gap-3'
          style={{
            shadowColor: Colors.brown,
            shadowOpacity: 0.07,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 2 },
          }}
        >
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
              <Text className='font-ibm-regular text-xs text-neutral-500'>
                {ordinalDay(item.due_day)}
              </Text>
              {category && (
                <Text className='font-ibm-regular text-xs text-neutral-400'>
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
