import { View, Text, TouchableOpacity } from 'react-native';

type DayGridProps = {
  days: number[];
  selected: number | null;
  onSelect: (day: number) => void;
  variant?: 'default' | 'butter';
  formatLabel?: (day: number) => string;
  itemWidth?: number;
  itemHeight?: number;
  className?: string;
};

export function DayGrid({
  days,
  selected,
  onSelect,
  variant = 'default',
  formatLabel = day => String(day),
  itemWidth = 42,
  itemHeight = 40,
  className,
}: DayGridProps) {
  return (
    <View
      className={`flex-row flex-wrap gap-1.5${className ? ` ${className}` : ''}`}
    >
      {days.map(day => {
        const isSelected = selected === day;
        const selectedBg =
          variant === 'butter' ? 'bg-butter' : 'bg-neutral-200';
        const unselectedBg = 'bg-neutral-100';
        const selectedText =
          variant === 'butter'
            ? 'font-ibm-semibold text-brown'
            : 'font-ibm-bold text-neutral-800';
        const unselectedText = 'font-ibm-semibold text-neutral-500';
        return (
          <TouchableOpacity
            key={day}
            onPress={() => onSelect(day)}
            className={`rounded-xl items-center justify-center ${isSelected ? selectedBg : unselectedBg}`}
            style={{ width: itemWidth, height: itemHeight }}
            activeOpacity={0.7}
          >
            <Text
              className={`text-sm ${isSelected ? selectedText : unselectedText}`}
            >
              {formatLabel(day)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
