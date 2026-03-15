import { View, Text } from 'react-native';
import { Shadows } from '@/constants/shadows';

type SummaryCardProps = {
  label: string;
  amount: number;
  subtext: string;
};

export function SummaryCard({ label, amount, subtext }: SummaryCardProps) {
  return (
    <View
      className='mx-4 mt-3 bg-butter rounded-3xl px-6 py-6'
      style={Shadows.card}
    >
      <Text className='font-ibm-semibold text-base text-brown-dark mb-1'>
        {label}
      </Text>
      <Text className='font-ibm-bold text-4xl leading-[44px] text-brown-darker'>
        {amount.toLocaleString('ko-KR')}원
      </Text>
      <Text className='font-ibm-regular text-base text-brown-dark mt-1.5'>
        {subtext}
      </Text>
    </View>
  );
}
