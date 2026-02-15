import { View, Text, Pressable, ActivityIndicator, useColorScheme } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { authClient } from '@/lib/auth-client';
import { THEME } from '@/lib/theme';
import { SignOutIcon } from 'phosphor-react-native';

const Profile = () => {
  const router = useRouter();
  const colorscheme = useColorScheme();
  const mode: 'light' | 'dark' = colorscheme === 'dark' ? 'dark' : 'light';
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      try {
        const session = await authClient.getSession();
        if (session?.data?.user) {
          setUser(session.data.user);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []);

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await authClient.signOut();
      router.replace('/Login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setSigningOut(false);
    }
  };

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: THEME[mode].background }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View
      className="flex-1 px-6 py-8"
      style={{ backgroundColor: THEME[mode].background }}
    >
      {/* Header */}
      <Text
        className="text-3xl font-playfair-bold mb-8 tracking-tight"
        style={{ color: THEME[mode].foreground }}
      >
        Profile
      </Text>

      {/* User Info Card */}
      <View
        className="rounded-2xl p-6 mb-8"
        style={{ backgroundColor: THEME[mode].muted }}
      >
        <View className="mb-4">
          <Text
            className="text-sm font-semibold mb-2"
            style={{ color: THEME[mode].mutedForeground }}
          >
            Name
          </Text>
          <Text
            className="text-xl font-semibold"
            style={{ color: THEME[mode].foreground }}
          >
            {user?.name || 'N/A'}
          </Text>
        </View>

        <View>
          <Text
            className="text-sm font-semibold mb-2"
            style={{ color: THEME[mode].mutedForeground }}
          >
            Email
          </Text>
          <Text
            className="text-base"
            style={{ color: THEME[mode].foreground }}
          >
            {user?.email || 'N/A'}
          </Text>
        </View>
      </View>

      {/* Logout Button */}
      <Pressable
        onPress={handleLogout}
        disabled={signingOut}
        className={`rounded-lg py-3 flex-row items-center justify-center gap-2 ${
          signingOut ? 'opacity-50' : 'opacity-100'
        }`}
        style={{ backgroundColor: '#ef4444' }}
      >
        {signingOut ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <SignOutIcon size={20} color="#fff" weight="bold" />
            <Text className="text-center text-white font-semibold text-base">
              Sign Out
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
};

export default Profile;
