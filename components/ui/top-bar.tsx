import { View, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Colors } from '../../constants/colors';

interface TopBarProps {
  title?: string;
  onBack?: () => void;
}

export function TopBar({ title, onBack }: TopBarProps) {
  const router = useRouter();

  return (
    <View className='flex-row items-center mt-16 h-10'>
      <TouchableOpacity
        onPress={onBack ?? (() => router.back())}
        className='-ml-1 w-10 h-10 items-center justify-center'
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <ChevronLeft size={28} color={Colors.brownDarker} strokeWidth={2.5} />
      </TouchableOpacity>
      {title ? (
        <Text className='font-ibm-semibold text-base text-brown-darker ml-2'>
          {title}
        </Text>
      ) : null}
    </View>
  );
}
