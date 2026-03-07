import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Shadows } from '../../constants/shadows';
import { Colors } from '../../constants/colors';

type Variant = 'primary' | 'secondary';

interface ClayButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: Variant;
  icon?: React.ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary: 'bg-butter',
  secondary: 'bg-butter/20',
};

export function ClayButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  icon,
}: ClayButtonProps) {
  const shadow = variant === 'primary' ? Shadows.primary : Shadows.secondary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`w-full ${variantStyles[variant]} rounded-[20px] py-4 flex-row items-center justify-center gap-2.5`}
      activeOpacity={0.85}
      style={shadow}
    >
      {loading ? (
        <ActivityIndicator color={Colors.brown} />
      ) : (
        <>
          {icon}
          <Text className="font-ibm-bold text-base text-brown">{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
