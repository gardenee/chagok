import { View, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';

type SegmentOption<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  bgClassName?: string;
  className?: string;
  activeTextClassName?: string;
  inactiveTextClassName?: string;
};

export function SegmentControl<T extends string>({
  options,
  value,
  onChange,
  bgClassName = 'bg-butter/40 rounded-3xl',
  className,
  activeTextClassName = 'text-brown',
  inactiveTextClassName = 'text-brown/50',
}: Props<T>) {
  return (
    <View className={`flex-row p-1 ${bgClassName} ${className ?? ''}`}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt.value}
          onPress={() => {
            onChange(opt.value);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          className={`flex-1 py-2.5 rounded-2xl items-center ${value === opt.value ? 'bg-white' : ''}`}
          activeOpacity={0.7}
        >
          <Text
            className={`font-ibm-semibold text-sm ${value === opt.value ? activeTextClassName : inactiveTextClassName}`}
          >
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
