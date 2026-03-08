import { View, Text, Alert } from "react-native";
import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/auth";
import { ClayButton } from "../../components/ui/clay-button";
import { ClayInput } from "../../components/ui/clay-input";
import { FadeInButton } from "../../components/ui/fade-in-button";
import { TopBar } from "../../components/ui/top-bar";
import { useJoinCouple } from "../../hooks/use-couple";
import { useGetUserProfile } from "../../hooks/use-user";

export default function JoinCoupleScreen() {
	const [code, setCode] = useState("");
	const { session, pendingInviteCode, setPendingInviteCode, setUserProfile } =
		useAuthStore();

	const { mutateAsync: joinCouple, isPending } = useJoinCouple();
	const { mutateAsync: getUserProfile } = useGetUserProfile();

	const isReady = code.trim().length === 6;

	useEffect(() => {
		if (pendingInviteCode) {
			setCode(pendingInviteCode);
		}
	}, [pendingInviteCode]);

	async function handleJoin() {
		const trimmed = code.trim().toUpperCase();
		if (trimmed.length !== 6) {
			Alert.alert("알림", "6자리 초대 코드를 입력해 주세요.");
			return;
		}

		try {
			await joinCouple(trimmed);
			const profile = await getUserProfile(session!.user.id);
			setPendingInviteCode(null);
			setUserProfile(profile);
		} catch (e) {
			if (e instanceof Error && e.message === "INVALID_CODE") {
				Alert.alert("오류", "유효하지 않은 초대 코드예요. 다시 확인해 주세요.");
				return;
			}
			Alert.alert("오류", "합류에 실패했습니다. 다시 시도해 주세요.");
		}
	}

	return (
		<View className="flex-1 bg-cream px-8">
			<TopBar />
			<View className="pt-6">
				<Text className="font-ibm-bold text-[40px] text-neutral-700 tracking-tight leading-[52px]">
					초대 코드를{"\n"}입력해요
				</Text>
				<Text className="font-ibm-regular text-base text-neutral-500 mt-2 pl-1">
					파트너에게 받은 6자리 코드를 입력하세요
				</Text>
				<View className="mt-8">
					<ClayInput
						placeholder="ABC123"
						value={code}
						onChangeText={(t) => setCode(t.toUpperCase())}
						maxLength={6}
						autoFocus
						autoCapitalize="characters"
						returnKeyType="done"
						onSubmitEditing={isReady ? handleJoin : undefined}
						inputClassName="font-ibm-bold text-[28px] text-center tracking-widest"
					/>
				</View>
			</View>

			<View className="flex-1" />

			<View style={{ height: 96 }} className="justify-end pb-10">
				<FadeInButton visible={isReady}>
					<ClayButton
						label="합류하기"
						onPress={handleJoin}
						loading={isPending}
					/>
				</FadeInButton>
			</View>
		</View>
	);
}
