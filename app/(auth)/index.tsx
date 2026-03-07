import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ArrowRight } from "lucide-react-native";
import { Colors } from "../../constants/colors";

export default function OnboardingScreen() {
	const router = useRouter();

	return (
		<View className="flex-1 bg-butter px-8 justify-center pb-[60px]">
			<View className="items-start px-[10%]">
				<Text className="font-ibm-semibold text-[13px] text-white bg-black/30 px-3 py-[5px] rounded-[20px] self-start overflow-hidden">
					공유 가계부
				</Text>
				<Text className="font-ibm-bold text-[80px] text-brown tracking-tight">
					차곡
				</Text>
				<Text className="font-ibm-semibold text-xl text-brown">
					우리 둘이 차곡차곡
				</Text>

				<TouchableOpacity
					onPress={() => router.push("/(auth)/login")}
					className="flex-row items-center gap-1.5 mt-12"
					activeOpacity={0.6}
				>
					<Text className="font-ibm-bold text-[17px] text-brown">시작하기</Text>
					<ArrowRight size={18} color={Colors.brown} strokeWidth={2.5} />
				</TouchableOpacity>
			</View>
		</View>
	);
}
