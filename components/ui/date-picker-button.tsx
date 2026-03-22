import { TouchableOpacity, Text } from 'react-native';
import { CalendarDays } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

type DatePickerButtonProps = {
  dateStr: string; // "YYYY-MM-DD"
  onPress: () => void;
  className?: string;
};

export function DatePickerButton({
  dateStr,
  onPress,
  className,
}: DatePickerButtonProps) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`bg-neutral-100 rounded-2xl px-4 flex-row items-center gap-2.5 h-[48px]${className ? ` ${className}` : ''}`}
    >
      <CalendarDays size={16} color={Colors.neutralDark} strokeWidth={2} />
      <Text className='font-ibm-regular text-base text-neutral-800'>
        {y}년 {m}월 {d}일
      </Text>
    </TouchableOpacity>
  );
}
