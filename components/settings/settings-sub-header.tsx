import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

type Props = {
  title: string;
  rightElement?: React.ReactNode;
  onBack?: () => void;
};

export function SettingsSubHeader({ title, rightElement, onBack }: Props) {
  const router = useRouter();

  return (
    <View className='px-6 pt-6 pb-4 flex-row items-center justify-between'>
      <View className='flex-row items-center'>
        <TouchableOpacity
          onPress={onBack ?? (() => router.back())}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className='-ml-1 mr-1'
        >
          <ChevronLeft size={28} color={Colors.brownDarker} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text className='font-ibm-bold text-2xl text-brown-darker'>
          {title}
        </Text>
      </View>
      {rightElement}
    </View>
  );
}
