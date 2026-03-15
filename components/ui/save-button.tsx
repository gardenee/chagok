import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Check } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Shadows } from '@/constants/shadows';

type SaveButtonProps = {
  onPress: () => void;
  label?: string;
  isSaving?: boolean;
  disabled?: boolean;
};

export function SaveButton({
  onPress,
  label = '저장',
  isSaving = false,
  disabled = false,
}: SaveButtonProps) {
  const isDisabled = isSaving || disabled;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      className='bg-butter rounded-2xl py-[18px] items-center flex-row justify-center gap-2.5'
      style={{
        opacity: isDisabled ? 0.45 : 1,
        ...Shadows.primary,
      }}
    >
      {isSaving ? (
        <ActivityIndicator color={Colors.brownDark} />
      ) : (
        <>
          <Check size={19} color={Colors.brownDark} strokeWidth={2.5} />
          <Text className='font-ibm-bold text-lg text-brown-dark'>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
