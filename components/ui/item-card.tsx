import { View, TouchableOpacity } from 'react-native';
import { Shadows } from '@/constants/shadows';

type ItemCardProps = {
  onPress?: () => void;
  children: React.ReactNode;
  className?: string;
};

export function ItemCard({ onPress, children, className }: ItemCardProps) {
  const content = (
    <View
      className={`bg-white rounded-xl px-4 py-4 flex-row items-center gap-3${className ? ` ${className}` : ''}`}
      style={Shadows.primary}
    >
      {children}
    </View>
  );

  if (!onPress) return content;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      {content}
    </TouchableOpacity>
  );
}
