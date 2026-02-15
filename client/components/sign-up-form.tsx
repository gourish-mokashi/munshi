// import { SocialConnections } from '@/components/social-connections';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import * as React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { Link, useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

export function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const passwordInputRef = React.useRef<TextInput>(null);

  function onEmailSubmitEditing() {
    passwordInputRef.current?.focus();
  }

  async function onSubmit() {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authClient.signUp.email(
        {
          email,
          password,
          name: name || email.split('@')[0],
        },
        {
          onSuccess: () => {
            router.replace('/(root)/(tabs)/Dashboard');
          },
          onError: (ctx: any) => {
            setError(ctx.error.message || 'Sign up failed');
          },
        }
      );
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="gap-6">
      <Card className="border-border/0 sm:border-border shadow-none sm:shadow-sm sm:shadow-black/5">
        <CardHeader>
          <CardTitle className="text-center text-xl sm:text-left">Create your account</CardTitle>
          <CardDescription className="text-center sm:text-left">
            Welcome! Please fill in the details to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-6">
          <View className="gap-6">
            <View className="gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Your name"
                placeholderTextColor="#d1d5db"
                autoCapitalize="words"
                value={name}
                onChangeText={setName}
                returnKeyType="next"
                submitBehavior="submit"
              />
            </View>
            <View className="gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="m@example.com"
                placeholderTextColor="#d1d5db"
                keyboardType="email-address"
                autoComplete="email"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onSubmitEditing={onEmailSubmitEditing}
                returnKeyType="next"
                submitBehavior="submit"
              />
            </View>
            <View className="gap-1.5">
                <Label htmlFor="password">Password</Label>
              <View className="relative">
                <Input
                  ref={passwordInputRef}
                  id="password"
                  placeholder="Enter your password"
                  placeholderTextColor="#d1d5db"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  returnKeyType="send"
                  onSubmitEditing={onSubmit}
                  className="pr-12"
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute top-0 right-3 bottom-0 justify-center">
                  {showPassword ? (
                    <EyeOff size={20} color="#d1d5db" />
                  ) : (
                    <Eye size={20} color="#d1d5db" />
                  )}
                </Pressable>
              </View>
            </View>
            {error ? <Text className="text-center text-sm text-red-500">{error}</Text> : null}
            <Button className="w-full" disabled={loading} onPress={onSubmit}>
              <Text>{loading ? 'Creating account...' : 'Continue'}</Text>
            </Button>
          </View>
          <Text className="text-center text-sm text-white">
            Already have an account?{' '}
            <Pressable
              onPress={() => {
                router.push('/(auth)/Login');
              }}>
              <Text
                className="text-sm text-white underline underline-offset-4"
                style={{ top: 4.8 }}>
                Sign in
              </Text>
            </Pressable>
          </Text>
        </CardContent>
      </Card>
    </View>
  );
}
