import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { resolveColor } from '@/constants/color-map';
import { IconBox } from '@/components/ui/icon-box';
import { CategoryIcon } from '@/components/budget/category-icon';
import { SwipeableDeleteRow } from '@/components/ui/swipeable-delete-row';
import type { Category } from '@/types/database';
import { Colors } from '@/constants/colors';

type Props = {
  c: Category;
  onEdit: (c: Category) => void;
  onDelete: (id: string) => void;
};

export function CategoryRow({ c, onEdit, onDelete }: Props) {
  const color = resolveColor(c.color);
  return (
    <SwipeableDeleteRow onDelete={() => onDelete(c.id)}>
      <TouchableOpacity onPress={() => onEdit(c)} activeOpacity={0.8}>
        <View className='px-4 py-3.5 flex-row items-center gap-3'>
          <IconBox color={color}>
            <CategoryIcon iconKey={c.icon} color={color} />
          </IconBox>
          <Text className='flex-1 font-ibm-semibold text-sm text-neutral-800'>
            {c.name}
          </Text>
          <ChevronRight size={16} color={Colors.neutral} strokeWidth={2} />
        </View>
      </TouchableOpacity>
    </SwipeableDeleteRow>
  );
}
