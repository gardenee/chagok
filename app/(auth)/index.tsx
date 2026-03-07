import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ArrowRight } from "lucide-react-native";
import { Colors } from "../../constants/colors";

const BOLD = "IBMPlexSansKR-Bold";
const SEMIBOLD = "IBMPlexSansKR-SemiBold";

export default function IntroScreen() {
	const router = useRouter();

	return (
		<View style={s.container}>
			<View style={s.content}>
				<Text style={s.badge}>공유 가계부</Text>
				<Text style={s.title}>차곡</Text>
				<Text style={s.tagline}>우리 둘이 차곡차곡</Text>

				<TouchableOpacity
					onPress={() => router.push("/(auth)/login")}
					style={s.textButton}
					activeOpacity={0.6}
				>
					<Text style={s.textButtonLabel}>시작하기</Text>
					<ArrowRight size={18} color={Colors.brown} strokeWidth={2.5} />
				</TouchableOpacity>
			</View>
		</View>
	);
}

const s = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.butter,
		paddingHorizontal: 32,
		justifyContent: "center",
		paddingBottom: 60,
	},
	content: {
		alignItems: "flex-start",
		paddingHorizontal: "10%",
	},
	badge: {
		fontFamily: SEMIBOLD,
		fontSize: 13,
		color: Colors.white,
		backgroundColor: "rgba(0,0,0,0.3)",
		paddingHorizontal: 12,
		paddingVertical: 5,
		borderRadius: 20,
		alignSelf: "flex-start",
	},
	title: {
		fontFamily: BOLD,
		fontSize: 80,
		color: Colors.brown,
		letterSpacing: -1.5,
	},
	tagline: {
		fontFamily: SEMIBOLD,
		fontSize: 20,
		color: Colors.brown,
	},
	textButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		marginTop: 48,
	},
	textButtonLabel: {
		fontFamily: BOLD,
		fontSize: 17,
		color: Colors.brown,
	},
});
