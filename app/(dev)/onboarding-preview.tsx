import { View, Text, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ClayButton } from "../../components/ui/clay-button";

const screens = [
	{ label: "닉네임 설정", route: "/(onboarding)/nickname" },
	{ label: "커플 연동 선택", route: "/(onboarding)/couple" },
	{ label: "가계부 만들기", route: "/(onboarding)/create-couple" },
	{ label: "초대코드 입력", route: "/(onboarding)/join-couple" },
] as const;

export default function OnboardingPreview() {
	const router = useRouter();

	return (
		<ScrollView className="flex-1 bg-cream">
			<View className="px-8 pt-16 pb-12 gap-4">
				<Text className="font-ibm-bold text-[28px] text-brown mb-2">
					🛠 Onboarding Preview
				</Text>
				{screens.map((s) => (
					<ClayButton
						key={s.route}
						label={s.label}
						onPress={() => router.push(s.route as never)}
					/>
				))}
			</View>
		</ScrollView>
	);
}
