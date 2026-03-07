import { Stack } from 'expo-router';

export default function DevLayout() {
  if (!__DEV__) return null;
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
