import { Tabs } from 'expo-router';
import {
  CalendarDays,
  Repeat,
  Landmark,
  BookCheck,
  Settings,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { useScheduleReminders } from '@/hooks/use-schedules';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  useScheduleReminders();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.brownDark,
        tabBarInactiveTintColor: Colors.brownDark + '55',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          paddingBottom: insets.bottom + 4,
          paddingTop: 4,
          height: 60 + insets.bottom,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -2 },
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontFamily: 'IBMPlexSansKR-SemiBold',
          fontSize: 12,
          marginTop: 1,
        },
      }}
    >
      <Tabs.Screen
        name='fixed'
        options={{
          title: '고정지출',
          tabBarIcon: ({ color, size }) => (
            <Repeat size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name='budget'
        options={{
          title: '예산',
          tabBarIcon: ({ color, size }) => (
            <BookCheck size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name='calendar'
        options={{
          title: '캘린더',
          tabBarIcon: ({ color, size }) => (
            <CalendarDays size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name='assets'
        options={{
          title: '자산',
          tabBarIcon: ({ color, size }) => (
            <Landmark size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name='settings'
        options={{
          title: '설정',
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  );
}
