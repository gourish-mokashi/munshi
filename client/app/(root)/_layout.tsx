import { Stack, useRouter } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, ActivityIndicator } from "react-native";
import ChatInterface from "@/components/ChatInterface";
import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { THEME } from "@/lib/theme";

const Layout = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authClient.getSession();
        if (session?.data?.session && session?.data?.user) {
          setIsAuthenticated(true);
        } else {
          // Redirect to login if not authenticated
          router.replace("/(auth)/Login");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        router.replace("/(auth)/Login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: THEME.light.background,
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return null; // Router will handle the redirect
  }

  return (
    <SafeAreaProvider>
      <>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </>
    </SafeAreaProvider>
  );
};

export default Layout;