import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="nickname" />
      <Stack.Screen name="couple" />
      <Stack.Screen name="create-couple" />
      <Stack.Screen name="join-couple" />
    </Stack>
  );
}
