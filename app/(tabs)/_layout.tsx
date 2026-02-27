import { Tabs, Redirect } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { CleoTabBar } from '../../src/components/ui/TabBar';

export default function TabsLayout() {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (!isLoading && isAuthenticated && !user?.onboardingComplete) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return (
    <Tabs
      tabBar={(props) => <CleoTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="habits" />
      <Tabs.Screen name="tasks" />
      <Tabs.Screen name="court" />
      <Tabs.Screen name="profile" />
      {/* Accessible via router.push, not shown in tab bar */}
      <Tabs.Screen name="training" options={{ href: null }} />
      <Tabs.Screen name="analytics" options={{ href: null }} />
      <Tabs.Screen name="journal" options={{ href: null }} />
    </Tabs>
  );
}
