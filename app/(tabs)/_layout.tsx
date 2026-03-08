import { Tabs } from 'expo-router';
import { Home, CalendarDays, Repeat, Wallet, Landmark, BookCheck } from 'lucide-react-native';
import { Colors } from '../../constants/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.brown,
        tabBarInactiveTintColor: Colors.brown + '55',
        tabBarStyle: {
          backgroundColor: Colors.cream,
          borderTopColor: '#F0E8D0',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 4,
          height: 64,
        },
        tabBarLabelStyle: {
          fontFamily: 'IBMPlexSansKR-SemiBold',
          fontSize: 11,
          marginTop: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: '캘린더',
          tabBarIcon: ({ color, size }) => (
            <CalendarDays size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: '예산·결산',
          tabBarIcon: ({ color, size }) => (
            <BookCheck size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="assets"
        options={{
          title: '자산',
          tabBarIcon: ({ color, size }) => (
            <Landmark size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="fixed"
        options={{
          title: '고정지출',
          tabBarIcon: ({ color, size }) => (
            <Repeat size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  );
}
