import "../global.css";
import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { Slot, useRouter, useSegments, SplashScreen } from "expo-router";
import * as Linking from "expo-linking";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	useFonts,
	IBMPlexSansKR_400Regular,
	IBMPlexSansKR_600SemiBold,
	IBMPlexSansKR_700Bold,
} from "@expo-google-fonts/ibm-plex-sans-kr";
import { useAuthStore } from "../store/auth";
import { supabase } from "../lib/supabase";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
	defaultOptions: {
		queries: { staleTime: 1000 * 60 * 5, retry: 1 },
	},
});

function RootLayoutNav() {
	const [fontsLoaded] = useFonts({
		"IBMPlexSansKR-Regular": IBMPlexSansKR_400Regular,
		"IBMPlexSansKR-SemiBold": IBMPlexSansKR_600SemiBold,
		"IBMPlexSansKR-Bold": IBMPlexSansKR_700Bold,
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
	// 세션 복원 + 프로필 조회 완료 전까지 라우팅 보류 (깜빡임 방지)
	const [isProfileLoading, setIsProfileLoading] = useState(true);

	useEffect(() => {
		if (fontsLoaded) SplashScreen.hideAsync();
	}, [fontsLoaded]);

	// 딥링크 캡처 (chagok://join?code=XXXX)
	useEffect(() => {
		function handleDeepLink(url: string) {
			const parsed = Linking.parse(url);
			if (
				parsed.path === "join" &&
				typeof parsed.queryParams?.code === "string"
			) {
				setPendingInviteCode(parsed.queryParams.code);
			}
		}

		Linking.getInitialURL().then((url) => {
			if (url) handleDeepLink(url);
		});

		const sub = Linking.addEventListener("url", ({ url }) =>
			handleDeepLink(url),
		);
		return () => sub.remove();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Supabase 세션 구독
	useEffect(() => {
		async function fetchProfile(userId: string) {
			const { data, error } = await supabase
				.from("users")
				.select("*")
				.eq("id", userId)
				.single();
			if (error && error.code !== "PGRST116") {
				console.warn("userProfile 조회 실패:", error.message);
			}
			return data ?? null;
		}

		// 안전망: 최대 8초 후 강제로 로딩 해제 (네트워크 행 방지)
		const safetyTimer = setTimeout(() => setIsProfileLoading(false), 8000);

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (event, newSession) => {
			setSession(newSession);
			if (newSession) {
				setUserProfile(await fetchProfile(newSession.user.id));
			} else {
				setUserProfile(null);
			}
			// INITIAL_SESSION: 앱 시작 시 세션 복원 완료 신호
			if (event === "INITIAL_SESSION") {
				clearTimeout(safetyTimer);
				setIsProfileLoading(false);
			}
		});

		return () => {
			subscription.unsubscribe();
			clearTimeout(safetyTimer);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// 3-way 라우팅 분기
	useEffect(() => {
		if (!fontsLoaded || isProfileLoading) return;

		// 개발용 preview 라우트는 auth 검사 없이 허용
		if (__DEV__ && segments[0] === "(dev)") return;

		const inAuthGroup = segments[0] === "(auth)";
		const inNicknameScreen =
			segments[0] === "(onboarding)" && segments[1] === "nickname";
		const inCoupleScreen =
			segments[0] === "(onboarding)" && segments[1] === "couple";

		if (!session) {
			// 미로그인 → 인증 화면
			if (!inAuthGroup) router.replace("/(auth)");
		} else if (!userProfile) {
			// 로그인 완료, 프로필 없음 → 닉네임 설정
			if (!inNicknameScreen) router.replace("/(onboarding)/nickname");
		} else if (!userProfile.couple_id) {
			// 프로필 있음, 커플 미연동 → 커플 연동
			if (!inCoupleScreen) router.replace("/(onboarding)/couple");
		} else {
			// 모두 완료 → 메인
			const inTabs = segments[0] === "(tabs)";
			if (!inTabs) router.replace("/(tabs)");
		}
	}, [fontsLoaded, isProfileLoading, session, userProfile, segments]);

	const isLoading = !fontsLoaded || isProfileLoading;

	return (
		<>
			<Slot />
			{isLoading && (
				<View
					className="absolute bg-cream-dark items-center justify-center"
					style={{ top: 0, left: 0, right: 0, bottom: 0 }}
				>
					{fontsLoaded && (
						<Text className="text-4xl font-ibm-bold text-brown px-2 py-1">
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
