import { useState, useEffect } from 'react';
import { View, useColorScheme } from 'react-native';
import Svg, { G, Path, Rect as SvgRect, Defs, ClipPath } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
} from 'react-native-reanimated';
import { THEME } from '@/lib/theme';

const AnimatedRect = Animated.createAnimatedComponent(SvgRect);

type Expression = 'neutral' | 'surprised' | 'lookLeft' | 'lookRight' | 'blink';

interface EyePosition {
  leftEye: { x: number; y: number };
  rightEye: { x: number; y: number };
  height: number;
}

const expressions: Record<Expression, EyePosition> = {
  neutral: {
    leftEye: { x: 18, y: 20 },
    rightEye: { x: 33, y: 20 },
    height: 11,
  },
  surprised: {
    leftEye: { x: 18, y: 10 },
    rightEye: { x: 33, y: 10 },
    height: 11,
  },
  lookLeft: {
    leftEye: { x: 11, y: 14 },
    rightEye: { x: 26, y: 14 },
    height: 11,
  },
  lookRight: {
    leftEye: { x: 30, y: 14 },
    rightEye: { x: 45, y: 14 },
    height: 11,
  },
  blink: {
    leftEye: { x: 18, y: 25 },
    rightEye: { x: 33, y: 25 },
    height: 1,
  },
};

const CIRCLE_PATH =
  'M56 28C56 43.464 43.464 56 28 56C12.536 56 0 43.464 0 28C0 12.536 12.536 0 28 0C43.464 0 56 12.536 56 28Z';

/** How long to stay neutral before the animation loop begins (ms) */
const INITIAL_DELAY = 10_000;

/** How long to pause in neutral between each full animation cycle (ms) */
const CYCLE_BREAK = 10_000;

interface AnimatedAvatarProps {
  size?: number;
}

export default function AnimatedAvatar({ size = 56 }: AnimatedAvatarProps) {
  const [currentExpression, setCurrentExpression] = useState<Expression>('neutral');
  const colorScheme = useColorScheme();
  const mode: 'light' | 'dark' = colorScheme === 'dark' ? 'dark' : 'light';

  // Colors from the theme: circle = foreground, eyes = background
  const circleFill = THEME[mode].foreground;
  const eyeFill = THEME[mode].background;

  const leftEyeX = useSharedValue(expressions.neutral.leftEye.x);
  const leftEyeY = useSharedValue(expressions.neutral.leftEye.y);
  const rightEyeX = useSharedValue(expressions.neutral.rightEye.x);
  const rightEyeY = useSharedValue(expressions.neutral.rightEye.y);
  const eyeHeight = useSharedValue(expressions.neutral.height);

  // Wait INITIAL_DELAY ms in neutral, then start cycling expressions
  useEffect(() => {
    const expressionSequence: Expression[] = [
      'neutral',
      'blink',
      'neutral',
      'surprised',
      'neutral',
      'blink',
      'neutral',
      'lookLeft',
      'neutral',
      'blink',
      'lookRight',
      'neutral',
      'blink',
      'neutral',
    ];
    const timings = [
      1500, 100, 1500, 1200, 1500, 100, 1500, 1200, 1500, 100, 1200, 1500, 100, 1500,
    ];

    let index = 0;
    let timeoutId: ReturnType<typeof setTimeout>;

    const runAnimation = () => {
      setCurrentExpression(expressionSequence[index]);
      const nextDelay = timings[index];
      const isLastInCycle = index === expressionSequence.length - 1;
      index = (index + 1) % expressionSequence.length;
      // After the full cycle ends, pause 10s in neutral before restarting
      timeoutId = setTimeout(runAnimation, isLastInCycle ? nextDelay + CYCLE_BREAK : nextDelay);
    };

    // Initial pause — sit in neutral for INITIAL_DELAY before animating
    timeoutId = setTimeout(runAnimation, INITIAL_DELAY);

    return () => clearTimeout(timeoutId);
  }, []);

  // Drive reanimated shared values when expression changes
  useEffect(() => {
    const eyeData = expressions[currentExpression];
    const springConfig =
      currentExpression === 'blink'
        ? { damping: 30, stiffness: 800 }
        : { damping: 30, stiffness: 400 };

    leftEyeX.value = withSpring(eyeData.leftEye.x, springConfig);
    leftEyeY.value = withSpring(eyeData.leftEye.y, springConfig);
    rightEyeX.value = withSpring(eyeData.rightEye.x, springConfig);
    rightEyeY.value = withSpring(eyeData.rightEye.y, springConfig);
    eyeHeight.value = withSpring(eyeData.height, springConfig);
  }, [currentExpression]);

  const leftEyeAnimatedProps = useAnimatedProps(() => ({
    x: leftEyeX.value,
    y: leftEyeY.value,
    height: eyeHeight.value,
  }));

  const rightEyeAnimatedProps = useAnimatedProps(() => ({
    x: rightEyeX.value,
    y: rightEyeY.value,
    height: eyeHeight.value,
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 56 56" fill="none">
        <Defs>
          <ClipPath id="avatarClip">
            <SvgRect x={0} y={0} width={56} height={56} fill="white" />
          </ClipPath>
        </Defs>
        <G clipPath="url(#avatarClip)">
          {/* Face circle — uses foreground color */}
          <Path d={CIRCLE_PATH} fill={circleFill} />
          {/* Left eye — uses background color */}
          <AnimatedRect fill={eyeFill} width={4} animatedProps={leftEyeAnimatedProps} />
          {/* Right eye — uses background color */}
          <AnimatedRect fill={eyeFill} width={4} animatedProps={rightEyeAnimatedProps} />
        </G>
      </Svg>
    </View>
  );
}