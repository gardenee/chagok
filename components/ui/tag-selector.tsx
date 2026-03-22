import { View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/colors';

type TagOption<T extends string = string> = { value: T; label: string };

type TagSelectorProps<T extends string = string> = {
  options: TagOption<T>[];
  value: T | null;
  onChange: (value: T | null) => void;
  error?: boolean;
  errorMessage?: string;
};

export function TagSelector<T extends string = string>({
  options,
  value,
  onChange,
  error,
  errorMessage,
}: TagSelectorProps<T>) {
  return (
    <View>
      <View className='flex-row gap-2'>
        {options.map(({ value: optValue, label }) => {
          const isSelected = value === optValue;
          return (
            <TouchableOpacity
              key={optValue}
              onPress={() => onChange(isSelected ? null : optValue)}
              className={`flex-1 py-2.5 items-center ${isSelected ? 'bg-neutral-200' : 'bg-neutral-100'}`}
              style={{
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: error ? Colors.peachDarker : 'transparent',
              }}
              activeOpacity={0.7}
            >
              <Text
                className={`font-ibm-semibold text-base ${isSelected ? 'text-neutral-800' : 'text-neutral-500'}`}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {error && errorMessage && (
        <Text
          className='font-ibm-regular text-sm mt-1 ml-1'
          style={{ color: Colors.peachDarker }}
        >
          {errorMessage}
        </Text>
      )}
    </View>
  );
}
