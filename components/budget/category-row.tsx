import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Shadows } from '@/constants/shadows';
import { IconBox } from '@/components/ui/icon-box';
import { CategoryIcon } from '@/components/budget/category-icon';
import { SwipeableDeleteRow } from '@/components/ui/swipeable-delete-row';
import { formatAmount } from '@/utils/format';
import type { Category } from '@/types/database';

type Props = {
  c: Category;
  onEdit: (c: Category) => void;
  onDelete: (id: string) => void;
};

export function CategoryRow({ c, onEdit, onDelete }: Props) {
  return (
    <SwipeableDeleteRow onDelete={() => onDelete(c.id)}>
      <TouchableOpacity onPress={() => onEdit(c)} activeOpacity={0.8}>
        <View
          className='bg-white rounded-3xl px-4 py-3.5 flex-row items-center gap-3'
          style={Shadows.primary}
        >
          <IconBox color={c.color}>
            <CategoryIcon iconKey={c.icon} color={c.color} />
          </IconBox>
          <View className='flex-1'>
            <Text className='font-ibm-semibold text-sm text-neutral-800'>
              {c.name}
            </Text>
            {c.type === 'expense' && c.budget_amount > 0 && (
              <Text className='font-ibm-regular text-xs text-neutral-400'>
                예산 {formatAmount(c.budget_amount)}원
              </Text>
            )}
          </View>
          <ChevronRight size={16} color='#A3A3A3' strokeWidth={2} />
        </View>
      </TouchableOpacity>
    </SwipeableDeleteRow>
  );
}
