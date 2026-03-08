import { View, Text } from 'react-native';

type SummaryCardProps = {
  label: string;
  amount: number;
  subtext: string;
};

export function SummaryCard({ label, amount, subtext }: SummaryCardProps) {
  return (
    <View
      className='mx-4 mt-3 bg-butter rounded-3xl px-6 py-5'
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
      }}
    >
      <Text className='font-ibm-semibold text-sm text-brown-dark mb-1'>
        {label}
      </Text>
      <Text className='font-ibm-bold text-3xl text-brown-dark'>
        {amount.toLocaleString('ko-KR')}원
      </Text>
      <Text className='font-ibm-regular text-xs text-brown-dark mt-1'>
        {subtext}
      </Text>
    </View>
  );
}
