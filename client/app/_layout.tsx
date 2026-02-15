import '../global.css';
import { Stack } from 'expo-router';
import { PortalHost } from '@rn-primitives/portal';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useCallback, useEffect, useState } from 'react';
import * as ExpoSplashScreen from 'expo-splash-screen';
import SplashScreen from '@/components/SplashScreen';
import {
  useFonts,
  PlayfairDisplay_400Regular,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_800ExtraBold,
  PlayfairDisplay_900Black,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_500Medium_Italic,
  PlayfairDisplay_600SemiBold_Italic,
  PlayfairDisplay_700Bold_Italic,
  PlayfairDisplay_800ExtraBold_Italic,
  PlayfairDisplay_900Black_Italic,
} from '@expo-google-fonts/playfair-display';

// Keep the native splash screen visible until we explicitly hide it
ExpoSplashScreen.preventAutoHideAsync();

const Layout = () => {
  const [showSplash, setShowSplash] = useState(true);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_800ExtraBold,
    PlayfairDisplay_900Black,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_500Medium_Italic,
    PlayfairDisplay_600SemiBold_Italic,
    PlayfairDisplay_700Bold_Italic,
    PlayfairDisplay_800ExtraBold_Italic,
    PlayfairDisplay_900Black_Italic,
  });

  useEffect(() => {
    if (fontsLoaded) {
      // Fonts are ready — hide the native splash so our animated one takes over
      ExpoSplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  const onSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  if (!fontsLoaded) {
    // Still loading fonts — native splash is visible, render nothing
    return null;
  }

  return (
    <SafeAreaProvider>
      <View className="flex-1">
        <Stack screenOptions={{ gestureEnabled: true, headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(root)" options={{ headerShown: false }} />
        </Stack>
        <PortalHost />
        {showSplash && <SplashScreen onFinish={onSplashFinish} />}
      </View>
    </SafeAreaProvider>
  );
};

export default Layout;
