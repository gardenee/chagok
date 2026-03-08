import { View, Text, Alert, Share } from "react-native";
import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import { useAuthStore } from "../../store/auth";
import { Colors } from "../../constants/colors";
import { TopBar } from "../../components/ui/top-bar";
import { Shadows } from "../../constants/shadows";
import { ClayButton } from "../../components/ui/clay-button";
import { ClayInput } from "../../components/ui/clay-input";
import { FadeInButton } from "../../components/ui/fade-in-button";
import { useCreateCouple } from "../../hooks/use-couple";
import { useGetUserProfile } from "../../hooks/use-user";
import type { UserProfile } from "../../types/database";

function generateInviteCode(): string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	let code = "";
	for (let i = 0; i < 6; i++) {
		code += chars[Math.floor(Math.random() * chars.length)];
	}
	return code;
}

type Step = "name" | "invite";

export default function CreateCoupleScreen() {
	const [step, setStep] = useState<Step>("name");
	const [bookName, setBookName] = useState("");
	const [inviteCode, setInviteCode] = useState("");
	const [copied, setCopied] = useState(false);
	const [createdProfile, setCreatedProfile] = useState<UserProfile | null>(
		null,
	);
	const { session, setUserProfile } = useAuthStore();

	const { mutateAsync: createCouple, isPending } = useCreateCouple();
	const { mutateAsync: getUserProfile } = useGetUserProfile();

	async function handleCreate() {
		const trimmed = bookName.trim();
		if (!trimmed) {
			Alert.alert("알림", "가계부 이름을 입력해 주세요.");
			return;
		}

		try {
			const code = generateInviteCode();
			await createCouple({ bookName: trimmed, inviteCode: code });

			const profile = await getUserProfile(session!.user.id);
			setCreatedProfile(profile);
			setInviteCode(code);
			setStep("invite");
		} catch {
			Alert.alert("오류", "가계부 생성에 실패했습니다. 다시 시도해 주세요.");
		}
	}

	async function handleCopy() {
		await Clipboard.setStringAsync(inviteCode);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}

	async function handleShare() {
		const deepLink = `chagok://join?code=${inviteCode}`;
		await Share.share({
			message: `차곡 앱에서 같이 가계부를 써요!\n\n초대 코드: ${inviteCode}\n\n앱 설치 후 링크를 탭하거나 코드를 입력하세요:\n${deepLink}`,
		});
	}

	function handleDone() {
		if (createdProfile) setUserProfile(createdProfile);
	}

	if (step === "invite") {
		return (
			<View className="flex-1 bg-cream px-8">
				<View className="pt-32 mb-4">
					<Text className="font-ibm-bold text-[40px] text-neutral-700 tracking-tight leading-[52px]">
						초대코드를{"\n"}짝꿍에게 보내요
					</Text>
					<Text className="font-ibm-regular text-base text-neutral-500 mt-2">
						짝꿍이 코드를 입력하면 연동 완료!
					</Text>
				</View>

				<View className="flex-1 flex-start pt-16">
					<View className="py-8 items-center">
						<Text className="font-ibm-regular text-sm text-neutral-500 mb-1">
							초대 코드
						</Text>
						<Text className="font-ibm-bold text-[44px] text-neutral-700 tracking-widest">
							{inviteCode}
						</Text>
					</View>
				</View>

				<View className="pb-12 gap-3">
					<View className="flex-row items-center gap-3">
						<View className="flex-1">
							<ClayButton
								label="공유하기"
								onPress={handleShare}
								icon={
									<Share2
										size={20}
										color={Colors.brownDark}
										strokeWidth={2.5}
									/>
								}
								size="md"
							/>
						</View>
						<View className="flex-1">
							<ClayButton
								label={copied ? "복사됨!" : "코드 복사"}
								onPress={handleCopy}
								variant="secondary"
								icon={
									copied ? (
										<Check
											size={20}
											color={Colors.brownDark}
											strokeWidth={2.5}
										/>
									) : (
										<Copy
											size={20}
											color={Colors.brownDark}
											strokeWidth={2.5}
										/>
									)
								}
								size="md"
							/>
						</View>
					</View>
					<ClayButton
						label="나중에 연동할게요"
						onPress={handleDone}
						variant="ghost"
						size="md"
					/>
				</View>
			</View>
		);
	}

	return (
		<View className="flex-1 bg-cream px-8">
			<TopBar />
			<View className="pt-6">
				<Text className="font-ibm-bold text-[40px] text-neutral-700 tracking-tight leading-[52px]">
					가계부 이름을{"\n"}뭐라고 부를까요?
				</Text>
				<Text className="font-ibm-regular text-base text-neutral-500 mt-2">
					나중에 바꿀 수 있어요
				</Text>
				<View className="mt-8">
					<ClayInput
						placeholder="예: 개미는뚠뚠"
						value={bookName}
						onChangeText={setBookName}
						maxLength={15}
						showCounter
						autoFocus
						returnKeyType="done"
						onSubmitEditing={handleCreate}
					/>
				</View>
			</View>

			<View className="flex-1" />

			<View style={{ height: 96 }} className="justify-end pb-10">
				<FadeInButton visible={!!bookName.trim()}>
					<ClayButton
						label="다음"
						onPress={handleCreate}
						loading={isPending}
						size="md"
					/>
				</FadeInButton>
			</View>
		</View>
	);
}
