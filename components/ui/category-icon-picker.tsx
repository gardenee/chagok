import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Plus, Wallet } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { resolveColor } from '@/constants/color-map';
import { ICON_MAP } from '@/constants/icon-map';
import type { Category } from '@/types/database';

type CategoryIconPickerProps = {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAdd: () => void;
  onManage?: () => void;
  nameClassName?: string;
  labelClassName?: string;
};

export function CategoryIconPicker({
  categories,
  selectedId,
  onSelect,
  onAdd,
  onManage,
  nameClassName = 'text-[11px]',
  labelClassName = 'text-neutral-600',
}: CategoryIconPickerProps) {
  return (
    <View className='mb-4'>
      <View className='flex-row items-center justify-between mb-2 ml-1 mr-1'>
        <Text className={`font-ibm-semibold text-base ${labelClassName}`}>
          카테고리
        </Text>
        {onManage && categories.length > 0 && (
          <TouchableOpacity
            onPress={onManage}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text
              className={`font-ibm-semibold text-sm ${labelClassName} bg-neutral-200 rounded-2xl px-2.5 py-1`}
            >
              수정
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
      >
        <View className='flex-row gap-2 pr-2'>
          {categories.map(c => {
            const Icon = ICON_MAP[c.icon] ?? Wallet;
            const isSelected = selectedId === c.id;
            const cColor = resolveColor(c.color);
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => {
                  onSelect(isSelected ? null : c.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                className='items-center gap-1'
                activeOpacity={0.7}
              >
                <View
                  className='w-12 h-12 rounded-2xl items-center justify-center'
                  style={{
                    backgroundColor: cColor + '30',
                    borderWidth: isSelected ? 2 : 0,
                    borderColor: isSelected ? cColor : 'transparent',
                  }}
                >
                  <Icon size={20} color={cColor} strokeWidth={2.5} />
                </View>
                <Text
                  className={`font-ibm-semibold ${nameClassName} ${isSelected ? 'text-neutral-800' : 'text-neutral-500'}`}
                >
                  {c.name}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            onPress={onAdd}
            className='items-center gap-1'
            activeOpacity={0.7}
          >
            <View className='w-12 h-12 rounded-2xl items-center justify-center bg-neutral-100 border border-dashed border-neutral-300'>
              <Plus size={18} color='#A3A3A3' strokeWidth={2} />
            </View>
            <Text
              className={`font-ibm-semibold ${nameClassName} text-neutral-600`}
            >
              추가
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
