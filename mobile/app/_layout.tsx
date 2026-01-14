import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import type { StackNavigationOptions } from '@react-navigation/stack';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const screenOptions: StackNavigationOptions = {
  headerShown: false,
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Axiforma-Regular': require('../assets/fonts/Kastelov - Axiforma Regular.otf'),
    'Axiforma-Medium': require('../assets/fonts/Kastelov - Axiforma Medium.otf'),
    'Axiforma-SemiBold': require('../assets/fonts/Kastelov - Axiforma SemiBold.otf'),
    'Axiforma-Bold': require('../assets/fonts/Kastelov - Axiforma Bold.otf'),
    'Axiforma-Book': require('../assets/fonts/Kastelov - Axiforma Book.otf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <View style={{ flex: 1, backgroundColor: '#000000' }}>
          <Stack screenOptions={screenOptions}>
            <Stack.Screen name="index" />
            <Stack.Screen name="auth/login" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="auth/signup" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="home" />
            <Stack.Screen name="signals" />
            <Stack.Screen name="analysis/index" />
            <Stack.Screen name="analysis/[id]" />
          </Stack>
        </View>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
