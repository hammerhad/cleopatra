import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { ToastOverlay } from '../src/components/ui/ToastOverlay';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import {
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
  CormorantGaramond_700Bold_Italic,
} from '@expo-google-fonts/cormorant-garamond';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging';
import { useAuthStore } from '../src/stores/authStore';
import { getUserProfile, onUserProfileChange, saveFCMToken } from '../src/services/auth';
import { configureNotifications } from '../src/utils/reminders';
import { Colors } from '../src/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const { setUser, setLoading, clear } = useAuthStore();

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync({
          CormorantGaramond_600SemiBold,
          CormorantGaramond_700Bold,
          CormorantGaramond_700Bold_Italic,
          Inter_400Regular,
          Inter_500Medium,
          Inter_600SemiBold,
          Inter_700Bold,
        });
      } catch (e) {
        console.warn('Font loading error:', e);
      } finally {
        setAppReady(true);
        await SplashScreen.hideAsync();
      }
    }
    prepare();
    configureNotifications();
  }, []);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser: FirebaseAuthTypes.User | null) => {
      if (!firebaseUser) {
        clear();
        return;
      }

      setLoading(true);
      const profile = await getUserProfile(firebaseUser.uid);
      if (profile) {
        setUser(profile);
      } else {
        setLoading(false);
      }

      // Subscribe to real-time profile updates
      const unsubProfile = onUserProfileChange(firebaseUser.uid, (p) => {
        if (p) setUser(p);
        else clear();
      });

      // Save FCM token
      try {
        const token = await messaging().getToken();
        if (token) await saveFCMToken(firebaseUser.uid, token);
        messaging().onTokenRefresh((t) => saveFCMToken(firebaseUser.uid, t));
      } catch {}

      return () => unsubProfile();
    });

    return unsubscribe;
  }, []);

  if (!appReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.ONYX }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={Colors.ONYX} />
        <View style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.ONYX },
            animation: 'fade_from_bottom',
          }}
        >
          <Stack.Screen name="(auth)" options={{ animation: 'none' }} />
          <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
          <Stack.Screen
            name="(modals)/habit-detail"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="(modals)/task-detail"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="(modals)/paywall"
            options={{ presentation: 'fullScreenModal', animation: 'fade' }}
          />
          <Stack.Screen
            name="(modals)/workout-session"
            options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="(modals)/cycle-tracker"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="(modals)/journal-entry"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="(modals)/edit-profile"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
        </Stack>
        <ToastOverlay />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
