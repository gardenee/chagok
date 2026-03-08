import { View, Text, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';
import { Colors } from '../../constants/colors';

type ScreenHeaderProps = {
  title: string;
  onAdd?: () => void;
};

export function ScreenHeader({ title, onAdd }: ScreenHeaderProps) {
  return (
    <View className='flex-row items-center justify-between px-6 pt-6 pb-2'>
      <Text className='font-ibm-bold text-2xl text-brown-darker'>{title}</Text>
      {onAdd && (
        <TouchableOpacity
          onPress={onAdd}
          className='w-10 h-10 rounded-full items-center justify-center'
          activeOpacity={0.6}
        >
          <Plus size={22} color={Colors.brownDarker} strokeWidth={2.5} />
        </TouchableOpacity>
      )}
    </View>
  );
}
