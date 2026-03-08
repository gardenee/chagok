import { View, Text } from 'react-native';
import { MotiView } from 'moti';

export default function HomeScreen() {
  return (
    <View className='flex-1 items-center justify-center bg-cream'>
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 600 }}
      >
        <Text className='text-2xl font-bold text-brown'>차곡</Text>
      </MotiView>
    </View>
  );
}
