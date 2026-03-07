import { View, Text, TextInput, TextInputProps } from 'react-native';
import { Colors } from '../../constants/colors';

interface ClayInputProps extends TextInputProps {
  label?: string;
  showCounter?: boolean;
  inputClassName?: string;
}

export function ClayInput({ label, showCounter = false, maxLength, value = '', inputClassName, ...rest }: ClayInputProps) {
  return (
    <View>
      {label && (
        <Text className="font-ibm-semibold text-sm text-brown mb-2">{label}</Text>
      )}
      <TextInput
        className={`w-full bg-butter/20 rounded-[20px] px-5 py-4 font-ibm-semibold text-lg text-brown${inputClassName ? ` ${inputClassName}` : ''}`}
        placeholderTextColor={Colors.brown + '50'}
        maxLength={maxLength}
        value={value}
        {...rest}
      />
      {showCounter && maxLength !== undefined && (
        <Text className="font-ibm-regular text-sm text-brown/30 mt-2 text-right">
          {value.length}/{maxLength}
        </Text>
      )}
    </View>
  );
}
