import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

type Props = {
  year: number;
  month: number; // 0-indexed
  onPrev: () => void;
  onNext: () => void;
  className?: string;
};

export function MonthNavigator({
  year,
  month,
  onPrev,
  onNext,
  className = 'pt-1 pb-4',
}: Props) {
  return (
    <View
      className={`flex-row items-center justify-center gap-5 px-6 ${className}`}
    >
      <TouchableOpacity
        onPress={onPrev}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <ChevronLeft size={20} color='#404040' strokeWidth={2.5} />
      </TouchableOpacity>
      <Text className='font-ibm-semibold text-base text-neutral-700 w-24 text-center'>
        {year}년 {month + 1}월
      </Text>
      <TouchableOpacity
        onPress={onNext}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <ChevronRight size={20} color='#404040' strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}
