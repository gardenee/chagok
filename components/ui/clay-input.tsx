import { useState } from "react";
import { View, Text, TextInput, TextInputProps, TouchableOpacity } from "react-native";
import { X } from "lucide-react-native";
import { Colors } from "../../constants/colors";

interface ClayInputProps extends TextInputProps {
	label?: string;
	showCounter?: boolean;
	showClear?: boolean;
	inputClassName?: string;
	error?: boolean;
	errorMessage?: string;
}

export function ClayInput({
	label,
	showCounter = false,
	showClear = false,
	maxLength,
	value = "",
	inputClassName,
	error = false,
	errorMessage,
	onFocus,
	onBlur,
	onChangeText,
	...rest
}: ClayInputProps) {
	const [isFocused, setIsFocused] = useState(false);

	const borderClass = error
		? "border-red-400"
		: isFocused
			? "border-butter"
			: "border-transparent";

	const showBottom = (showCounter && maxLength !== undefined) || (error && errorMessage);
	const showClearButton = showClear && value.length > 0;

	return (
		<View>
			{label && (
				<Text className="font-ibm-semibold text-sm text-brown mb-2">
					{label}
				</Text>
			)}
			<View className="relative">
				<TextInput
					className={`w-full bg-brown/10 rounded-[20px] px-5 py-4 font-ibm-semibold text-lg text-neutral-700 border-2 ${borderClass}${showClearButton ? " pr-12" : ""}${inputClassName ? ` ${inputClassName}` : ""}`}
					placeholderTextColor={Colors.brown + "50"}
					maxLength={maxLength}
					value={value}
					onChangeText={onChangeText}
					onFocus={(e) => {
						setIsFocused(true);
						onFocus?.(e);
					}}
					onBlur={(e) => {
						setIsFocused(false);
						onBlur?.(e);
					}}
					{...rest}
				/>
				{showClearButton && (
					<TouchableOpacity
						onPress={() => onChangeText?.("")}
						className="absolute right-3 top-0 bottom-0 justify-center"
						hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
					>
						<View className="bg-brown/20 rounded-full p-1">
							<X size={14} color={Colors.brown} strokeWidth={2.5} />
						</View>
					</TouchableOpacity>
				)}
			</View>
			{showBottom && (
				<View className="flex-row justify-between mt-2">
					<Text className="font-ibm-regular text-sm text-red-400">
						{error && errorMessage ? errorMessage : ""}
					</Text>
					{showCounter && maxLength !== undefined && (
						<Text className="font-ibm-regular text-sm text-brown/30">
							{value.length}/{maxLength}
						</Text>
					)}
				</View>
			)}
		</View>
	);
}
