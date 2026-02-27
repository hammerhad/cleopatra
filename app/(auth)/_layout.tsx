import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { Colors } from '../../src/theme';

export default function AuthLayout() {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated) {
    if (user?.onboardingComplete) {
      return <Redirect href="/(tabs)/" />;
    }
    return <Redirect href="/(auth)/onboarding" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.ONYX },
        animation: 'slide_from_right',
      }}
    />
  );
}
