import { View, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';

type SegmentOption<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  bgClassName?: string;
  activeBgClassName?: string;
  className?: string;
  activeTextClassName?: string;
  inactiveTextClassName?: string;
};

export function SegmentControl<T extends string>({
  options,
  value,
  onChange,
  bgClassName = 'bg-cream-dark/50 rounded-2xl',
  activeBgClassName = 'bg-butter rounded-xl',
  className,
  activeTextClassName = 'text-brown-dark',
  inactiveTextClassName = 'text-brown-dark/80',
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
          className={`flex-1 py-2 items-center ${value === opt.value ? activeBgClassName : ''}`}
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
