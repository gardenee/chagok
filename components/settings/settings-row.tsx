import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

type Props = {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  rightElement?: React.ReactNode;
  disabled?: boolean;
};

export function SettingsRow({
  icon,
  label,
  value,
  onPress,
  showChevron = true,
  rightElement,
  disabled = false,
}: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress || disabled}
      activeOpacity={onPress && !disabled ? 0.6 : 1}
      className='flex-row items-center px-4 py-4 bg-cream'
    >
      <View className='w-8 h-8 rounded-xl bg-cream-dark/70 items-center justify-center mr-3'>
        {icon}
      </View>
      <Text
        className={`flex-1 font-ibm-semibold text-sm ${disabled ? 'text-neutral-400' : 'text-neutral-800'}`}
      >
        {label}
      </Text>
      {value ? (
        <Text className='font-ibm-regular text-sm text-neutral-800 mr-1.5'>
          {value}
        </Text>
      ) : null}
      {rightElement ?? null}
      {showChevron && onPress && !disabled ? (
        <ChevronRight size={16} color={Colors.neutralDark} strokeWidth={2} />
      ) : null}
    </TouchableOpacity>
  );
}
