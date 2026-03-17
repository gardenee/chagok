import '../global.css';
import { useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import { Slot, useRouter, useSegments, SplashScreen } from 'expo-router';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fetchCategories } from '@/services/categories';
import { fetchPaymentMethods } from '@/services/payment-methods';
import { fetchAssets } from '@/services/assets';
import { fetchFixedExpenses } from '@/services/fixed-expenses';
import {
  useFonts,
  IBMPlexSansKR_400Regular,
  IBMPlexSansKR_600SemiBold,
  IBMPlexSansKR_700Bold,
} from '@expo-google-fonts/ibm-plex-sans-kr';
import { useAuthStore } from '@/store/auth';
import { supabase } from '@/lib/supabase';
import { registerMyPushToken } from '@/services/notifications';
import { useNotificationSettingsStore } from '@/store/notification-settings';

Notifications.setNotificationHandler({
  handleNotification: async notification => {
    const {
      partnerTransaction,
      comment,
      fixedExpenseReminder,
      budgetExceeded,
      mySchedule,
      togetherSchedule,
    } = useNotificationSettingsStore.getState();
    const type = notification.request.content.data?.type as string | undefined;

    let shouldShow = true;
    if (type === 'PARTNER_TRANSACTION') shouldShow = partnerTransaction;
    else if (type === 'PARTNER_COMMENT') shouldShow = comment;
    else if (type === 'FIXED_EXPENSE') shouldShow = fixedExpenseReminder;
    else if (type === 'BUDGET_EXCEEDED') shouldShow = budgetExceeded;
    else if (type === 'MY_SCHEDULE') shouldShow = mySchedule;
    else if (type === 'TOGETHER_SCHEDULE') shouldShow = togetherSchedule;

    return {
      shouldShowAlert: shouldShow,
      shouldPlaySound: shouldShow,
      shouldSetBadge: false,
      shouldShowBanner: shouldShow,
      shouldShowList: shouldShow,
    };
  },
});

SplashScreen.preventAutoHideAsync();

const STALE_TIME = 1000 * 60 * 5; // 5분: 불필요한 background refetch 억제

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: STALE_TIME, retry: 1 },
  },
});

async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  if (error && error.code !== 'PGRST116') {
    console.warn('userProfile 조회 실패:', error.message);
  }
  return data ?? null;
}

