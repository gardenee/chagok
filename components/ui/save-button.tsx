import { TouchableOpacity, Text } from 'react-native';
import { Colors } from '@/constants/colors';
import { Shadows } from '@/constants/shadows';
import { DotsLoadingIndicator } from '@/components/ui/dots-loading-indicator';

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
      className='h-14 bg-butter rounded-2xl px-4 items-center justify-center'
      style={{
        opacity: isDisabled ? 0.45 : 1,
        ...Shadows.primary,
      }}
    >
      {isSaving ? (
        <DotsLoadingIndicator color={Colors.brownDark} size={7} />
      ) : (
        <Text className='font-ibm-bold text-lg text-brown-dark'>{label}</Text>
      )}
    </TouchableOpacity>
  );
}
