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

const Signup = () => {
  const router = useRouter();
  const colorscheme = useColorScheme();
  const mode: 'light' | 'dark' = colorscheme === 'dark' ? 'dark' : 'light';
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authClient.signUp.email(
        {
          email,
          password,
          name,
        },
        {
          onSuccess: () => {
            router.replace('/(root)/(tabs)/Dashboard');
          },
          onError: (ctx) => {
            setError(ctx.error.message || 'Signup failed');
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
              Create Account
            </Text>
            <Text
              className="text-base"
              style={{ color: THEME[mode].mutedForeground }}
            >
              Sign up to get started
            </Text>
          </View>

          {/* Name Input */}
          <View className="mb-4">
            <Text
              className="text-sm font-semibold mb-2"
              style={{ color: THEME[mode].foreground }}
            >
              Full Name
            </Text>
            <TextInput
              placeholder="John Doe"
              placeholderTextColor={THEME[mode].mutedForeground}
              value={name}
              onChangeText={setName}
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
          <View className="mb-4">
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

          {/* Confirm Password Input */}
          <View className="mb-6">
            <Text
              className="text-sm font-semibold mb-2"
              style={{ color: THEME[mode].foreground }}
            >
              Confirm Password
            </Text>
            <TextInput
              placeholder="Confirm your password"
              placeholderTextColor={THEME[mode].mutedForeground}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
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

          {/* Signup Button */}
          <Pressable
            onPress={handleSignup}
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
                Create Account
              </Text>
            )}
          </Pressable>

          {/* Login Link */}
          <View className="flex-row justify-center">
            <Text
              style={{ color: THEME[mode].mutedForeground }}
              className="text-sm"
            >
              Already have an account?{' '}
            </Text>
            <Link href="/(auth)/Login" asChild>
              <Pressable>
                <Text className="text-sm font-semibold text-blue-500">
                  Sign in
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Signup;
