import { View, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';

type ItemCardProps = {
  onPress?: () => void;
  children: React.ReactNode;
};

export function ItemCard({ onPress, children }: ItemCardProps) {
  const content = (
    <View
      className='bg-white rounded-3xl px-4 py-4 flex-row items-center gap-3'
      style={{
        shadowColor: Colors.brown,
        shadowOpacity: 0.07,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      {children}
    </View>
  );

  if (!onPress) return content;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      {content}
    </TouchableOpacity>
  );
}
