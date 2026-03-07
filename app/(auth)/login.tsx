import {
	View,
	Text,
	TouchableOpacity,
	ActivityIndicator,
	Alert,
	Platform,
	StyleSheet,
} from "react-native";
import { useState } from "react";
import { Chrome, MessageCircle, Apple } from "lucide-react-native";
import { signInWithOAuth, signInWithApple } from "../../lib/auth-helpers";
import { Colors } from "../../constants/colors";

type LoadingState = "kakao" | "google" | "apple" | null;

const BOLD = "IBMPlexSansKR-Bold";
const SEMIBOLD = "IBMPlexSansKR-SemiBold";
const REGULAR = "IBMPlexSansKR-Regular";

const TEXT_SHADOW = {
	textShadowColor: "rgba(120, 80, 0, 0.18)",
	textShadowOffset: { width: 0, height: 2 },
	textShadowRadius: 8,
};

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
				style={s.socialBtn}
				activeOpacity={0.75}
			>
				{isLoading ? (
					<ActivityIndicator color={Colors.brown} />
				) : (
					<>
						{icon}
						<Text style={s.socialBtnText}>{label}</Text>
					</>
				)}
			</TouchableOpacity>
		);
	}

	return (
		<View style={s.container}>
			<View style={{ flex: 1 }} />

			{/* 타이틀 */}
			<View style={s.header}>
				<Text style={s.title}>로그인</Text>
				<Text style={s.subtitle}>소셜 계정으로 시작하기</Text>
			</View>

			{/* 소셜 버튼들 */}
			<View style={s.buttons}>
				<SocialButton
					onPress={handleKakao}
					isLoading={loading === "kakao"}
					icon={
						<MessageCircle size={20} color={Colors.brown} strokeWidth={2.5} />
					}
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

			<View style={{ flex: 1 }} />
		</View>
	);
}

const s = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.butter,
		paddingHorizontal: 32,
	},
	header: {
		marginBottom: 32,
	},
	title: {
		fontFamily: BOLD,
		fontSize: 48,
		color: Colors.brown,
		letterSpacing: -1,
	},
	subtitle: {
		fontFamily: REGULAR,
		fontSize: 16,
		color: Colors.brown,
		marginTop: 6,
	},
	buttons: {
		gap: 12,
	},
	socialBtn: {
		width: "100%",
		backgroundColor: "rgba(0,0,0,0.08)",
		borderRadius: 20,
		paddingVertical: 15,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 10,
	},
	socialBtnText: {
		fontFamily: SEMIBOLD,
		fontSize: 16,
		color: Colors.brown,
		...TEXT_SHADOW,
	},
});
