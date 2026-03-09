import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Check } from 'lucide-react-native';
import { Colors } from '../../constants/colors';

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
      className='bg-butter rounded-2xl py-4 items-center flex-row justify-center gap-2'
      style={{
        opacity: isDisabled ? 0.45 : 1,
        shadowColor: Colors.butter,
        shadowOpacity: 0.25,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        borderTopWidth: 2,
        borderTopColor: 'rgba(255, 255, 255, 0.65)',
      }}
    >
      {isSaving ? (
        <ActivityIndicator color={Colors.brownDark} />
      ) : (
        <>
          <Check size={18} color={Colors.brownDark} strokeWidth={2.5} />
          <Text className='font-ibm-bold text-base text-brown-dark'>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
