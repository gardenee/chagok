import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';

// 개발 환경에서만 접근 가능한 화면 미리보기
// 프로덕션 빌드(__DEV__ === false)에서는 렌더링되지 않음

type Screen = {
  label: string;
  route: string;
  group: string;
};

const SCREENS: Screen[] = [
  { group: '인증', label: '온보딩 (인트로)', route: '/(auth)' },
  { group: '인증', label: '로그인', route: '/(auth)/login' },
  { group: '온보딩', label: '닉네임 설정', route: '/(onboarding)/nickname' },
  { group: '온보딩', label: '커플 연동 선택', route: '/(onboarding)/couple' },
  {
    group: '온보딩',
    label: '가계부 만들기',
    route: '/(onboarding)/create-couple',
  },
  {
    group: '온보딩',
    label: '초대코드 합류',
    route: '/(onboarding)/join-couple',
  },
  { group: '메인', label: '홈 (탭)', route: '/(tabs)' },
];

const GROUPS = [...new Set(SCREENS.map(s => s.group))];

const rowShadow = {
  shadowColor: Colors.brown,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.07,
  shadowRadius: 8,
  elevation: 2,
};

export default function DevPreviewScreen() {
  const router = useRouter();

  if (!__DEV__) return null;

  return (
    <ScrollView
      className='flex-1 bg-cream'
      contentContainerClassName='px-6 pt-16 pb-12'
    >
      <Text className='font-ibm-bold text-[28px] text-brown mb-1'>
        Screen Preview
      </Text>
      <Text className='font-ibm-regular text-sm text-brown/50 mb-8'>
        개발 환경 전용 · 프로덕션 빌드에서는 노출되지 않아요
      </Text>

      {GROUPS.map(group => (
        <View key={group} className='mb-6'>
          <Text className='font-ibm-semibold text-xs text-brown/40 mb-3 tracking-widest uppercase'>
            {group}
          </Text>
          <View className='gap-2'>
            {SCREENS.filter(s => s.group === group).map(screen => (
              <TouchableOpacity
                key={screen.route}
                onPress={() => router.push(screen.route as never)}
                className='bg-butter/20 rounded-[16px] px-5 py-4 flex-row items-center justify-between'
                activeOpacity={0.75}
                style={rowShadow}
              >
                <Text className='font-ibm-semibold text-base text-brown'>
                  {screen.label}
                </Text>
                <Text className='font-ibm-regular text-xs text-brown/40'>
                  {screen.route}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
