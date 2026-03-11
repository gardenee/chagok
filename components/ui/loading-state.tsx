import { View, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/colors';

type LoadingStateProps = {
  className?: string;
};

export function LoadingState({ className = 'py-12' }: LoadingStateProps) {
  return (
    <View className={`items-center ${className}`}>
      <ActivityIndicator color={Colors.butter} />
    </View>
  );
}
