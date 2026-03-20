import { View, Text, TextInput } from 'react-native';
import type { TextInputProps } from 'react-native';
import { Colors } from '@/constants/colors';

type ModalTextInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
  autoFocus?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  className?: string;
  error?: boolean;
};

export function ModalTextInput({
  value,
  onChangeText,
  placeholder,
  maxLength,
  autoFocus,
  keyboardType,
  className = '',
  error = false,
}: ModalTextInputProps) {
  return (
    <View
      className={`bg-neutral-100 rounded-2xl px-4 py-4 ${className}`}
      style={{
        borderWidth: 1.5,
        borderColor: error ? Colors.peachDarker : 'transparent',
      }}
    >
      <TextInput
        className='font-ibm-regular text-base text-neutral-800'
        placeholder={placeholder}
        placeholderTextColor='#A3A3A3'
        value={value}
        onChangeText={onChangeText}
        maxLength={maxLength}
        autoFocus={autoFocus}
        keyboardType={keyboardType}
      />
    </View>
  );
}

type AmountInputProps = {
  value: string;
  onChangeText: (raw: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
  maxLength?: number;
};

export function AmountInput({
  value,
  onChangeText,
  placeholder = '금액 입력',
  className = '',
  error = false,
  maxLength,
}: AmountInputProps) {
  return (
    <View
      className={`bg-neutral-100 rounded-2xl px-4 py-4 flex-row items-center ${className}`}
      style={{
        borderWidth: 1.5,
        borderColor: error ? Colors.peachDarker : 'transparent',
      }}
    >
      <Text className='font-ibm-regular text-base text-neutral-800 mr-2'>
        ₩
      </Text>
      <TextInput
        className='flex-1 font-ibm-regular text-base text-neutral-800'
        placeholder={placeholder}
        placeholderTextColor='#A3A3A3'
        keyboardType='numeric'
        value={value}
        maxLength={maxLength}
        onChangeText={v => onChangeText(v.replace(/[^0-9]/g, ''))}
      />
      <Text className='font-ibm-regular text-base text-neutral-800'>원</Text>
    </View>
  );
}
