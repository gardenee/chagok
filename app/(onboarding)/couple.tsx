import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Key } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/auth';

const clayShadowPrimary = {
  shadowColor: Colors.brown,
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.18,
  shadowRadius: 14,
  elevation: 6,
};

const clayShadowSecondary = {
  shadowColor: Colors.brown,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 3,
};

export default function CoupleScreen() {
  const router = useRouter();
  const nickname = useAuthStore((s) => s.userProfile?.nickname ?? '');

  return (
    <View className="flex-1 bg-cream px-8">
      <View className="flex-1" />

      <View className="mb-10">
        <Text className="font-ibm-bold text-[40px] text-brown tracking-tight">
          {nickname}님,{'\n'}파트너를 연동해요
        </Text>
        <Text className="font-ibm-regular text-base text-brown/60 mt-2">
          두 사람이 함께 차곡차곡 쌓아요
        </Text>
      </View>

      <View className="gap-3 mb-6">
        <TouchableOpacity
          onPress={() => router.push('/(onboarding)/create-couple')}
          className="w-full bg-butter rounded-[24px] py-5 flex-row items-center justify-center gap-3"
          activeOpacity={0.85}
          style={clayShadowPrimary}
        >
          <Plus size={22} color={Colors.brown} strokeWidth={2.5} />
          <Text className="font-ibm-bold text-base text-brown">새 가계부 만들기</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(onboarding)/join-couple')}
          className="w-full bg-butter/20 rounded-[24px] py-5 flex-row items-center justify-center gap-3"
          activeOpacity={0.85}
          style={clayShadowSecondary}
        >
          <Key size={22} color={Colors.brown} strokeWidth={2.5} />
          <Text className="font-ibm-bold text-base text-brown">초대코드로 합류하기</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1" />
    </View>
  );
}
