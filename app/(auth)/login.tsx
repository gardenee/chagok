import {
	View,
	Text,
	TouchableOpacity,
	ActivityIndicator,
	Alert,
	Platform,
} from "react-native";
import { useState } from "react";
import { Chrome, MessageCircle, Apple } from "lucide-react-native";
import { signInWithOAuth, signInWithApple } from "../../lib/auth-helpers";
import { Colors } from "../../constants/colors";

type LoadingState = "kakao" | "google" | "apple" | null;

export default function LoginScreen() {
	const [loading, setLoading] = useState<LoadingState>(null);

	async function handleKakao() {
		try {
			setLoading("kakao");
			await signInWithOAuth("kakao");
		} catch {
			Alert.alert("오류", "카카오 로그인에 실패했습니다. 다시 시도해 주세요.");
		} finally {
			setLoading(null);
		}
	}

	async function handleGoogle() {
		try {
			setLoading("google");
			await signInWithOAuth("google");
		} catch {
			Alert.alert("오류", "구글 로그인에 실패했습니다. 다시 시도해 주세요.");
		} finally {
			setLoading(null);
		}
	}

	async function handleApple() {
		try {
			setLoading("apple");
			await signInWithApple();
		} catch (err: unknown) {
			if (
				err instanceof Error &&
				"code" in (err as { code?: string }) &&
				(err as { code?: string }).code === "ERR_CANCELED"
			) {
				return;
			}
			Alert.alert("오류", "Apple 로그인에 실패했습니다. 다시 시도해 주세요.");
		} finally {
			setLoading(null);
		}
	}

	function SocialButton({
		onPress,
		isLoading,
		icon,
		label,
	}: {
		onPress: () => void;
		isLoading: boolean;
		icon: React.ReactNode;
		label: string;
	}) {
		return (
			<TouchableOpacity
				onPress={onPress}
				disabled={loading !== null}
				className="w-full bg-black/[0.08] rounded-[20px] py-[15px] flex-row items-center justify-center gap-2.5"
				activeOpacity={0.75}
			>
				{isLoading ? (
					<ActivityIndicator color={Colors.brown} />
				) : (
					<>
						{icon}
						<Text className="font-ibm-semibold text-base text-brown">{label}</Text>
					</>
				)}
			</TouchableOpacity>
		);
	}

	return (
		<View className="flex-1 bg-butter px-8">
			<View className="flex-1" />

			<View className="mb-8">
				<Text className="font-ibm-bold text-[48px] text-brown tracking-tight">
					로그인
				</Text>
				<Text className="font-ibm-regular text-base text-brown mt-[6px]">
					소셜 계정으로 시작하기
				</Text>
			</View>

			<View className="gap-3">
				<SocialButton
					onPress={handleKakao}
					isLoading={loading === "kakao"}
					icon={<MessageCircle size={20} color={Colors.brown} strokeWidth={2.5} />}
					label="카카오로 계속하기"
				/>
				<SocialButton
					onPress={handleGoogle}
					isLoading={loading === "google"}
					icon={<Chrome size={20} color={Colors.brown} strokeWidth={2.5} />}
					label="구글로 계속하기"
				/>
				{Platform.OS === "ios" && (
					<SocialButton
						onPress={handleApple}
						isLoading={loading === "apple"}
						icon={<Apple size={20} color={Colors.brown} strokeWidth={2.5} />}
						label="Apple로 계속하기"
					/>
				)}
			</View>

			<View className="flex-1" />
		</View>
	);
}
