import { View, Text, Alert } from "react-native";
import { useState } from "react";
import { MotiView, AnimatePresence } from "moti";
import { useAuthStore } from "../../store/auth";
import { useCreateUserProfile } from "../../hooks/use-user";
import { ClayButton } from "../../components/ui/clay-button";
import { ClayInput } from "../../components/ui/clay-input";

export default function NicknameScreen() {
	const [nickname, setNickname] = useState("");
	const { session, setUserProfile } = useAuthStore();
	const { mutateAsync: createUserProfile, isPending } = useCreateUserProfile();

	const hasInput = nickname.trim().length > 0;

	async function handleComplete() {
		const trimmed = nickname.trim();
		if (!session) return;

		try {
			const profile = await createUserProfile({ userId: session.user.id, nickname: trimmed });
			setUserProfile(profile);
		} catch {
			Alert.alert("오류", "별명 저장에 실패했습니다. 다시 시도해 주세요.");
		}
	}

	return (
		<View className="flex-1 bg-cream px-8">
			<View className="flex-1" />

			<View className="mb-10">
				<Text className="font-ibm-bold text-[40px] text-black tracking-tight">
					별명을 알려주세요
				</Text>
				<Text className="font-ibm-regular text-base text-black/50 mt-2">
					파트너에게 표시되는 이름이에요
				</Text>
			</View>

			<View className="mb-6">
				<ClayInput
					placeholder="예: 꿀꿀이"
					value={nickname}
					onChangeText={setNickname}
					maxLength={10}
					showCounter
					autoFocus
					returnKeyType="done"
					onSubmitEditing={hasInput ? handleComplete : undefined}
				/>
			</View>

			<AnimatePresence>
				{hasInput && (
					<MotiView
						from={{ opacity: 0, translateY: 10 }}
						animate={{ opacity: 1, translateY: 0 }}
						exit={{ opacity: 0, translateY: 10 }}
						transition={{ type: "timing", duration: 220 }}
					>
						<ClayButton
							label="완료"
							onPress={handleComplete}
							loading={isPending}
						/>
					</MotiView>
				)}
			</AnimatePresence>

			<View className="flex-1" />
		</View>
	);
}
