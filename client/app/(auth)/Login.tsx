import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { authClient } from '@/lib/auth-client';
import { THEME } from '@/lib/theme';

const Login = () => {
  const router = useRouter();
  const colorscheme = useColorScheme();
  const mode: 'light' | 'dark' = colorscheme === 'dark' ? 'dark' : 'light';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authClient.signIn.email(
        {
          email,
          password,
        },
        {
          onSuccess: () => {
            router.replace('/(root)/(tabs)/Dashboard');
          },
          onError: (ctx) => {
            setError(ctx.error.message || 'Login failed');
          },
        }
      );
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        style={{ backgroundColor: THEME[mode].background }}
      >
        <View
          className="flex-1 px-6 py-12 justify-center"
          style={{ backgroundColor: THEME[mode].background }}
        >
          {/* Header */}
          <View className="mb-10">
            <Text
              className="text-4xl font-playfair-bold tracking-tight mb-2"
              style={{ color: THEME[mode].foreground }}
            >
              Welcome Back
            </Text>
            <Text
              className="text-base"
              style={{ color: THEME[mode].mutedForeground }}
            >
              Sign in to your account to continue
            </Text>
          </View>

          {/* Email Input */}
          <View className="mb-4">
            <Text
              className="text-sm font-semibold mb-2"
              style={{ color: THEME[mode].foreground }}
            >
              Email
            </Text>
            <TextInput
              placeholder="you@example.com"
              placeholderTextColor={THEME[mode].mutedForeground}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
              style={{
                backgroundColor: THEME[mode].input,
                color: THEME[mode].foreground,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 12,
                fontSize: 16,
              }}
            />
          </View>

          {/* Password Input */}
          <View className="mb-6">
            <Text
              className="text-sm font-semibold mb-2"
              style={{ color: THEME[mode].foreground }}
            >
              Password
            </Text>
            <TextInput
              placeholder="Enter your password"
              placeholderTextColor={THEME[mode].mutedForeground}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
              style={{
                backgroundColor: THEME[mode].input,
                color: THEME[mode].foreground,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 12,
                fontSize: 16,
              }}
            />
          </View>

          {/* Error Message */}
          {error && (
            <View className="mb-4 bg-red-100 px-4 py-3 rounded-lg">
              <Text className="text-red-800 text-sm">{error}</Text>
            </View>
          )}

          {/* Login Button */}
          <Pressable
            onPress={handleLogin}
            disabled={loading}
            className={`rounded-lg py-3 mb-4 ${
              loading ? 'opacity-50' : 'opacity-100'
            }`}
            style={{ backgroundColor: '#3b82f6' }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-center text-white font-semibold text-base">
                Sign In
              </Text>
            )}
          </Pressable>

          {/* Signup Link */}
          <View className="flex-row justify-center">
            <Text
              style={{ color: THEME[mode].mutedForeground }}
              className="text-sm"
            >
              Don't have an account?{' '}
            </Text>
            <Link href="/(auth)/Signup" asChild>
              <Pressable>
                <Text className="text-sm font-semibold text-blue-500">
                  Sign up
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Login;
