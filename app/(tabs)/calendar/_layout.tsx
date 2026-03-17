import { Stack } from 'expo-router';

export default function CalendarLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name='index' />
      <Stack.Screen
        name='schedule-form'
        options={{ presentation: 'fullScreenModal' }}
      />
      <Stack.Screen
        name='transaction-form'
        options={{ presentation: 'fullScreenModal' }}
      />
    </Stack>
  );
}
