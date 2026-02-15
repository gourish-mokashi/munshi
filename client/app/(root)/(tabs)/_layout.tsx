import { useState } from 'react';
import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ChatInterface from '@/components/ChatInterface';
import CustomTabBar from '@/components/CustomTabBar';
import ScanCamera from '@/components/ScanCamera';
import { authClient } from '@/lib/auth-client';

export const unstable_settings = {
  initialRouteName: 'Dashboard',
};

const Layout = () => {
  const [aiOpen, setAiOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const { data: session } = authClient.useSession();

  const firstName = session?.user?.name?.split(' ')[0]?.toLowerCase() || 'there';

  return (
    <SafeAreaProvider>
      <View className="relative flex-1">
        <View className="bg-background z-40 flex h-32 w-full flex-row items-end justify-start pb-6 pl-4">
          <Text className="text-foreground font-inter text-4xl font-bold tracking-[-0.2rem]">
            hello,
          </Text>
          <Text className="text-foreground font-playfair-medium-italic text-4xl"> {firstName}</Text>
        </View>
        <Tabs
          tabBar={(props) => <CustomTabBar {...props} onAIPress={() => setAiOpen(true)} />}
          screenOptions={{
            headerShown: false,
          }}>
          <Tabs.Screen name="Dashboard" />
          <Tabs.Screen name="Products" />
          <Tabs.Screen name="Stock" />
          <Tabs.Screen name="Profile" />
        </Tabs>
        <ChatInterface
          open={aiOpen}
          onClose={() => setAiOpen(false)}
          onOpenScan={() => setScanOpen(true)}
        />
        <ScanCamera
          visible={scanOpen}
          onClose={() => setScanOpen(false)}
          onCapture={(uri) => {
            console.log('Captured:', uri);
            setScanOpen(false);
          }}
        />
      </View>
    </SafeAreaProvider>
  );
};

export default Layout;
