import { ScrollView, View } from 'react-native';
import { SignInForm } from '@/components/sign-in-form';
import AnimatedAvatar from '@/components/AnimatedAvatar';

const Login = () => {
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="bg-background flex-1 items-center justify-center p-4"
      keyboardDismissMode="interactive"
    >
      <View className="w-full max-w-sm items-center gap-6">
        <AnimatedAvatar size={72} />
        <SignInForm />
      </View>
    </ScrollView>
  );
};

export default Login;
