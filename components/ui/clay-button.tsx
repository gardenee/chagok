import { View, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { Shadows } from "../../constants/shadows";
import { Colors } from "../../constants/colors";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

interface ClayButtonProps {
	label: string;
	onPress: () => void;
	loading?: boolean;
	disabled?: boolean;
	variant?: Variant;
	size?: Size;
	icon?: React.ReactNode;
}

const variantStyles: Record<Variant, string> = {
	primary: "bg-butter",
	secondary: "bg-butter/20",
	ghost: "bg-transparent",
};

const textSizeStyles: Record<Size, string> = {
	sm: "text-sm",
	md: "text-base",
	lg: "text-lg",
};

export function ClayButton({
	label,
	onPress,
	loading = false,
	disabled = false,
	variant = "primary",
	size = "lg",
	icon,
}: ClayButtonProps) {
	const isGhost = variant === "ghost";
	const shadow =
		variant === "primary"
			? Shadows.primary
			: variant === "secondary"
				? Shadows.secondary
				: undefined;

	const innerContent = isGhost ? (
		<View
			className="flex-row items-center gap-2.5"
			style={{
				borderBottomWidth: 1.5,
				borderBottomColor: Colors.brownDark,
				paddingBottom: 3,
				paddingHorizontal: 6,
			}}
		>
			{icon}
			<Text
				className={`font-ibm-semibold ${textSizeStyles[size]} text-brown-darker`}
			>
				{label}
			</Text>
		</View>
	) : (
		<View className="flex-row items-center gap-2.5">
			{icon}
			<Text
				className={`font-ibm-semibold ${textSizeStyles[size]} text-brown-darker`}
			>
				{label}
			</Text>
		</View>
	);

	return (
		<TouchableOpacity
			onPress={onPress}
			disabled={disabled || loading}
			className={`w-full ${variantStyles[variant]} rounded-[20px] py-4 flex-row items-center justify-center gap-2.5`}
			activeOpacity={0.85}
			style={
				isGhost
					? undefined
					: [
							shadow,
							{
								borderTopWidth: 2,
								borderTopColor: "rgba(255, 255, 255, 0.65)",
								borderLeftWidth: 1.5,
								borderLeftColor: "rgba(255, 255, 255, 0.4)",
							},
						]
			}
		>
			{loading ? (
				<ActivityIndicator color={Colors.brown} size="small" />
			) : (
				innerContent
			)}
		</TouchableOpacity>
	);
}
