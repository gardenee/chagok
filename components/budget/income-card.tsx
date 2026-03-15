import { View, Text, TouchableOpacity } from 'react-native';
import { Shadows } from '@/constants/shadows';
import { resolveColor } from '@/constants/color-map';
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
  const color = resolveColor(c.color);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View className='bg-white rounded-3xl p-4' style={Shadows.primary}>
        <View className='flex-row items-center gap-2.5'>
          <IconBox color={color}>
            <CategoryIcon iconKey={c.icon} color={color} />
          </IconBox>
          <Text
            className='font-ibm-semibold text-base text-neutral-700 flex-1'
            numberOfLines={1}
          >
            {c.name}
          </Text>
          <View className='flex-row items-baseline gap-1'>
            <Text className='font-ibm-regular text-sm text-neutral-400'>
              수입
            </Text>
            <Text className='font-ibm-bold text-base text-neutral-700'>
              {formatAmount(income)}원
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
