import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Key } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/auth';
import { ClayButton } from '../../components/ui/clay-button';

export default function CoupleScreen() {
  const router = useRouter();
  const nickname = useAuthStore(s => s.userProfile?.nickname ?? '');

  return (
    <View className='flex-1 bg-cream px-8'>
      <View className='pt-32 mb-4'>
        <Text className='font-ibm-bold text-[40px] text-neutral-700 tracking-tight leading-[52px]'>
          {nickname}님,{'\n'}둘이서 함께해요
        </Text>
        <Text className='font-ibm-regular text-base text-neutral-500 mt-2'>
          하루하루 차곡차곡
        </Text>
      </View>

      <View className='flex-1' />

      <View className='gap-3 pb-12'>
        <ClayButton
          label='우리의 가계부 만들기'
          onPress={() => router.push('/(onboarding)/create-couple')}
          icon={<Plus size={22} color={Colors.brownDarker} strokeWidth={2.5} />}
        />
        <ClayButton
          label='초대코드로 함께하기'
          onPress={() => router.push('/(onboarding)/join-couple')}
          variant='ghost'
          icon={<Key size={22} color={Colors.brownDarker} strokeWidth={2.5} />}
        />
      </View>
    </View>
  );
}
