import { View, Text } from 'react-native';
import { Colors } from '@/constants/colors';

type FormLabelProps = {
  children: React.ReactNode;
  required?: boolean;
  className?: string;
};

export function FormLabel({ children, required, className }: FormLabelProps) {
  return (
    <View className='mb-2 flex-row items-center ml-1'>
      <Text
        className={`font-ibm-semibold text-base text-neutral-700${className ? ` ${className}` : ''}`}
      >
        {children}
      </Text>
      {required && (
        <Text
          className='font-ibm-semibold text-base ml-0.5'
          style={{ color: Colors.peachDarker }}
        >
          *
        </Text>
      )}
    </View>
  );
}
