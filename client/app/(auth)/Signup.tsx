import { ScrollView, View } from 'react-native'
import { SignUpForm } from '@/components/sign-up-form'
import AnimatedAvatar from '@/components/AnimatedAvatar'

const Register = () => {
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="bg-background flex-1 items-center justify-center p-4"
      keyboardDismissMode="interactive">
      <View className="w-full max-w-sm items-center gap-6">
        <AnimatedAvatar size={72} />
        <SignUpForm />
      </View>
    </ScrollView>
  )
}

export default Register