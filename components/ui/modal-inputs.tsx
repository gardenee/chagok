import { View, Text, TextInput, TouchableOpacity } from 'react-native';
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
  onFocus?: () => void;
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
  onFocus,
}: ModalTextInputProps) {
  return (
    <View
      className={`bg-neutral-100 rounded-2xl px-4 py-4 h-[48px] ${className}`}
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
        onFocus={onFocus}
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
  // 커스텀 키패드 모드: 두 prop 모두 전달하면 디스플레이 모드로 동작
  focused?: boolean;
  onFocus?: () => void;
};

export function AmountInput({
  value,
  onChangeText,
  placeholder = '금액 입력',
  className = '',
  error = false,
  maxLength,
  focused,
  onFocus,
}: AmountInputProps) {
  const borderColor = error ? Colors.peachDarker : 'transparent';

  if (onFocus !== undefined) {
    // 커스텀 키패드 디스플레이 모드
    const displayValue = value
      ? parseInt(value, 10).toLocaleString('ko-KR')
      : '';

    return (
      <TouchableOpacity
        onPress={onFocus}
        className={`bg-neutral-100 rounded-2xl px-4 h-[48px] flex-row items-center ${className}`}
        style={{ borderWidth: 1.5, borderColor }}
        activeOpacity={0.85}
      >
        <Text className='font-ibm-regular text-base text-neutral-800 mr-2'>
          ₩
        </Text>
        {displayValue ? (
          <View className='flex-1 flex-row items-center'>
            <Text className='font-ibm-regular text-base text-neutral-800'>
              {displayValue}
            </Text>
            {focused && (
              <View
                style={{
                  width: 2,
                  height: 20,
                  backgroundColor: Colors.brown,
                  marginLeft: 2,
                }}
              />
            )}
          </View>
        ) : focused ? (
          <View className='flex-1 flex-row items-center'>
            <View
              style={{ width: 2, height: 20, backgroundColor: Colors.brown }}
            />
          </View>
        ) : (
          <Text
            className='flex-1 font-ibm-regular text-base'
            style={{ color: '#A3A3A3' }}
          >
            {placeholder}
          </Text>
        )}
        <Text className='font-ibm-regular text-base text-neutral-800'>원</Text>
      </TouchableOpacity>
    );
  }

  // 기본 TextInput 모드 (예산 입력 등 커스텀 키패드가 필요 없는 경우)
  return (
    <View
      className={`bg-neutral-100 rounded-2xl px-4 h-[48px] flex-row items-center ${className}`}
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
