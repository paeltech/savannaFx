import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet } from 'react-native';
import type { StackNavigationOptions } from '@react-navigation/stack';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const screenOptions: StackNavigationOptions = {
  headerShown: false,
};

function ErrorFallback({ error }: { error: Error }) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{error.message}</Text>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Axiforma-Regular': require('../assets/fonts/Kastelov - Axiforma Regular.otf'),
    'Axiforma-Medium': require('../assets/fonts/Kastelov - Axiforma Medium.otf'),
    'Axiforma-SemiBold': require('../assets/fonts/Kastelov - Axiforma SemiBold.otf'),
    'Axiforma-Bold': require('../assets/fonts/Kastelov - Axiforma Bold.otf'),
    'Axiforma-Book': require('../assets/fonts/Kastelov - Axiforma Book.otf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (fontError) {
      console.error('Font loading error:', fontError);
    }
  }, [fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
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
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F4C464',
    marginBottom: 16,
  },
  errorMessage: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
