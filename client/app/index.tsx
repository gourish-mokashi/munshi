import { Redirect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, useColorScheme } from 'react-native';
import { authClient } from '@/lib/auth-client';
import { THEME } from '@/lib/theme';

const Home = () => {
  const router = useRouter();
  const colorscheme = useColorScheme();
  const mode: 'light' | 'dark' = colorscheme === 'dark' ? 'dark' : 'light';
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authClient.getSession();
        
        if (session?.data?.session && session?.data?.user) {
          // User is logged in, go to dashboard
          router.replace('/(root)/(tabs)/Dashboard');
        } else {
          // User is not logged in, go to login
          router.replace('/(auth)/Login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // On error, redirect to login
        router.replace('/(auth)/Login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Show loading screen while checking auth
  return (
    <View
      className="flex-1 justify-center items-center"
      style={{ backgroundColor: THEME[mode].background }}
    >
      <ActivityIndicator size="large" color={THEME[mode].foreground} />
    </View>
  );
};

export default Home;
