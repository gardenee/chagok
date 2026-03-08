import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/colors';

// 웹 OAuth 콜백 도착 페이지
export default function AuthCallbackScreen() {
  return (
    <View className='flex-1 items-center justify-center bg-cream'>
      <ActivityIndicator size='large' color={Colors.brown} />
    </View>
  );
}