function RootLayoutNav() {
  const [fontsLoaded] = useFonts({
    'IBMPlexSansKR-Regular': IBMPlexSansKR_400Regular,
    'IBMPlexSansKR-SemiBold': IBMPlexSansKR_600SemiBold,
    'IBMPlexSansKR-Bold': IBMPlexSansKR_700Bold,
  });
  const {
    session,
    userProfile,
    setSession,
    setUserProfile,
    setPendingInviteCode,
  } = useAuthStore();
  const segments = useSegments() as string[];
  const router = useRouter();
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  // 안전망 타이머 ref (여러 effect에서 공유)
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingNotificationRef =
    useRef<Notifications.NotificationResponse | null>(null);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  // 딥링크 캡처 (chagok://join?code=XXXX)
  useEffect(() => {
    function handleDeepLink(url: string) {
      const parsed = Linking.parse(url);
      if (
        parsed.path === 'join' &&
        typeof parsed.queryParams?.code === 'string'
      ) {
        setPendingInviteCode(parsed.queryParams.code);
      }
    }

    Linking.getInitialURL().then(url => {
      if (url) handleDeepLink(url);
    });

    const sub = Linking.addEventListener('url', ({ url }) =>
      handleDeepLink(url),
    );
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Supabase 세션 구독 — 동기 핸들러로 race condition 방지
  useEffect(() => {
    // 안전망: 10초 안에 INITIAL_SESSION이 처리 안 되면 강제 해제
    safetyTimerRef.current = setTimeout(() => {
      setIsProfileLoading(false);
    }, 10000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      // 동기적으로 session만 업데이트 (race condition 방지)
      setSession(newSession);

      if (!newSession) {
        setUserProfile(null);
        if (event === 'INITIAL_SESSION') {
          if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
          setIsProfileLoading(false);
        }
      }
      // newSession이 있을 때 profile 로딩은 별도 effect에서 처리
    });

    return () => {
      subscription.unsubscribe();
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 세션이 생길 때 프로필 조회 (세션 구독과 분리하여 비동기 처리)
  useEffect(() => {
    if (!session) return;

    // 재로그인 시 프로필 조회 완료 전 라우팅 방지
    setIsProfileLoading(true);

    let cancelled = false;

    fetchProfile(session.user.id).then(profile => {
      if (cancelled) return;
      setUserProfile(profile);
      // 프로필 조회 완료 후 로딩 해제 (returning user 깜빡임 방지)
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
      setIsProfileLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id]);

  useEffect(() => {
    if (!userProfile?.id) return;

    registerMyPushToken(userProfile.id).catch(error => {
      console.warn('푸시 토큰 등록 실패:', error);
    });
  }, [userProfile?.id]);

  // coupleId 확보 시 자주 쓰는 데이터 미리 로드 (모달 진입 시 덜컹거림 방지)
  useEffect(() => {
    const coupleId = userProfile?.couple_id;
    if (!coupleId) return;

    queryClient.prefetchQuery({
      queryKey: ['categories', coupleId],
      queryFn: () => fetchCategories(coupleId),
    });
    queryClient.prefetchQuery({
      queryKey: ['payment-methods', coupleId],
      queryFn: () => fetchPaymentMethods(coupleId),
    });
    queryClient.prefetchQuery({
      queryKey: ['assets', coupleId],
      queryFn: () => fetchAssets(coupleId),
    });
    queryClient.prefetchQuery({
      queryKey: ['fixed-expenses', coupleId],
      queryFn: () => fetchFixedExpenses(coupleId),
    });
  }, [userProfile?.couple_id]);

  // 알림 탭 리스너 (앱 실행 중 / 백그라운드)
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      response => {
        pendingNotificationRef.current = response;
      },
    );

    // 앱이 종료된 상태에서 알림 탭으로 열린 경우 (cold start)
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) pendingNotificationRef.current = response;
    });

    return () => sub.remove();
  }, []);

  // 유저가 탭에 들어온 후 pending 알림 처리
  useEffect(() => {
    if (!fontsLoaded || isProfileLoading || !userProfile?.couple_id) return;
    const response = pendingNotificationRef.current;
    if (!response) return;

    pendingNotificationRef.current = null;
    const data = response.notification.request.content.data as Record<
      string,
      string
    >;

    if (data.type === 'PARTNER_TRANSACTION') {
      router.push('/(tabs)/calendar');
    } else if (data.type === 'PARTNER_COMMENT') {
      router.push('/(tabs)/calendar');
    } else if (data.type === 'FIXED_EXPENSE') {
      router.push('/(tabs)/fixed');
    } else if (data.type === 'COUPLE_JOINED') {
      router.push('/(tabs)/settings');
    }
  }, [fontsLoaded, isProfileLoading, userProfile?.couple_id]);

  // 3-way 라우팅 분기
  useEffect(() => {
    if (!fontsLoaded || isProfileLoading) return;

    // 개발용 preview 라우트는 auth 검사 없이 허용
    if (__DEV__ && segments[0] === '(dev)') return;

    const inAuthGroup = segments[0] === '(auth)';
    const inNicknameScreen =
      segments[0] === '(onboarding)' && segments[1] === 'nickname';
    const inCoupleScreen =
      segments[0] === '(onboarding)' &&
      (segments[1] === 'couple' ||
        segments[1] === 'join-couple' ||
        segments[1] === 'create-couple');

    if (!session) {
      // 미로그인 → 인증 화면
      if (!inAuthGroup) router.replace('/(auth)');
    } else if (!userProfile) {
      // 로그인 완료, 프로필 없음 → 닉네임 설정
      if (!inNicknameScreen) router.replace('/(onboarding)/nickname');
    } else if (!userProfile.couple_id) {
      // 프로필 있음, 커플 미연동 → 커플 연동
      if (!inCoupleScreen) router.replace('/(onboarding)/couple');
    } else {
      // 모두 완료 → 메인
      const inTabs = segments[0] === '(tabs)';
      if (!inTabs) router.replace('/(tabs)/fixed');
    }
  }, [fontsLoaded, isProfileLoading, session, userProfile, segments]);

  const isLoading = !fontsLoaded || isProfileLoading;

  return (
    <>
      <Slot />
      {isLoading && (
        <View
          className='absolute bg-cream items-center justify-center'
          style={{ top: 0, left: 0, right: 0, bottom: 0 }}
        >
          {fontsLoaded && (
            <Text className='text-4xl font-ibm-bold text-brown px-2 py-1'>
              차곡
            </Text>
          )}
        </View>
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
  );
}
