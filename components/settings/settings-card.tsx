import { View } from 'react-native';

export function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <View
      className='mx-4 bg-cream rounded-3xl overflow-hidden'
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 1 },
      }}
    >
      {children}
    </View>
  );
}

export function Divider() {
  return <View className='h-px bg-cream-dark mx-4' />;
}
