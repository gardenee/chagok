import { TouchableOpacity, Text } from 'react-native';
import { Colors } from '@/constants/colors';

type DeleteButtonProps = {
  onPress: () => void;
  label?: string;
  disabled?: boolean;
};

export function DeleteButton({
  onPress,
  label = '삭제',
  disabled = false,
}: DeleteButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      className='h-14 rounded-2xl px-4 items-center justify-center'
      style={{
        opacity: disabled ? 0.45 : 1,
        backgroundColor: Colors.cream,
        borderWidth: 1.5,
        borderColor: Colors.peachDark,
      }}
    >
      <Text
        className='font-ibm-bold text-lg'
        style={{ color: Colors.peachDark }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
