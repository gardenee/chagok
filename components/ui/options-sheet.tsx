import { View, Text, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { BottomSheet, BottomSheetHeader } from './bottom-sheet';

type Option<T extends string | number> = {
  label: string;
  value: T;
};

type OptionsSheetProps<T extends string | number> = {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: Option<T>[];
  selectedValue: T;
  onSelect: (value: T) => void;
};

export function OptionsSheet<T extends string | number>({
  visible,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
}: OptionsSheetProps<T>) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <BottomSheetHeader title={title} onClose={onClose} />
      <View className='mb-2'>
        {options.map((option, i) => {
          const isSelected = option.value === selectedValue;
          const isLast = i === options.length - 1;
          return (
            <View key={String(option.value)}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onSelect(option.value);
                  onClose();
                }}
                activeOpacity={0.6}
                className='flex-row items-center justify-between py-4'
              >
                <Text
                  className={`font-ibm-semibold text-base ${isSelected ? 'text-brown-dark' : 'text-neutral-700'}`}
                >
                  {option.label}
                </Text>
                {isSelected && (
                  <Check size={18} color={Colors.brownDark} strokeWidth={2.5} />
                )}
              </TouchableOpacity>
              {!isLast && <View className='h-px bg-neutral-100' />}
            </View>
          );
        })}
      </View>
    </BottomSheet>
  );
}
