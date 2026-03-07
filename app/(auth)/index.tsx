import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ArrowRight } from "lucide-react-native";
import { Colors } from "../../constants/colors";

export default function OnboardingScreen() {
	const router = useRouter();

	return (
		<View className="flex-1 bg-butter px-8 justify-center pb-[60px]">
			<View className="items-start px-[5%] pt-[5%]">
				<Text className="font-ibm-bold text-[80px] text-brown tracking-tight">
					차곡
				</Text>
				<Text className="font-ibm-regular text-xl text-neutral-700">
					우리 둘이 차곡차곡{"\n"}써내려가는 공유 가계부
				</Text>

				<TouchableOpacity
					onPress={() => router.push("/(auth)/login")}
					className="flex-row items-center gap-1.5 mt-12"
					activeOpacity={0.6}
				>
					<Text className="font-ibm-bold text-[17px] text-neutral-800">
						시작하기
					</Text>
					<ArrowRight size={18} color={Colors.brown} strokeWidth={3} />
				</TouchableOpacity>
			</View>
		</View>
	);
}
